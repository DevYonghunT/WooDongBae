"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, X, Heart } from "lucide-react";
import { useLoginModal } from "../store/useLoginModal";
import { createClient } from "@/utils/supabase/client";

// 👇 [추가] 로그인 모달 컴포넌트를 가져옵니다.


export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { openModal } = useLoginModal();
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (_event === 'SIGNED_OUT') {
                setUser(null);
                window.location.href = "/";
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-stone-100 bg-white/80 backdrop-blur-md">
            {/* 👇 [추가] 모달이 화면에 존재해야 버튼을 눌렀을 때 뜹니다! */}


            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

                {/* 로고 */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                            <span className="font-bold">우</span>
                        </div>
                        <span className="text-xl font-bold text-stone-900">우동배</span>
                    </Link>
                </div>

                {/* 데스크탑 메뉴 */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="/" className="text-sm font-medium text-stone-600 hover:text-orange-600">
                        강좌찾기
                    </Link>

                    {user ? (
                        <>
                            <Link href="/mypage" className="text-sm font-medium text-stone-600 hover:text-orange-600 flex items-center gap-1 ml-4">
                                <Heart className="w-4 h-4" />
                                마이페이지
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="ml-4 text-sm font-medium text-stone-500 hover:text-stone-800"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
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

                {/* 모바일 메뉴 버튼 */}
                <button
                    className="md:hidden p-2 text-stone-600"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* 모바일 메뉴 드롭다운 */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-stone-100 bg-white px-4 py-6 space-y-4">
                    <Link href="/" className="block text-base font-medium text-stone-600" onClick={() => setIsMenuOpen(false)}>
                        강좌찾기
                    </Link>

                    {user ? (
                        <>
                            <Link href="/mypage" className="block text-base font-medium text-stone-600" onClick={() => setIsMenuOpen(false)}>
                                마이페이지
                            </Link>
                            <button
                                onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                className="block text-base font-medium text-stone-500 w-full text-left"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-3 pt-4 border-t border-stone-100">
                            <button
                                onClick={() => { openModal(); setIsMenuOpen(false); }}
                                className="w-full rounded-xl border border-stone-200 py-3 text-sm font-bold text-stone-600"
                            >
                                로그인
                            </button>
                            <button
                                onClick={() => { openModal(); setIsMenuOpen(false); }}
                                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white"
                            >
                                회원가입
                            </button>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}