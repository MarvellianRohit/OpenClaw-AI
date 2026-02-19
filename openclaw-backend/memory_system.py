import sqlite3
import os
import json
from typing import List, Dict, Any, Optional
from cryptography.fernet import Fernet

class MemorySystem:
    def __init__(self, db_path: str, encryption_key: Optional[bytes] = None):
        self.db_path = db_path
        # In a real scenario, the key would be securely managed. 
        # For this phase, we generate or use a provided one.
        if not encryption_key:
            self.key = Fernet.generate_key()
        else:
            self.key = encryption_key
        
        self.fernet = Fernet(self.key)
        self._init_db()

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT, -- 'preference' or 'decision'
                content TEXT, -- Encrypted JSON
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()

    def _encrypt(self, data: str) -> str:
        return self.fernet.encrypt(data.encode()).decode()

    def _decrypt(self, encrypted_data: str) -> str:
        return self.fernet.decrypt(encrypted_data.encode()).decode()

    def add_memory(self, category: str, data: Dict[str, Any]):
        """Adds a new memory to the system."""
        encrypted_content = self._encrypt(json.dumps(data))
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO memories (category, content) VALUES (?, ?)",
            (category, encrypted_content)
        )
        conn.commit()
        conn.close()

    def get_memories(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves and decrypts memories."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        if category:
            cursor.execute("SELECT content, timestamp FROM memories WHERE category = ? ORDER BY timestamp DESC", (category,))
        else:
            cursor.execute("SELECT content, timestamp FROM memories ORDER BY timestamp DESC")
        
        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            try:
                decrypted = self._decrypt(row[0])
                data = json.loads(decrypted)
                data['timestamp'] = row[1]
                results.append(data)
            except:
                continue
        return results

    def get_context_string(self) -> str:
        """Generates a summary string of memories for LLM context."""
        memories = self.get_memories()
        if not memories:
            return ""
        
        context = "Relevant User Preferences & Project Decisions:\n"
        for m in memories[:10]: # Top 10 for context
            context += f"- {m.get('description', 'Memory shard')}\n"
        return context

# Global instance to be managed by gateway.py
memory_system: Optional[MemorySystem] = None
