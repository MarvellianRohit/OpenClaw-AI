import sqlite3
import chromadb
from chromadb.utils import embedding_functions
import time
import os
import json
import fitz # PyMuPDF
from typing import List, Dict, Any

class RAGSystem:
    def __init__(self, db_path="rag_metadata.db", vector_db_path="rag_vectors"):
        self.db_path = db_path
        self._init_sqlite()
        
        self.client = chromadb.PersistentClient(path=vector_db_path)
        self.emb_fn = embedding_functions.DefaultEmbeddingFunction()
        self.collection = self.client.get_or_create_collection(
            name="rag_documents",
            embedding_function=self.emb_fn
        )

    def _init_sqlite(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                upload_time REAL,
                chunk_count INTEGER
            )
        ''')
        conn.commit()
        conn.close()

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += chunk_size - overlap
        return chunks

    def ingest_file(self, filepath: str, filename: str):
        text = ""
        ext = filename.split('.')[-1].lower()
        
        if ext == 'pdf':
            doc = fitz.open(filepath)
            for page in doc:
                text += page.get_text() + "\n"
        else:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
                
        chunks = self._chunk_text(text)
        if not chunks:
            return 0
            
        timestamp = time.time()
        
        # Save to SQLite
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO documents (filename, upload_time, chunk_count) VALUES (?, ?, ?)",
            (filename, timestamp, len(chunks))
        )
        doc_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Save to Chroma
        ids = [f"rag_{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [{"filename": filename, "doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]
        
        # Batch insert to handle large docs
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            self.collection.add(
                documents=chunks[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size],
                ids=ids[i:i+batch_size]
            )
            
        return len(chunks)

    def search(self, query: str, n_results: int = 3) -> List[Dict]:
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        hits = []
        if results['documents'] and len(results['documents'][0]) > 0:
            for i in range(len(results['documents'][0])):
                hits.append({
                    "content": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i] if 'distances' in results else None
                })
        return hits

rag_system = RAGSystem()
