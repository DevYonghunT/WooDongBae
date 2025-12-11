import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
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
};

export default withPWA(nextConfig);