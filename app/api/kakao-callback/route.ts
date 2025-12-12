import { createClient } from "@supabase/supabase-js";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const KAKAO_CLIENT_ID = "b6a8f2791cd23f7995b4fba26c649c20"; // 👈 위와 동일한 키 입력
    const KAKAO_CLIENT_SECRET = "XRvHGAT4u5uZ3mcZaj80m5v8ol0E8sG4"; // 👈 보안 메뉴에 있던 그 코드
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const REDIRECT_URI = `${SITE_URL}/api/kakao-callback`;

    if (!code) return NextResponse.redirect(new URL('/', request.url));

    try {
        // 1. 인가 코드로 카카오 토큰 받기
        const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: KAKAO_CLIENT_ID,
                client_secret: KAKAO_CLIENT_SECRET!,
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

        // 3. 가짜 이메일 생성 (카카오ID @ fake.com)
        const kakaoId = userData.id;
        const nickname = userData.properties?.nickname || "카카오 유저";
        const avatarUrl = userData.properties?.profile_image || "";
        const fakeEmail = `${kakaoId}@kakao.woodongbae.xyz`; // 👈 가짜 이메일!

        // 4. Supabase Admin으로 유저 강제 처리
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 이미 있는 유저인지 확인
        const { data: existingUser } = await supabaseAdmin.from("profiles").select("*").eq("email", fakeEmail).single();

        if (!existingUser) {
            // 없으면 회원가입 (Admin 권한으로 강제 생성)
            await supabaseAdmin.auth.admin.createUser({
                email: fakeEmail,
                email_confirm: true, // 이메일 인증 통과시킴
                user_metadata: { full_name: nickname, avatar_url: avatarUrl, iss: 'kakao' }
            });
        }

        // 5. 로그인 세션 생성 (매직 링크 방식 이용)
        // 비밀번호 없이 로그인시키기 위해, 1회용 로그인 링크를 생성해서 바로 이동시킵니다.
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: fakeEmail,
            options: {
                redirectTo: `${SITE_URL}/`, // 로그인 성공 후 홈으로
            }
        });

        if (linkError) throw linkError;

        // 6. 매직 링크로 리다이렉트 (사용자는 깜빡거림 후 로그인됨)
        return NextResponse.redirect(linkData.properties.action_link);

    } catch (error) {
        console.error("카카오 로그인 실패:", error);
        return NextResponse.redirect(new URL('/?error=kakao_failed', request.url));
    }
}