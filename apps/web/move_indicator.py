import sys

filepath = r"e:\Users\PC\Documents\ANTIGRAVITY\BRIVIO\brivio\apps\web\app\share\[assetId]\roadmap\ClientRoadmapView.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

indicator_block = """{isCurrent && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="absolute -top-[16px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"
                                                            >
                                                                <div className="bg-accent-indigo text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl whitespace-nowrap flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                                    O seu projeto está aqui
                                                                </div>
                                                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-accent-indigo -mt-[1px]" />
                                                            </motion.div>
                                                        )}"""

circle_inner = """<motion.div
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className={cn(
                                                                "w-[200px] h-[200px] rounded-full flex items-center justify-center relative transition-all duration-500 z-10",
                                                                isCompleted
                                                                    ? "bg-accent-indigo shadow-2xl shadow-accent-indigo/40 border-none"
                                                                    : "bg-white shadow-xl border-none"
                                                            )}
                                                        >"""

# Step 1: Remove indicator from outer wrapper
if indicator_block in content:
    content = content.replace(indicator_block + "\n", "")
    content = content.replace(indicator_block, "")

# Step 2: Add indicator inside circle wrapper
if circle_inner in content:
    replacement = circle_inner + "\n" + "                                                            " + indicator_block
    content = content.replace(circle_inner, replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully moved indicator.")
