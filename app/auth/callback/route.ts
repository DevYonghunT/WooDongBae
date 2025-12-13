// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // 원래 가려던 페이지가 있으면 거기로, 없으면 홈으로
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // 서버 컴포넌트 에러 무시
                        }
                    },
                },
            }
        );

        // 구글이 준 코드를 세션으로 교환
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // ✅ 성공 시: 원래 가려던 곳으로 이동
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("로그인 교환 에러:", error);
        }
    }

    // ❌ 실패 시: 'auth-code-error' 대신 그냥 홈으로 이동! (에러 쿼리 추가)
    return NextResponse.redirect(`${origin}/?error=google_login_failed`);
}