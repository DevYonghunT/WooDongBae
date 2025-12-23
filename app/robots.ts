import { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://www.woodongbae.xyz";
const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).trim();
const SITE_URL = rawSiteUrl.replace(/^http:\/\//, "https://").replace(/\/+$/, "");

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
