import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
// [삭제] 기존 아이콘 임포트 삭제 (Header.tsx로 이동함)
// import { Search, Menu, User, LogIn } from "lucide-react"; 
import Link from "next/link";
import Script from "next/script";
import ScrollToTopButton from "@/components/ScrollToTopButton"; // [추가]
import FeedbackWidget from "@/components/FeedbackWidget"; // [추가]
import Header from "@/components/Header"; // [추가] 새로 만든 헤더 임포트

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "우동배 - 우리 동네 배움터",
  description: "우리 동네의 문화센터 강좌 정보를 한눈에!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans bg-stone-50 text-stone-700 antialiased relative`}>

        {/* 구글 애드센스 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3362378426446704"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <meta name="google-adsense-account" content="ca-pub-3362378426446704"></meta>
        {/* [수정] 기존 header 태그 전체를 Header 컴포넌트로 교체 */}
        <Header />

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
