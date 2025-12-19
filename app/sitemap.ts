import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://woodongbae.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: courses } = await supabase
        .from("courses")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

    const courseUrls = (courses || []).map((course) => ({
        url: `${SITE_URL}/courses/${course.id}`,
        lastModified: new Date(course.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [
        { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        { url: `${SITE_URL}/community`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        ...courseUrls,
    ];
}
