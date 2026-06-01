import sys

filepath = r"e:\Users\PC\Documents\ANTIGRAVITY\BRIVIO\brivio\apps\web\app\share\[assetId]\roadmap\ClientRoadmapView.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = 'className="absolute -top-[45px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"'
replacement = 'className="absolute -top-[16px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"'

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced.")
else:
    print("Target not found.")
