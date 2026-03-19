"use client"

import * as React from "react"
import Link from "next/link"
import { Logo } from "@/components/layout/Logo"
import { useRouter } from "next/navigation"
import { Loader2, User, Building, Briefcase } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type AccountType = 'designer' | 'agency' | 'client'

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [accountType, setAccountType] = React.useState<AccountType>('designer')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const name = formData.get("name") as string

        const supabase = createClient()
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role_global: accountType === 'agency' ? 'agency_owner' : accountType
                }
            }
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        // Redirect to onboarding or dashboard
        router.refresh()
        router.push("/onboarding")
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-bg-0 bg-[url('/grid.svg')]">
            <Card className="w-full max-w-lg bg-bg-1 border-bg-3">
                <CardHeader className="space-y-4 flex flex-col items-center">
                    <Logo className="mb-2" />
                    <div className="text-center space-y-1">
                        <CardTitle className="text-2xl text-white">Create your account</CardTitle>
                        <CardDescription className="text-text-secondary">
                            Join the ecosystem for modern brand management
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                type="button"
                                onClick={() => setAccountType('designer')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-lg border bg-bg-0 transition-all hover:bg-bg-2",
                                    accountType === 'designer' ? "border-accent-indigo ring-1 ring-accent-indigo/50 bg-bg-2" : "border-bg-3 text-text-secondary"
                                )}
                            >
                                <User className="w-6 h-6 mb-2" />
                                <span className="text-xs font-medium">Designer</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAccountType('agency')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-lg border bg-bg-0 transition-all hover:bg-bg-2",
                                    accountType === 'agency' ? "border-accent-indigo ring-1 ring-accent-indigo/50 bg-bg-2" : "border-bg-3 text-text-secondary"
                                )}
                            >
                                <Briefcase className="w-6 h-6 mb-2" />
                                <span className="text-xs font-medium">Agency</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAccountType('client')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-lg border bg-bg-0 transition-all hover:bg-bg-2",
                                    accountType === 'client' ? "border-accent-indigo ring-1 ring-accent-indigo/50 bg-bg-2" : "border-bg-3 text-text-secondary"
                                )}
                            >
                                <Building className="w-6 h-6 mb-2" />
                                <span className="text-xs font-medium">Company</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                required
                                className="bg-bg-0 border-bg-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                placeholder="name@example.com"
                                required
                                type="email"
                                className="bg-bg-0 border-bg-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                required
                                type="password"
                                className="bg-bg-0 border-bg-3"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-error font-medium p-2 rounded-md bg-error/10 border border-error/20">
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full bg-accent-indigo hover:bg-accent-indigo/90 text-white"
                            type="submit"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-center text-sm text-text-secondary">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-accent-indigo hover:text-white transition-colors"
                        >
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
