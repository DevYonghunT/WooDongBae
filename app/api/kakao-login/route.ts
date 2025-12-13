import { headers } from "next/headers";
import { NextResponse } from "next/server";

function getSiteUrl() {
    const origin = headers().get("origin");
    return process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost:3000";
}

export async function GET() {
    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;

    if (!KAKAO_CLIENT_ID) {
        return NextResponse.json({ error: "Kakao client ID is not configured" }, { status: 500 });
    }

    const REDIRECT_URI = `${getSiteUrl()}/api/kakao-callback`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(
        KAKAO_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;

    return NextResponse.redirect(kakaoAuthUrl);
}