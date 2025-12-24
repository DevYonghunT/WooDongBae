import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import FeedbackWidget from "@/components/FeedbackWidget";
import Header from "@/components/Header";
import PushNotificationButton from "@/components/PushNotificationButton";
import LoginModal from "@/components/LoginModal";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

const DEFAULT_SITE_URL = "https://www.woodongbae.xyz";
const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).trim();
const SITE_URL = rawSiteUrl.replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "우동배 - 우리 동네 배움터",
    template: "%s | 우동배",
  },
  description: "우리 동네의 문화센터 강좌 정보를 한눈에! 가까운 도서관, 주민자치센터 강좌를 찾아보세요.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "우동배",
    title: "우동배 - 우리 동네 배움터",
    description: "우리 동네의 문화센터 강좌 정보를 한눈에! 가까운 도서관, 주민자치센터 강좌를 찾아보세요.",
    url: SITE_URL,
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "우동배 - 우리 동네 배움터",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "우동배 - 우리 동네 배움터",
    description: "우리 동네의 문화센터 강좌 정보를 한눈에! 가까운 도서관, 주민자치센터 강좌를 찾아보세요.",
    images: ["/og/default.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans bg-stone-50 text-stone-700 antialiased relative`}>
        {/* 서비스 워커 강제 등록 */}
        <ServiceWorkerRegister />

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