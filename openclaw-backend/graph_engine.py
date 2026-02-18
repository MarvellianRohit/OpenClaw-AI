
import ast
import os
import re
from typing import Dict, List, Any

class KnowledgeGraph:
    def __init__(self, root_dir: str):
        self.root_dir = os.path.abspath(root_dir)
        self.graph = {
            "functions": {}, # name -> {defined_in, calls: [], called_by: []}
            "variables": {}, # name -> {modified_in: []}
            "files": {}      # path -> {functions: [], imports: []}
        }

    def build_graph(self):
        for root, _, files in os.walk(self.root_dir):
            for file in files:
                if file.startswith("."): continue
                path = os.path.join(root, file)
                
                if file.endswith(".py"):
                    self._parse_python(path)
                elif file.endswith(".c") or file.endswith(".h"):
                    self._parse_c(path)

    def _parse_python(self, path: str):
        try:
            with open(path, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read())
            
            rel_path = os.path.relpath(path, self.root_dir)
            self.graph["files"][rel_path] = {"functions": [], "imports": []}

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        self.graph["files"][rel_path]["imports"].append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        self.graph["files"][rel_path]["imports"].append(node.module)

                if isinstance(node, ast.FunctionDef):
                    func_name = node.name
                    self.graph["functions"][func_name] = {
                        "defined_in": rel_path,
                        "line": node.lineno,
                        "calls": [] 
                    }
                    self.graph["files"][rel_path]["functions"].append(func_name)
                    
                    # Analyze body for calls (simplified)
                    for subnode in ast.walk(node):
                        if isinstance(subnode, ast.Call):
                            if isinstance(subnode.func, ast.Name):
                                self.graph["functions"][func_name]["calls"].append(subnode.func.id)
                            elif isinstance(subnode.func, ast.Attribute):
                                self.graph["functions"][func_name]["calls"].append(subnode.func.attr)

        except Exception as e:
            print(f"Error parsing {path}: {e}")

    def _parse_c(self, path: str):
        # Very simple regex parsing for C
        rel_path = os.path.relpath(path, self.root_dir)
        self.graph["files"][rel_path] = {"functions": [], "imports": []}
        
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Parse Includes
        include_pattern = re.compile(r'#include\s*[<"]([^>"]+)[>"]')
        includes = include_pattern.findall(content)
        self.graph["files"][rel_path]["imports"] = includes

        # Find Function Definitions: type name(...) {
        # regex is brittle but works for demo
        func_pattern = re.compile(r'\w+\s+(\w+)\s*\([^)]*\)\s*\{')
        matches = func_pattern.finditer(content)
        
        for match in matches:
            func_name = match.group(1)
            if func_name in ["if", "for", "while", "switch"]: continue
            
            self.graph["functions"][func_name] = {
                "defined_in": rel_path,
                "calls": []
            }
            self.graph["files"][rel_path]["functions"].append(func_name)

    def query(self, query_type: str, target: str):
        if query_type == "definition":
            return self.graph["functions"].get(target)
        return None

    def get_context_summary(self) -> str:
        """
        Returns a concise summary of the project structure for LLM Context.
        """
        return summary

    def get_project_map(self) -> str:
        """
        Returns a detailed textual map of the project for KV Caching.
        Includes file structure, key functions, and common external libraries.
        """
        map_str = "OPENCLAW PROJECT MAP:\n"
        
        # 1. External Libraries
        libraries = set()
        for data in self.graph["files"].values():
            for imp in data.get("imports", []):
                # Heuristic: simple names often external, paths often internal. 
                # Better: check if it's in our file list?
                # For now, just collect all unique imports.
                libraries.add(imp)
        
        # Filter internal modules (approximation)
        internal_modules = {os.path.splitext(f)[0].replace("/", ".") for f in self.graph["files"].keys()}
        external_libs = [lib for lib in libraries if lib not in internal_modules and "." not in lib] # Simple heuristic
        
        if external_libs:
            map_str += f"Common Libraries: {', '.join(sorted(external_libs))}\n\n"

        # 2. File Structure
        for file_path, data in sorted(self.graph["files"].items()):
            map_str += f"File: {file_path}\n"
            funcs = data.get("functions", [])
            if funcs:
                map_str += f"  Functions: {', '.join(funcs)}\n"
            imports = data.get("imports", [])
            if imports:
                 # filter imports to show only significant ones? 
                 pass
            map_str += "\n"
            
        return map_str

    def get_dependency_graph(self):
        """
        Returns nodes and links for force-directed graph.
        """
        nodes = []
        links = []
        
        # Files as nodes (Group 1)
        for file_path in self.graph["files"]:
            nodes.append({"id": file_path, "group": 1, "radius": 5})
            
            # Imports as links (File -> File/Module)
            for imp in self.graph["files"][file_path]["imports"]:
                # Try to map import to a known file
                target = None
                for potential_path in self.graph["files"]:
                    if imp in potential_path: # simplified matching
                        target = potential_path
                        break
                
                if target:
                    links.append({"source": file_path, "target": target, "value": 1})
                else:
                    # External dependency node (Group 2)
                    if not any(n["id"] == imp for n in nodes):
                        nodes.append({"id": imp, "group": 2, "radius": 3})
                    links.append({"source": file_path, "target": imp, "value": 1})

        # Functions as nodes (Group 3) - Optional, might clutter
        # for func, data in self.graph["functions"].items():
        #     nodes.append({"id": func, "group": 3})
        #     links.append({"source": data["defined_in"], "target": func, "value": 2})

        return {"nodes": nodes, "links": links}

    def identify_symbol(self, code: str, line: int, filepath: str) -> Dict[str, Any]:
        """
        Identifies the function/class at the given line number.
        Returns: { "function": "name", "class": "name", "path": "file/path" }
        """
        result = {"function": None, "class": None, "path": filepath}
        
        if filepath.endswith(".py"):
            try:
                tree = ast.parse(code)
                best_node = None
                best_range = float('inf')
                parent_class = None

                # Custom walker to track parent class
                # But simple smallest-range check is often sufficient for breadcrumb
                
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                        start = getattr(node, 'lineno', 0)
                        end = getattr(node, 'end_lineno', float('inf'))
                        if start <= line <= end:
                            length = end - start
                            if length < best_range:
                                best_range = length
                                best_node = node
                
                if best_node:
                    if isinstance(best_node, ast.ClassDef):
                        result["class"] = best_node.name
                    else:
                        result["function"] = best_node.name
                        # Try to find if it's strictly inside a class? 
                        # For simple breadcrumb, just function name is good.
                        
            except Exception:
                pass

        elif filepath.endswith(".c") or filepath.endswith(".h") or filepath.endswith(".cpp"):
             # Regex approach for C: Find last function definition before line
             try:
                 lines = code.split('\n')
                 # Search backwards from the current line
                 for i in range(min(line - 1, len(lines) - 1), -1, -1):
                     txt = lines[i]
                     # Basic functional pattern: ReturnType FuncName(...) {
                     # Ignore control structures
                     if re.search(r'\)\s*\{', txt) and not re.search(r'\b(if|for|while|switch|catch)\b', txt):
                         match = re.search(r'\b(\w+)\s*\(', txt)
                         if match:
                             result["function"] = match.group(1)
                             break
                     if txt.strip() == "}": 
                         # If we hit a closing brace before an opening one when going back, 
                         # we might be outside? 
                         # This logic is flawed for nested scopes but acceptable for a simple "what function am I in" heuristic 
                         # if we assume standard formatting.
                         # Actually, standard C formatting puts } at start of line.
                         # Let's just stick to "last function header seen".
                         pass
             except:
                 pass
             
        return result

# Singleton
project_graph = KnowledgeGraph(".")
