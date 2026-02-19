import sqlite3
import chromadb
from chromadb.utils import embedding_functions
import time
import os
import json
from typing import List, Dict, Any, Optional

class EpisodicMemory:
    def __init__(self, db_path: str = "episodic_memory.db", vector_db_path: str = "episodic_vectors"):
        self.db_path = db_path
        self.vector_db_path = vector_db_path
        
        # Initialize SQLite
        self._init_sqlite()
        
        # Initialize ChromaDB
        self.client = chromadb.PersistentClient(path=vector_db_path)
        self.emb_fn = embedding_functions.DefaultEmbeddingFunction()
        self.collection = self.client.get_or_create_collection(
            name="episodic_logs",
            embedding_function=self.emb_fn
        )

    def _init_sqlite(self):
        """Initializes the SQLite table for chronological logs."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                content TEXT,
                project_id TEXT,
                metadata TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def add_episode(self, content: str, project_id: str = "default", metadata: Dict = None):
        """Adds a new episode to both SQLite and Vector Store."""
        timestamp = time.time()
        meta_str = json.dumps(metadata or {})
        
        # 1. SQLite for Timeline
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO episodes (timestamp, content, project_id, metadata) VALUES (?, ?, ?, ?)",
            (timestamp, content, project_id, meta_str)
        )
        episode_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # 2. ChromaDB for Semantic Search
        # We use the SQLite ID as part of the vector ID to link them if needed
        self.collection.add(
            documents=[content],
            metadatas=[{"timestamp": timestamp, "project_id": project_id, "sqlite_id": episode_id}],
            ids=[f"ep_{episode_id}_{int(timestamp)}"]
        )
        print(f"💾 Episode saved: {content[:50]}...")

    def get_recent_episodes(self, limit: int = 1) -> List[Dict]:
        """Retrieves the most recent episodes from SQLite."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM episodes ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    def search_episodes(self, query: str, n_results: int = 3) -> List[Dict]:
        """Semantically searches for related episodes."""
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

# Global Instance
episodic_memory = EpisodicMemory()
