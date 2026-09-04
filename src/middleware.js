import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Rutas públicas que no requieren autenticación
    const isPublicRoute = 
        pathname === '/login' || 
        pathname === '/registro' || 
        pathname === '/recuperar-password' || 
        pathname.startsWith('/actualizar-password') ||
        pathname.startsWith('/auth')

    // Si no está autenticado e intenta acceder a ruta protegida
    if (!user && !isPublicRoute && pathname !== '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Si ya está autenticado e intenta ir a /login o /registro
    if (user && (pathname === '/login' || pathname === '/registro')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}