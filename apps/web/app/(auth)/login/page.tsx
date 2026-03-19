"use client"

import * as React from "react"
import { Logo } from "@/components/layout/Logo"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        router.refresh()
        router.push("/dashboard")
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-bg-0 bg-[url('/grid.svg')]">
            <Card className="w-full max-w-sm bg-bg-1 border-bg-3">
                <CardHeader className="space-y-4 flex flex-col items-center">
                    <Logo className="mb-2 scale-125" />
                    <div className="text-center space-y-1">
                        <CardTitle className="text-2xl text-white">Welcome back</CardTitle>
                        <CardDescription className="text-text-secondary">
                            Enter your credentials to access your workspace
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-accent-indigo hover:text-white transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
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
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-bg-3" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-bg-1 px-2 text-text-secondary">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full border-bg-3 hover:bg-bg-2 text-text-secondary hover:text-white" disabled={loading}>
                        Google
                    </Button>
                    <div className="text-center text-sm text-text-secondary">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="font-medium text-accent-indigo hover:text-white transition-colors"
                        >
                            Create account
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
