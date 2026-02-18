
import sys

path = r'c:\Users\itges\Downloads\GESIT WORK\gesit-work\components\HelpdeskManager.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Fix the start (Line 865)
    if 'isITStaff && (' in line and 860 < i + 1 < 870:
        new_lines.append(line.replace('isITStaff && (', 'isITStaff ? ('))
        continue
    
    # Fix the bridge (Line 1238-1241 area)
    if 'RIGHT COLUMN: Ticket Info & Actions' in line:
        # Looking for the stray div and malformed guard
        # We'll just replace the whole block from 1235 to 1242 approx
        # We need to find the context
        pass
    
    new_lines.append(line)

# Actually, a regex replacement on the whole text is better
text = "".join(lines)

# 1. Transform Boolean guard to Ternary
text = text.replace('{isITStaff && (', '{isITStaff ? (')

# 2. Fix the structural mess in the middle
# We'll search for the transition from chat to right sidebar
# and normalize it.
import re

# Find the end of the center column and the start of the right column
# The mess looks like:
# )}
# </div>
# </div>
# {selectedTicket && (
# ... or similar

# Let's be bold: find the IT Staff block and ensure it's balanced.
# Since I'm an AI, I can just reconstruct the main container structure.

# I'll just use the knowledge that I want:
# )} (closes chat toggle/messages)
# </div> (closes center area)
# </div> (closes outer flex row)
# ) : ( (closes isITStaff true block)
# ... client ui ...
# )} (closes ternary)

# Wait, I'll just use a simple approach: 
# Find the specific markers I know are there.

# I'll use a very specific replacement for the block that I know is broken.
pattern = re.compile(r'\}\s+\)\s+\}\s+</div >\s+/\* Image Preview Modal \*/', re.DOTALL)
# replacement = ...

# Actually, I'll just write a new file with the CORRECT structure.
# I have all the pieces.

# IT STAFF BLOCKS:
# 1. Queue
# 2. Chat
# 3. Info Sidebar

# CLIENT BLOCKS:
# 1. Hero
# 2. List/Form

# I'll use the pieces from my previous views.
