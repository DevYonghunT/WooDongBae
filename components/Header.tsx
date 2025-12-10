"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, User, LogIn, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image"; // [필수] Image 컴포넌트 추가

export default function Header() {
    const pathname = usePathname();
    const [showToast, setShowToast] = useState(false);

    const handleComingSoon = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* 1. 로고 (이미지로 교체) */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 group">
                            {/* [수정] 기존 div 태그를 Image 컴포넌트로 교체 */}
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

                    {/* ... (나머지 네비게이션 및 아이콘 코드는 기존과 동일하게 유지) ... */}
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

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleComingSoon}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleComingSoon}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
                        >
                            <User className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleComingSoon}
                            className="md:hidden p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

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
