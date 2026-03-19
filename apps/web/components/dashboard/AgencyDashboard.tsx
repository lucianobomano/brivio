"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Users, Briefcase, Clock, AlertCircle } from "lucide-react"

export function AgencyDashboard() {
    return (
        <div className="space-y-8">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-bg-1 border-bg-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Total Clients</CardTitle>
                        <Users className="h-4 w-4 text-accent-indigo" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">12</div>
                        <p className="text-xs text-text-secondary mt-1">+2 from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-bg-1 border-bg-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Active Projects</CardTitle>
                        <Briefcase className="h-4 w-4 text-accent-blue" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">24</div>
                        <p className="text-xs text-text-secondary mt-1">8 due this week</p>
                    </CardContent>
                </Card>
                <Card className="bg-bg-1 border-bg-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Billable Hours</CardTitle>
                        <Clock className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">1,248</div>
                        <p className="text-xs text-text-secondary mt-1">Top performer: Sarah</p>
                    </CardContent>
                </Card>
                <Card className="bg-bg-1 border-bg-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Overdue Tasks</CardTitle>
                        <AlertCircle className="h-4 w-4 text-error" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">3</div>
                        <p className="text-xs text-text-secondary mt-1">Action required</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Client Status */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold text-white">Client Management</h2>
                    <Card className="bg-bg-1 border-bg-3">
                        <div className="p-6">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-secondary uppercase border-b border-bg-3">
                                    <tr>
                                        <th className="px-4 py-3">Client</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Active Projects</th>
                                        <th className="px-4 py-3">Next Deliverable</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bg-3">
                                    <tr className="hover:bg-bg-2/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">Acme Corp</td>
                                        <td className="px-4 py-3"><Badge variant="success">Active</Badge></td>
                                        <td className="px-4 py-3">3</td>
                                        <td className="px-4 py-3 text-text-secondary">Oct 24, 2024</td>
                                        <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm">Manage</Button></td>
                                    </tr>
                                    <tr className="hover:bg-bg-2/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">Stark Industries</td>
                                        <td className="px-4 py-3"><Badge variant="warning">Review</Badge></td>
                                        <td className="px-4 py-3">1</td>
                                        <td className="px-4 py-3 text-text-secondary">Oct 26, 2024</td>
                                        <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm">Manage</Button></td>
                                    </tr>
                                    <tr className="hover:bg-bg-2/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">Wayne Ent.</td>
                                        <td className="px-4 py-3"><Badge variant="info">Onboarding</Badge></td>
                                        <td className="px-4 py-3">0</td>
                                        <td className="px-4 py-3 text-text-secondary">-</td>
                                        <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm">Manage</Button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Recent Activity / Team Load */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Team Availability</h2>
                    <Card className="bg-bg-1 border-bg-3 p-6">
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-accent-indigo/20 text-accent-indigo flex items-center justify-center text-xs font-bold mr-3">JD</div>
                                    <div>
                                        <p className="text-sm font-medium text-white">John Doe</p>
                                        <p className="text-xs text-text-secondary">Senior Designer</p>
                                    </div>
                                </div>
                                <Badge variant="success">Full</Badge>
                            </li>
                            <li className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center text-xs font-bold mr-3">JS</div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Jane Smith</p>
                                        <p className="text-xs text-text-secondary">Copywriter</p>
                                    </div>
                                </div>
                                <Badge variant="outline">Available</Badge>
                            </li>
                            <li className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-bold mr-3">MK</div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Mike Key</p>
                                        <p className="text-xs text-text-secondary">Art Director</p>
                                    </div>
                                </div>
                                <Badge variant="success">Busy</Badge>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    )
}
