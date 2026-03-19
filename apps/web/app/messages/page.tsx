import { Navbar } from "@/components/layout/Navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default async function MessagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-bg-0 text-white flex flex-col">
            <Navbar />
            <main className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Chat Sidebar */}
                <div className="w-80 border-r border-bg-3 bg-bg-1 flex flex-col">
                    <div className="p-4 border-b border-bg-3">
                        <h2 className="text-xl font-bold mb-4">Messages</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                            <Input className="pl-9 bg-bg-2 border-bg-3 h-9" placeholder="Search..." />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-4 border-b border-bg-3 hover:bg-bg-2 cursor-pointer transition-colors">
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium">Design Team</span>
                                    <span className="text-xs text-text-secondary">2m</span>
                                </div>
                                <p className="text-sm text-text-secondary truncate">Hey, did you see the latest brand assets?</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-bg-0">
                    <div className="h-16 border-b border-bg-3 flex items-center px-6 bg-bg-1">
                        <span className="font-bold">Design Team</span>
                    </div>
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-text-secondary space-y-4">
                        <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center">
                            <span className="text-2xl">👋</span>
                        </div>
                        <p>Select a conversation to start messaging</p>
                    </div>
                    <div className="p-4 border-t border-bg-3 bg-bg-1">
                        <Input className="bg-bg-0 border-bg-3" placeholder="Type a message..." />
                    </div>
                </div>
            </main>
        </div>
    )
}
