"use client";

export default function KakaoLoginButton() {
    const handleLogin = () => {
        // 우리가 만든 커스텀 로그인 API로 이동
        window.location.href = "/api/kakao-login";
    };

    return (
        <button
            onClick={handleLogin}
            className="w-full bg-[#FEE500] text-black/90 hover:bg-[#FDD835] font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 3C6.5 3 2 6.6 2 11C2 13.5 3.7 15.8 6.4 17.2L5.3 21C5.2 21.3 5.5 21.6 5.8 21.4L10.3 18.4C10.9 18.5 11.4 18.5 12 18.5C17.5 18.5 22 14.9 22 10.5C22 6.1 17.5 3 12 3Z" />
            </svg>
            <span>카카오로 시작하기</span>
        </button>
    );
}