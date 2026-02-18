
import os
import glob
import pickle
import numpy as np
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Configuration
INDEX_FILE = "code_index.pkl"
MODEL_NAME = "all-MiniLM-L6-v2"
EXTENSIONS = [".c", ".py", ".h", ".cpp", ".hpp", ".js", ".ts", ".tsx"]

class CodeIndexer:
    def __init__(self, model_name=MODEL_NAME):
        print(f"Loading embedding model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.index_data = [] # List of dicts: {'path': str, 'content': str, 'embedding': np.array}
        
    def scan_directory(self, root_dir: str):
        """Scans the directory for code files and chunks them."""
        print(f"Scanning directory: {root_dir}")
        file_paths = []
        for ext in EXTENSIONS:
            # Recursive search for each extension
            file_paths.extend(glob.glob(os.path.join(glob.escape(root_dir), f"**/*{ext}"), recursive=True))
            
        print(f"Found {len(file_paths)} files.")
        
        for path in file_paths:
            # Skip virtual environments and node_modules
            if "venv" in path or "node_modules" in path or "__pycache__" in path or "dist" in path:
                continue
                
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if not content.strip():
                        continue
                        
                    # Simple chunking: split by function/class or just fixed size
                    # For now, let's treat small files as one chunk, large files split by lines
                    chunks = self._chunk_content(content)
                    
                    for i, chunk in enumerate(chunks):
                        self.index_data.append({
                            'path': path,
                            'chunk_id': i,
                            'content': chunk,
                            'embedding': None # To be computed
                        })
            except Exception as e:
                print(f"Error reading {path}: {e}")

    def _chunk_content(self, content: str, chunk_size=30) -> List[str]:
        """Splits content into chunks of roughly `chunk_size` lines."""
        lines = content.split('\n')
        chunks = []
        for i in range(0, len(lines), chunk_size):
            chunk = '\n'.join(lines[i:i+chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        return chunks

    def build_index(self):
        """Generates embeddings for all chunks."""
        if not self.index_data:
            print("No data to index.")
            return

        print(f"Generating embeddings for {len(self.index_data)} chunks...")
        texts = [item['content'] for item in self.index_data]
        embeddings = self.model.encode(texts, show_progress_bar=True)
        
        for i, item in enumerate(self.index_data):
            item['embedding'] = embeddings[i]
            
        print("Index build complete.")

    def save_index(self, filepath=INDEX_FILE):
        with open(filepath, 'wb') as f:
            pickle.dump(self.index_data, f)
        print(f"Index saved to {filepath}")

    def load_index(self, filepath=INDEX_FILE):
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                self.index_data = pickle.load(f)
            print(f"Index loaded from {filepath} ({len(self.index_data)} chunks)")
            return True
        return False

    def search(self, query: str, top_k=3) -> List[Tuple[Dict, float]]:
        """Searches the index for the most relevant chunks."""
        if not self.index_data:
            return []
            
        query_embedding = self.model.encode([query])[0]
        
        # Prepare index matrix
        index_embeddings = np.array([item['embedding'] for item in self.index_data])
        
        # Compute cosine similarity
        similarities = cosine_similarity([query_embedding], index_embeddings)[0]
        
        # Get top k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            results.append((self.index_data[idx], similarities[idx]))
            
        return results

# Helper function for external use
def get_indexer():
    idx = CodeIndexer()
    if idx.load_index():
        return idx
    else:
        # Default behavior if no index exists (maybe return empty or build?)
        # For now, return empty or raise
        print("Warning: No index found. Please run indexer.py directly to build it.")
        return idx

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="../", help="Root directory to scan")
    parser.add_argument("--build", action="store_true", help="Build the index")
    parser.add_argument("--query", help="Test query")
    args = parser.parse_args()

    indexer = CodeIndexer()
    
    if args.build:
        indexer.scan_directory(args.root)
        indexer.build_index()
        indexer.save_index()
    
    if args.query:
        if not args.build: # If not just built, load it
            indexer.load_index()
        
        results = indexer.search(args.query)
        print(f"\nTop results for '{args.query}':")
        for res, score in results:
            print(f"--- {res['path']} (Score: {score:.4f}) ---")
            print(res['content'][:200] + "...")
