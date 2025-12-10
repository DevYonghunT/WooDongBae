"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, User, Sparkles, X } from "lucide-react"; // [수정] X 아이콘 추가
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Header() {
    const pathname = usePathname();
    const [showToast, setShowToast] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // [추가] 모바일 메뉴 상태

    const handleComingSoon = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    // 메뉴 클릭 시 모바일 메뉴 닫기
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* 1. 로고 */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 group" onClick={closeMobileMenu}>
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-primary-200 group-hover:shadow-lg transition-all">
                                <Image
                                    src="/logo.png"
                                    alt="우동배 로고"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-stone-800 group-hover:text-primary-700 transition-colors">
                                우동배
                            </span>
                        </Link>
                    </div>

                    {/* 2. PC 버전 네비게이션 (모바일에선 숨김) */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/"
                            className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-primary-600 font-bold' : 'text-stone-600 hover:text-amber-600'
                                }`}
                        >
                            강좌찾기
                        </Link>

                        <Link
                            href="/bookmarks"
                            className={`text-sm font-medium transition-colors ${pathname === '/bookmarks' ? 'text-primary-600 font-bold' : 'text-stone-600 hover:text-amber-600'
                                }`}
                        >
                            찜 목록
                        </Link>

                        <Link
                            href="/community"
                            className={`text-sm font-medium transition-colors ${pathname === '/community' ? 'text-primary-600 font-bold' : 'text-stone-600 hover:text-amber-600'
                                }`}
                        >
                            커뮤니티
                        </Link>
                    </nav>

                    {/* 3. 우측 아이콘들 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleComingSoon}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleComingSoon}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all hidden sm:block"
                        >
                            <User className="w-5 h-5" />
                        </button>

                        {/* [수정] 모바일 메뉴 버튼 (토글 기능 연결) */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-full transition-all"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* [추가] 모바일 드롭다운 메뉴 */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-b border-stone-200 bg-white overflow-hidden"
                        >
                            <nav className="flex flex-col p-4 space-y-2">
                                <Link
                                    href="/"
                                    onClick={closeMobileMenu}
                                    className={`p-3 rounded-xl font-bold transition-colors ${pathname === '/' ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-stone-50'
                                        }`}
                                >
                                    🏠 강좌찾기
                                </Link>
                                <Link
                                    href="/bookmarks"
                                    onClick={closeMobileMenu}
                                    className={`p-3 rounded-xl font-bold transition-colors ${pathname === '/bookmarks' ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-stone-50'
                                        }`}
                                >
                                    ❤️ 찜 목록
                                </Link>
                                <Link
                                    href="/community"
                                    onClick={closeMobileMenu}
                                    className={`p-3 rounded-xl font-bold transition-colors ${pathname === '/community' ? 'bg-primary-50 text-primary-700' : 'text-stone-600 hover:bg-stone-50'
                                        }`}
                                >
                                    💬 커뮤니티
                                </Link>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className="fixed top-24 left-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-gray-900/90 text-white rounded-full shadow-xl backdrop-blur-sm whitespace-nowrap"
                    >
                        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                        <span className="font-medium text-sm">앗! 아직 열심히 만들고 있는 중이에요 🚧</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
