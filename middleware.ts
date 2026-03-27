import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'

export async function middleware(request: NextRequest) {
    // [Rate Limiting] API 라우트에 적용
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { allowed, remaining, resetAt } = checkRateLimit(ip, 100, 60000); // 분당 100회

        if (!allowed) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
                    'X-RateLimit-Remaining': '0',
                },
            });
        }
    }

    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    // [CORS 설정] 요청된 Origin이 허용 목록에 있으면 해당 Origin으로 설정
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3100', 'http://woodongbae.xyz', 'http://www.woodongbae.xyz', 'https://woodongbae.xyz', 'https://www.woodongbae.xyz'];
    const origin = request.headers.get('origin');

    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
        // Fallback or default
        response.headers.set('Access-Control-Allow-Origin', 'https://woodongbae.xyz');
    }

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // [Rate Limiting] API 라우트 응답에 남은 횟수 헤더 추가
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { remaining } = checkRateLimit(ip, 100, 60000);
        response.headers.set('X-RateLimit-Remaining', String(remaining));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return response;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) { return request.cookies.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 👑 [관리자 페이지 보호 로직]
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // 1. 로그인 안 했으면 홈으로
        if (!user) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        // 2. 관리자 이메일이 아니면 홈으로 (환경변수에서 읽기)
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        if (!ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
