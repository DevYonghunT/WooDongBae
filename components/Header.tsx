"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, User, LogIn, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
    const pathname = usePathname();
    const [showToast, setShowToast] = useState(false);

    // 귀여운 '서비스 준비중' 알림 함수
    const handleComingSoon = (e: React.MouseEvent) => {
        e.preventDefault(); // 링크 이동 방지
        setShowToast(true);
        // 2초 뒤에 저절로 사라짐
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* 1. 로고 (항상 작동) */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-lg shadow-md shadow-primary-200">
                                우
                            </div>
                            <span className="text-xl font-bold tracking-tight text-stone-800">우동배</span>
                        </Link>
                    </div>

                    {/* 2. 네비게이션 메뉴 */}
                    <nav className="hidden md:flex items-center gap-8">
                        {/* 강좌찾기 (메인 기능이므로 작동) */}
                        <Link
                            href="/"
                            className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-primary-600 font-bold' : 'text-stone-600 hover:text-amber-600'
                                }`}
                        >
                            강좌찾기
                        </Link>

                        {/* 찜 목록 (작동) */}
                        <Link
                            href="/bookmarks"
                            className={`text-sm font-medium transition-colors ${pathname === '/bookmarks' ? 'text-primary-600 font-bold' : 'text-stone-600 hover:text-amber-600'
                                }`}
                        >
                            찜 목록
                        </Link>

                        {/* [준비중] 커뮤니티 등 예시 메뉴 */}
                        <button
                            onClick={handleComingSoon}
                            className="text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors cursor-not-allowed"
                        >
                            커뮤니티
                        </button>
                    </nav>

                    {/* 3. 우측 아이콘들 */}
                    <div className="flex items-center gap-3">
                        {/* 검색 아이콘 (준비중 처리) */}
                        <button
                            onClick={handleComingSoon}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* 로그인/유저 (준비중 처리) */}
                        <button
                            onClick={handleComingSoon}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
                        >
                            <User className="w-5 h-5" />
                        </button>

                        {/* 모바일 메뉴 (준비중 처리) */}
                        <button
                            onClick={handleComingSoon}
                            className="md:hidden p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ✨ 귀여운 토스트 팝업 (Service Coming Soon) */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="fixed top-24 left-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-gray-900/90 text-white rounded-full shadow-xl backdrop-blur-sm"
                    >
                        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        <span className="font-medium text-sm">앗! 아직 열심히 만들고 있는 중이에요 🚧</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
