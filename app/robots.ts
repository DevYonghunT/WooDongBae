import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://woodongbae.xyz";

export default function robots(): MetadataRoute.Robots {
    const disallow = ["/api/", "/admin/", "/mypage/", "/auth/"];

    return {
        rules: [
            { userAgent: "*", allow: "/", disallow },
            { userAgent: "Yeti", allow: "/", disallow },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
