import chromadb
import uuid
import os
from chromadb.utils import embedding_functions

# Use a local persistent directory
DB_PATH = "./chroma_db"

class Memory:
    def __init__(self):
        try:
            self.client = chromadb.PersistentClient(path=DB_PATH)
            
            # Use default embedding function (all-MiniLM-L6-v2) or specify one
            # Chroma default is usually fine for MVP.
            # If sentence-transformers is installed, we can be specific.
            self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
            
            self.collection = self.client.get_or_create_collection(
                name="openclaw_snippets",
                embedding_function=self.ef
            )
            print("🧠 Memory (ChromaDB) initialized.")
        except Exception as e:
            print(f"⚠️ Memory initialization failed: {e}")
            self.collection = None

    def add(self, code: str, language: str, tags: list = None):
        if not self.collection: return
        
        # Simple ID generation
        doc_id = str(uuid.uuid4())
        
        meta = {"language": language}
        if tags:
            meta["tags"] = ",".join(tags)
            
        try:
            self.collection.add(
                documents=[code],
                metadatas=[meta],
                ids=[doc_id]
            )
            print(f"💾 Saved snippet to memory: {doc_id}")
        except Exception as e:
            print(f"⚠️ Failed to save to memory: {e}")

    def search(self, query: str, n_results=2):
        if not self.collection: return []
        
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            # Flatten results
            documents = results['documents'][0]
            metadatas = results['metadatas'][0]
            
            combined = []
            for doc, meta in zip(documents, metadatas):
                combined.append({"code": doc, "metadata": meta})
            
            return combined
        except Exception as e:
            print(f"⚠️ Memory search failed: {e}")
            return []
