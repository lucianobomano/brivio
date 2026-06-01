import sys

filepath = r"e:\Users\PC\Documents\ANTIGRAVITY\BRIVIO\brivio\apps\web\app\share\[assetId]\roadmap\ClientRoadmapView.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = "className=\"flex flex-col items-center z-20 pointer-events-none\""
replacement = "className=\"flex flex-col items-center z-20 pointer-events-none ml-[-30px]\""

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully added margin.")
else:
    print("Target not found.")
