import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import FeedbackWidget from "@/components/FeedbackWidget";
import Header from "@/components/Header";
import PushNotificationButton from "@/components/PushNotificationButton"; // 👈 [1. 추가] 임포트
import LoginModal from "@/components/LoginModal";


const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "우동배 - 우리 동네 배움터",
  description: "우리 동네의 문화센터 강좌 정보를 한눈에!",
  manifest: "/manifest.json",
  themeColor: "#f97316",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans bg-stone-50 text-stone-700 antialiased relative`}>
        {/* 👇 [추가] 모달을 전역 배치 */}
        <LoginModal />

        {/* 구글 애드센스 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3362378426446704"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <meta name="google-adsense-account" content="ca-pub-3362378426446704"></meta>

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

        {/* 플로팅 버튼들 */}
        <PushNotificationButton /> {/* 👈 [2. 추가] 여기에 넣었습니다! */}
        <FeedbackWidget />
        <ScrollToTopButton />
      </body>
    </html>
  );
}