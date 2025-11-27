import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Search, Menu, User, LogIn } from "lucide-react";
import Link from "next/link";

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
      <body className={`${notoSansKr.variable} font-sans bg-white text-text antialiased`}>
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary tracking-tighter">우동배</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                강좌찾기
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                커뮤니티
              </Link>
              <div className="h-4 w-px bg-gray-300"></div>
              <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                <LogIn className="h-4 w-4" />
                로그인
              </button>
              <button className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg">
                회원가입
              </button>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex items-center gap-4 md:hidden">
              <button className="text-gray-600 hover:text-primary">
                <Search className="h-6 w-6" />
              </button>
              <button className="text-gray-600 hover:text-primary">
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
            <p className="text-sm">© 2024 우동배 (우리 동네 배움터). All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
