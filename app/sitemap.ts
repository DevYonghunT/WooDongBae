import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 모든 강좌 ID 가져오기 (최신 5000개만 예시)
    const { data: courses } = await supabase
        .from('courses')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(5000);

    const courseUrls = (courses || []).map((course) => ({
        url: `https://woodongbae.xyz/courses/${course.id}`,
        lastModified: new Date(course.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [
        {
            url: 'https://woodongbae.xyz',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: 'https://woodongbae.xyz/community',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        ...courseUrls,
    ];
}
