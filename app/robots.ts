import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/'], // API나 관리자 페이지는 숨김
        },
        sitemap: 'https://woodongbae.xyz/sitemap.xml',
    };
}
