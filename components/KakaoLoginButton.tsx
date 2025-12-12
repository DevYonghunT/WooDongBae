"use client";

import { createClient } from "@supabase/supabase-js";
import { MessageCircle } from "lucide-react"; // 아이콘이 없다면 삭제하거나 img 태그 사용

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function KakaoLoginButton() {
    const handleLogin = async () => {
        // [문서의 원리 적용] 카카오 인증 서버로 사용자를 보냅니다.
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                // 로그인 끝나면 돌아올 우리 사이트 주소
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("로그인 에러:", error.message);
            alert("카카오 로그인 중 오류가 발생했습니다.");
        }
    };

    return (
        <button
            onClick={handleLogin}
            className="w-full bg-[#FEE500] text-black/90 hover:bg-[#FDD835] font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
            {/* 카카오 로고 (SVG) */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 3C6.5 3 2 6.6 2 11C2 13.5 3.7 15.8 6.4 17.2L5.3 21C5.2 21.3 5.5 21.6 5.8 21.4L10.3 18.4C10.9 18.5 11.4 18.5 12 18.5C17.5 18.5 22 14.9 22 10.5C22 6.1 17.5 3 12 3Z" />
            </svg>
            <span>카카오로 시작하기</span>
        </button>
    );
}