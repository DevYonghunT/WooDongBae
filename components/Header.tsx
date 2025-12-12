"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";
import { Heart, User as UserIcon, Menu, X } from "lucide-react";
import LoginModal from "./LoginModal";
import { useLoginModal } from "../store/useLoginModal"; // 👈 추가

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // 👇 스토어 사용 (setIsModalOpen 같은 로컬 상태 제거)
    const { openModal } = useLoginModal();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsMenuOpen(false);
        window.location.href = "/";
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
                {/* ... (로고 및 메뉴 부분은 동일) ... */}

                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* 로고 */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">우</div>
                        <span className="text-xl font-bold tracking-tight text-stone-900">우동배</span>
                    </Link>

                    {/* 데스크탑 메뉴 */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* ... 강좌찾기 링크 등 ... */}
                        <Link href="/" className="text-sm font-medium text-stone-600 hover:text-orange-600">강좌찾기</Link>

                        {user ? (
                            // 로그인 상태 (기존 코드 유지)
                            <>
                                <Link href="/mypage" className="text-sm font-medium text-stone-600 hover:text-orange-600 flex items-center gap-1 ml-4">
                                    <Heart className="w-4 h-4" /> 마이페이지
                                </Link>
                                <div className="h-4 w-px bg-stone-200 mx-2"></div>
                                {/* ... 프로필 및 로그아웃 ... */}
                                <button onClick={handleLogout} className="text-sm font-medium text-stone-500 hover:text-red-500 ml-2">로그아웃</button>
                            </>
                        ) : (
                            // 비로그인 상태: openModal 함수 사용
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => openModal()}
                                    className="text-sm font-medium text-stone-600 hover:text-orange-600 px-3 py-2"
                                >
                                    로그인
                                </button>
                                <button
                                    onClick={() => openModal()}
                                    className="text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-full transition-colors"
                                >
                                    회원가입
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 모바일 메뉴 버튼 (생략 - 위와 동일하게 openModal 적용) */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-stone-500 hover:text-stone-700">
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* 모달은 여기에 한 번만 배치하면 됩니다. isOpen 상태에 따라 알아서 열립니다. */}
            <LoginModal />
        </>
    );
}