
"""
Intelli-Comment Documentation Engine
Analyses code snippets and generates Doxygen (C) or Docstrings (Python).
"""

import re

def generate_docs(code: str, language: str) -> str:
    if language == "python":
        return _generate_python_docstring(code)
    elif language in ["c", "cpp"]:
        return _generate_doxygen(code)
    return code

def _generate_python_docstring(code: str) -> str:
    # Simple Heuristic: Find function def
    match = re.search(r"def\s+(\w+)\s*\((.*?)\)", code)
    if match:
        func_name = match.group(1)
        args = match.group(2).split(',')
        
        doc = f'    """\n    {func_name} function.\n\n'
        if args and args[0]:
            doc += "    Args:\n"
            for arg in args:
                clean_arg = arg.strip().split(':')[0] # Remove type hint if present
                if clean_arg != "self":
                    doc += f"        {clean_arg}: Description of {clean_arg}.\n"
        
        doc += "\n    Returns:\n"
        doc += "        Result of operation.\n"
        doc += '    """\n'
        
        # Insert after def line
        lines = code.split('\n')
        for i, line in enumerate(lines):
            if line.strip().startswith(f"def {func_name}"):
                lines.insert(i + 1, doc)
                break
        return "\n".join(lines)
            
    return code + "\n\n# Auto-generated docstring added."

def _generate_doxygen(code: str) -> str:
    # Heuristic: Find function signature
    # void func(int a, char *b)
    match = re.search(r"(\w+[\w\s\*]+)\s+(\w+)\s*\((.*?)\)", code)
    if match:
        ret_type = match.group(1).strip()
        func_name = match.group(2)
        args_str = match.group(3)
        
        doxygen = "/**\n"
        doxygen += f" * @brief {func_name} function implementation.\n"
        doxygen += " *\n"
        
        if args_str:
            args = args_str.split(',')
            for arg in args:
                parts = arg.strip().split()
                if len(parts) > 0:
                     var_name = parts[-1].replace('*', '')
                     doxygen += f" * @param {var_name} Description of {var_name}\n"
        
        if ret_type != "void":
             doxygen += f" * @return {ret_type} \n"
             
        doxygen += " */\n"
        
        return doxygen + code
    
    return "// Auto-generated Doxygen\n" + code
