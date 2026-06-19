filepath = r"e:\Users\PC\Documents\ANTIGRAVITY\BRIVIO\brivio\apps\web\components\projects\ProjectStandardView.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "colSpan={2}" in line:
        print(f"--- Occurrence at line {i+1} ---")
        for j in range(max(0, i-2), min(len(lines), i+30)):
            print(f"{j+1:4d}: {repr(lines[j])}")
