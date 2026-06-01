import sys

filepath = r"e:\Users\PC\Documents\ANTIGRAVITY\BRIVIO\brivio\apps\web\app\share\[assetId]\roadmap\ClientRoadmapView.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = "{/* Large Number Circle with Progress Bar */}"
replacement = """{/* Large Number Circle with Progress Bar */}
                                                        {isCurrent && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="absolute -top-[45px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"
                                                            >
                                                                <div className="bg-accent-indigo text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl whitespace-nowrap flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                                    O seu projeto está aqui
                                                                </div>
                                                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-accent-indigo -mt-[1px]" />
                                                            </motion.div>
                                                        )}"""

if target in content:
    content = content.replace(target, replacement, 1)  # Only replace the first occurrence (which is the numbered layout)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced.")
else:
    print("Target not found.")
