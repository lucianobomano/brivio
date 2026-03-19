"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, FileText, MessageSquare } from "lucide-react"

export function ClientDashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-accent-indigo/20 to-accent-blue/20 border border-accent-indigo/30 rounded-2xl p-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome back, Acme Corp!</h2>
                    <p className="text-text-secondary">You have 2 items pending approval and 1 new delivery.</p>
                </div>
                <Button className="bg-white text-black hover:bg-gray-200">
                    View deliverables
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Project Status */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold text-white">Active Projects</h3>
                    <div className="grid gap-4">
                        <Card className="bg-bg-1 border-bg-3 p-6 flex flex-col md:flex-row md:items-center justify-between group hover:border-accent-indigo/50 transition-colors cursor-pointer">
                            <div className="flex items-start md:items-center mb-4 md:mb-0">
                                <div className="w-12 h-12 bg-bg-2 rounded-lg flex items-center justify-center mr-4">
                                    <div className="w-3 h-3 rounded-full bg-success"></div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white text-lg">Q4 Marketing Campaign</h4>
                                    <p className="text-sm text-text-secondary">Last updated 2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="text-right">
                                    <div className="text-xs text-text-secondary mb-1">Progress</div>
                                    <div className="w-32 h-2 bg-bg-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-success w-[75%]"></div>
                                    </div>
                                </div>
                                <Badge variant="success">In Progress</Badge>
                            </div>
                        </Card>

                        <Card className="bg-bg-1 border-bg-3 p-6 flex flex-col md:flex-row md:items-center justify-between group hover:border-accent-indigo/50 transition-colors cursor-pointer">
                            <div className="flex items-start md:items-center mb-4 md:mb-0">
                                <div className="w-12 h-12 bg-bg-2 rounded-lg flex items-center justify-center mr-4">
                                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white text-lg">Website Redesign</h4>
                                    <p className="text-sm text-text-secondary">Waiting for feedback</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="text-right">
                                    <div className="text-xs text-text-secondary mb-1">Progress</div>
                                    <div className="w-32 h-2 bg-bg-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-warning w-[40%]"></div>
                                    </div>
                                </div>
                                <Badge variant="warning">Review</Badge>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Notifications / Actions */}
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">Need Attention</h3>
                    <Card className="bg-bg-1 border-bg-3 divide-y divide-bg-3">
                        <div className="p-4 flex items-start space-x-3 hover:bg-bg-2/50 transition-colors cursor-pointer">
                            <div className="bg-accent-indigo/20 p-2 rounded-full text-accent-indigo mt-1">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Approve "Homepage Mockup_v2"</p>
                                <p className="text-xs text-text-secondary mt-1">Uploaded by John Doe</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-start space-x-3 hover:bg-bg-2/50 transition-colors cursor-pointer">
                            <div className="bg-warning/20 p-2 rounded-full text-warning mt-1">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Invoice #1024 Due Soon</p>
                                <p className="text-xs text-text-secondary mt-1">$2,400.00 • Due Oct 30</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-start space-x-3 hover:bg-bg-2/50 transition-colors cursor-pointer">
                            <div className="bg-success/20 p-2 rounded-full text-success mt-1">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">New comment on Strategy</p>
                                <p className="text-xs text-text-secondary mt-1">Mary: "Looks great, let's proceed..."</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
