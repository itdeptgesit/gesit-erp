
import re

def analyze_jsx(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    tag_stack = []
    brace_stack = []
    errors = []

    # Regex for tags
    # <div ...> -> open
    # </div> -> close
    # <img ... /> -> self close
    # <br> -> void (simplified)

    for i, line in enumerate(lines):
        line_num = i + 1
        # Remove comments roughly
        clean_line = re.sub(r'{/\*.*?\*/}', '', line)
        clean_line = re.sub(r'//.*', '', clean_line)

        # Find all tags and braces in order
        # We need to tokenize strictly
        
        # Simplified parser: 
        # Check braces {}
        # Check tags <...>
        
        # This is hard to do perfectly with regex, but let's try to track simple nesting
        
        # Track braces
        # Ignore braces inside strings
        
        p = 0
        while p < len(clean_line):
            char = clean_line[p]
            
            if char == '{':
                brace_stack.append(line_num)
            elif char == '}':
                if brace_stack:
                    brace_stack.pop()
                else:
                    errors.append(f"Line {line_num}: Unexpected '}}'")
            
            p += 1

    if brace_stack:
        errors.append(f"Unclosed braces starting at: {brace_stack[:5]}...")

    print("Brace analysis complete.")
    for e in errors:
        print(e)

if __name__ == "__main__":
    analyze_jsx(r'c:\Users\itges\Downloads\GESIT WORK\gesit-work\components\HelpdeskManager.tsx')
