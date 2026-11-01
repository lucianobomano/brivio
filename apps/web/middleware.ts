import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Pages anyone can open */
const PUBLIC_EXACT = new Set(['/', '/login', '/register', '/forgot-password', '/pricing'])
const PUBLIC_PREFIXES = ['/share/', '/auth/']
/** Sign-in pages: someone already signed in goes straight to the app */
const SIGNED_OUT_ONLY = new Set(['/login', '/register', '/forgot-password'])

const isPublic = (path: string) => PUBLIC_EXACT.has(path) || PUBLIC_PREFIXES.some(p => path.startsWith(p))

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // PERFORMANCE: getClaims() verifies the JWT locally (with asymmetric signing keys) instead of
    // calling Supabase Auth on every request, and still refreshes an expired session.
    // Pages/actions keep using getUser() (via getCurrentUser) for full server-side validation.
    const { data } = await supabase.auth.getClaims()
    const signedIn = !!data?.claims
    const path = request.nextUrl.pathname

    // Signed in: the sign-in pages lead into the app
    if (signedIn && SIGNED_OUT_ONLY.has(path)) {
        const url = request.nextUrl.clone()
        const next = url.searchParams.get('next')
        url.pathname = next && next.startsWith('/') && !next.startsWith('//') ? next.split('?')[0] : '/dashboard'
        url.search = next && next.includes('?') ? next.slice(next.indexOf('?')) : ''
        return NextResponse.redirect(url)
    }

    // SECURITY: Redirect unauthenticated users to login for all protected routes, coming back here afterwards
    if (!signedIn && !isPublic(path)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.search = ''
        if (path !== '/dashboard') url.searchParams.set('next', path + request.nextUrl.search)
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Every path except Next.js internals and static files. Public pages still pass through
         * (the session is refreshed and signed-in users skip the sign-in pages).
         */
        '/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|otf|mp4|mp3|webm)$).*)',
    ],
}
