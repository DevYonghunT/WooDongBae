import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;

    if (!KAKAO_CLIENT_ID) {
        return NextResponse.json({ error: "Kakao client ID is not configured" }, { status: 500 });
    }

    // [수정] 동적 origin 사용
    const origin = request.nextUrl.origin;
    // const siteUrl = await getSiteUrl(); // Deprecated
    const REDIRECT_URI = `${origin}/api/kakao-callback`;

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(
        KAKAO_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;

    return NextResponse.redirect(kakaoAuthUrl);
}