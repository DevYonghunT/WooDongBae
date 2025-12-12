import { NextResponse } from "next/server";

export async function GET() {
    const REST_API_KEY = process.env.NEXT_PUBLIC_SUPABASE_URL; // 이게 아니라 카카오 REST API 키가 필요함!
    // ⚠️ 주의: 카카오 REST API 키는 .env.local에 따로 저장하는 게 좋습니다.
    // 여기서는 Supabase 설정에 넣었던 그 'REST API Key'를 써야 합니다.
    // 편의상 .env.local에 KAKAO_REST_API_KEY 라고 저장했다고 가정하거나, 
    // 기존 Provider 설정에서 썼던 키를 가져와야 합니다.

    // 💡 사용 편의를 위해 Kakao Client ID를 직접 변수로 쓰거나 환경변수로 빼주세요.
    // Kakao Developers > 내 애플리케이션 > 요약 정보 > REST API 키
    const KAKAO_CLIENT_ID = "사용자님의_카카오_REST_API_키_여기에_입력";

    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/kakao-callback`;

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    return NextResponse.redirect(kakaoAuthUrl);
}