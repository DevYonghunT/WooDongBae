"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";
import { LogOut, Heart, User as UserIcon } from "lucide-react";
import KakaoLoginButton from "./KakaoLoginButton"; // 👈 아까 만든 버튼 가져오기

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // 모바일 메뉴용

    useEffect(() => {
        // 1. 현재 로그인 상태 확인
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        // 2. 로그인/로그아웃 상태 변화 감지 (실시간)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        alert("로그아웃 되었습니다.");
        window.location.href = "/"; // 홈으로 이동
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* 로고 */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">
                        우
                    </div>
                    <span className="text-xl font-bold tracking-tight text-stone-900">우동배</span>
                </Link>

                {/* 데스크탑 메뉴 (우측) */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        // ✅ 로그인 했을 때 보이는 화면
                        <>
                            <Link href="/bookmarks" className="text-sm font-medium text-stone-600 hover:text-orange-600 flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                찜 목록
                            </Link>
                            <div className="h-4 w-px bg-stone-200 mx-2"></div>
                            <div className="flex items-center gap-2">
                                {/* 프로필 사진이 있으면 표시 */}
                                {user.user_metadata.avatar_url ? (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="프로필"
                                        className="w-8 h-8 rounded-full border border-stone-200"
                                    />
                                ) : (
                                    <UserIcon className="w-5 h-5 text-stone-400" />
                                )}
                                <span className="text-sm text-stone-700 font-medium">
                                    {user.user_metadata.full_name || user.user_metadata.name || "사용자"}님
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-stone-500 hover:text-red-500 underline ml-2"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        // ✅ 로그인 안 했을 때 보이는 화면 (카카오 버튼)
                        <div className="scale-90 origin-right">
                            {/* 버튼 크기가 좀 커서 살짝 줄임 */}
                            <KakaoLoginButton />
                        </div>
                    )}
                </div>

                {/* 모바일용 메뉴 버튼 (간단 구현) */}
                <div className="md:hidden">
                    {user ? (
                        <button onClick={handleLogout} className="text-sm text-stone-500">로그아웃</button>
                    ) : (
                        <div className="w-32">
                            <KakaoLoginButton />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}