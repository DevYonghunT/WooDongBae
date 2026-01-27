import type { NextConfig } from "next";
import { createRequire } from "module";
import { withSentryConfig } from "@sentry/nextjs";

const require = createRequire(import.meta.url);
const withPWA = require("next-pwa")({
  dest: "public",
  disable: false, // [수정] 개발 모드에서도 PWA/SW 활성화 (알림 테스트 위해)
  importScripts: ["/custom-sw.js"],
});

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'source.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'fastly.picsum.photos', port: '', pathname: '/**' },
      { protocol: 'http', hostname: 'openapi.seoul.go.kr', port: '', pathname: '/**' }, // [추가] 서울시 이미지 (http 가능성 있어 둘 다 추가)
      { protocol: 'https', hostname: 'openapi.seoul.go.kr', port: '', pathname: '/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/courses',
        destination: `${process.env.NEXT_PUBLIC_API_URL}?serviceKey=${process.env.NEXT_PUBLIC_API_KEY}&numOfRows=100&pageNo=1`,
      },
    ];
  },
  async headers() {
    return [
      {
        // 보안 헤더 (모든 페이지)
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // CORS 헤더 (API 라우트)
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "https://woodongbae.xyz" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ]
  }
};

export default withSentryConfig(withPWA(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});