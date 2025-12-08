import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Search, Menu, User, LogIn } from "lucide-react";
import Link from "next/link";
import ScrollToTopButton from "@/components/ScrollToTopButton"; // [추가]
import FeedbackWidget from "@/components/FeedbackWidget"; // [추가]

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "우동배 - 우리 동네 배움터",
  description: "우리 동네 도서관 강좌를 한눈에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans bg-stone-50 text-stone-700 antialiased relative`}>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3362378426446704"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-lg group-hover:bg-amber-700 transition-colors">
                U
              </div>
              <span className="text-xl font-bold text-amber-950 tracking-tight group-hover:text-amber-700 transition-colors">우동배</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-stone-600 hover:text-amber-600 transition-colors">
                강좌찾기
              </Link>
              <Link href="/bookmarks" className="text-sm font-medium text-stone-600 hover:text-amber-600 transition-colors">
                찜 목록
              </Link>
              <Link href="#" className="text-sm font-medium text-stone-600 hover:text-amber-600 transition-colors">
                내 주변
              </Link>
              <Link href="#" className="text-sm font-medium text-stone-600 hover:text-amber-600 transition-colors">
                커뮤니티
              </Link>

              <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
                <button className="text-sm font-medium text-stone-500 hover:text-stone-900 px-3 py-2">
                  로그인
                </button>
                <button className="rounded-full bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700 transition-all shadow-md hover:shadow-lg">
                  회원가입
                </button>
              </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex items-center gap-4 md:hidden">
              <button className="text-stone-500 hover:text-stone-900">
                <Search className="h-6 w-6" />
              </button>
              <button className="text-stone-500 hover:text-stone-900">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-surface py-12">
          <div className="mx-auto max-w-7xl px-4 text-center text-gray-500 sm:px-6 lg:px-8">
            <p className="text-sm">© 2025 우동배 (우리 동네 배움터). All rights reserved.</p>
          </div>
        </footer>
        {/* [추가] 맨 위로 가기 버튼 (전역 배치) */}
        {/* 플로팅 버튼들 */}
        <FeedbackWidget /> {/* 좌측 하단 */}
        <ScrollToTopButton />
      </body>
    </html>
  );
}
