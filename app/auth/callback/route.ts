import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    // 1. 카카오가 보내준 인증 코드(code)를 URL에서 찾습니다.
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // 로그인 후 이동할 페이지 (기본값: 홈)
    const next = searchParams.get("next") ?? "/";

    if (code) {
        // 2. 서버용 Supabase 클라이언트 생성
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 3. [핵심] 카카오 인증 코드를 진짜 로그인 세션으로 교환합니다.
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // 4. 성공하면 원래 있던 페이지로 돌려보냅니다.
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // 실패 시 에러 페이지 혹은 홈으로 리다이렉트
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}