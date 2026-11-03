import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { safeNext } from "@/lib/auth-helpers"

/**
 * Where the links of Supabase Auth land: email confirmation, password recovery, magic links and Google.
 * - PKCE flow (default of @supabase/ssr): `?code=…` is exchanged for a session.
 * - Email templates using the token hash: `?token_hash=…&type=…` is verified.
 * Then the user goes on to `next` (only paths inside the app), or back to the sign-in page if the link failed.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl
    const next = safeNext(searchParams.get("next"))
    const code = searchParams.get("code")
    const tokenHash = searchParams.get("token_hash")
    const type = searchParams.get("type") as EmailOtpType | null

    const supabase = await createClient()
    let ok = false

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        ok = !error
    } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        ok = !error
    }

    // Recovery links lead to the new-password page; invitations to choosing a first password
    const destination = !ok ? "/login?error=link"
        : type === "recovery" ? "/reset-password"
        : type === "invite" ? "/reset-password?invite=1"
        : next
    return NextResponse.redirect(new URL(destination, origin))
}
