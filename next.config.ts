import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // [핵심 수정] SVG 이미지 허용 옵션 추가
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
        port: '',
        pathname: '/**',
      },
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

export default nextConfig;