import os
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Any, Optional
import json

class LoreEngine:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(db_path, exist_ok=True)
        
        # Initialize Persistent Client
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Default embedding function (sentence-transformers/all-MiniLM-L6-v2)
        # Note: In a production environment, this might download model weights on first run.
        self.emb_fn = embedding_functions.DefaultEmbeddingFunction()
        
        self.collection = self.client.get_or_create_collection(
            name="project_lore",
            embedding_function=self.emb_fn
        )

    async def add_lore(self, description: str, metadata: Dict[str, Any]):
        """Adds a 'Lore' shard to the vector database."""
        # Content is the description itself for embedding
        self.collection.add(
            documents=[description],
            metadatas=[metadata],
            ids=[f"lore_{os.urandom(4).hex()}"]
        )

    def search_lore(self, query: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """Searches for relevant lore shards using semantic similarity."""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            lore_hits = []
            if results['documents'] and len(results['documents'][0]) > 0:
                for i in range(len(results['documents'][0])):
                    hit = {
                        "description": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i]
                    }
                    lore_hits.append(hit)
            return lore_hits
        except Exception as e:
            print(f"Lore Search Error: {e}")
            return []

    async def extract_lore_from_diff(self, filename: str, diff_summary: str, call_llm_fn):
        """Uses LLM to decide if a change constitutes 'Lore' and adds it if so."""
        prompt = (
            f"Review this code change summary for {filename}:\n\"{diff_summary}\"\n\n"
            "Does this represent a strategic architectural decision or a user preference "
            "that should be remembered as 'Lore'? (e.g., choice of library, specific logic pattern, "
            "performance trade-off).\n\n"
            "If YES, respond with a JSON object: {\"is_lore\": true, \"description\": \"Concise 1-sentence description of the decision\"}.\n"
            "If NO, respond with: {\"is_lore\": false}.\n"
            "Only return the JSON object."
        )
        
        response = await call_llm_fn(prompt, max_tokens=150)
        try:
            # Extract JSON from potential markdown wrapping
            import re
            json_match = re.search(r"\{.*\}", response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                if data.get("is_lore"):
                    await self.add_lore(
                        data["description"], 
                        {"file": filename, "category": "lore", "type": "strategic"}
                    )
                    return data["description"]
            return None
        except Exception as e:
            print(f"Lore Extraction Error: {e}")
            return None

# Global instance managed by gateway.py
lore_engine: Optional[LoreEngine] = None
