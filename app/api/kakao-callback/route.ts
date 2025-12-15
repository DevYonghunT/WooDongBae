import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // [수정] 동적 origin 사용
    const origin = request.nextUrl.origin;

    // 환경변수 가져오기
    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID || "b6a8f2791cd23f7995b4fba26c649c20";
    const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || "XRvHGAT4u5uZ3mcZaj80m5v8ol0E8sG4";
    // const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https//www.woodongbae.xyz'; // Deprecated
    const REDIRECT_URI = `${origin}/api/kakao-callback`;

    if (!code) return NextResponse.redirect(new URL('/', request.url));

    try {
        // 1. 카카오 토큰 받기
        const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: KAKAO_CLIENT_ID,
                client_secret: KAKAO_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                code,
            }),
        });
        const tokenData = await tokenResponse.json();

        // 2. 카카오 유저 정보 가져오기
        const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userResponse.json();

        // 3. 가짜 이메일 생성
        const kakaoId = userData.id;
        const nickname = userData.properties?.nickname || "카카오 유저";
        const avatarUrl = userData.properties?.profile_image || "";
        const fakeEmail = `${kakaoId}@kakao.woodongbae.xyz`;

        // 4. Supabase Admin으로 유저 처리
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 유저 확인 및 생성
        const { data: existingUser } = await supabaseAdmin.from("profiles").select("*").eq("email", fakeEmail).single();

        if (!existingUser) {
            await supabaseAdmin.auth.admin.createUser({
                email: fakeEmail,
                email_confirm: true,
                user_metadata: { full_name: nickname, avatar_url: avatarUrl, iss: 'kakao' }
            });
        }

        // 5. 매직 링크 생성
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: fakeEmail,
            options: { redirectTo: `${origin}/` } // [수정] origin 사용
        });

        if (linkError) throw linkError;

        // ---------------------------------------------------------
        // 🚀 [핵심 변경] 서버에서 토큰 교환 및 쿠키 설정 (SSR 호환)
        // ---------------------------------------------------------

        // 생성된 매직링크(action_link)를 서버가 대신 방문해서 토큰을 가로챕니다.
        const actionLink = linkData.properties.action_link;
        const verifyRes = await fetch(actionLink, {
            method: 'GET',
            redirect: 'manual', // 자동으로 이동하지 말고 멈춰! (토큰을 뺏기 위해)
            headers: {
                'User-Agent': 'Mozilla/5.0 (Compatible; Server-Side-Auth)' // 봇 차단 방지
            }
        });

        // Supabase가 돌려준 주소(Location 헤더)에 토큰이 들어있습니다.
        const location = verifyRes.headers.get('location');

        let accessToken = '';
        let refreshToken = '';

        if (location && location.includes('#')) {
            // URL 해시(#access_token=...)에서 토큰 추출
            const params = new URLSearchParams(location.split('#')[1]);
            accessToken = params.get('access_token') || '';
            refreshToken = params.get('refresh_token') || '';
        }

        // 토큰을 못 찾았다면, 구버전 방식(그냥 이동)으로 폴백
        if (!accessToken || !refreshToken) {
            return NextResponse.redirect(actionLink);
        }

        // ✅ 토큰을 쿠키에 굽기
        const response = NextResponse.redirect(`${origin}/`); // 최종 목적지는 홈

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return request.cookies.getAll(); },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, {
                                ...options,
                                sameSite: 'none',
                                secure: true,
                            });
                        });
                    },
                },
            }
        );

        // Supabase 세션 설정
        await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        return response;

    } catch (error) {
        console.error("카카오 로그인 실패:", error);
        return NextResponse.redirect(new URL('/?error=kakao_failed', request.url));
    }
}