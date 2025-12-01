import { createClient } from '@supabase/supabase-js';
import { Course } from "@/types/course";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. [설정] 키워드별 이미지 매핑 (고화질 고정 이미지 사용)
const KEYWORD_IMAGES: Record<string, string> = {
    // 운동/스포츠
    '수영': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop',
    '배드민턴': 'https://images.unsplash.com/photo-1626224583764-84786c71971e?q=80&w=800&auto=format&fit=crop',
    '요가': 'https://images.unsplash.com/photo-1544367563-12123d8959c9?q=80&w=800&auto=format&fit=crop',
    '필라테스': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
    '헬스': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
    '체육': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
    '댄스': 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=800&auto=format&fit=crop',
    '발레': 'https://images.unsplash.com/photo-1596263576926-7846faadc62d?q=80&w=800&auto=format&fit=crop',

    // 문화/예술
    '미술': 'https://images.unsplash.com/photo-1460661619275-dcf4b814cd68?q=80&w=800&auto=format&fit=crop',
    '그림': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop',
    '도예': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop',
    '피아노': 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=800&auto=format&fit=crop',
    '기타': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop',
    '서예': 'https://images.unsplash.com/photo-1515003387869-79633e707d72?q=80&w=800&auto=format&fit=crop',

    // IT/학습
    '코딩': 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop',
    '컴퓨터': 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?q=80&w=800&auto=format&fit=crop',
    '영어': 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop',
    '독서': 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=800&auto=format&fit=crop',
    '역사': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800&auto=format&fit=crop',
};

// 2. [설정] 기본 로고 이미지 (우동배 브랜드 컬러 적용)
// (이미지가 없다면 placehold.co를 사용하여 로고처럼 만듦)
const DEFAULT_LOGO_IMAGE = "https://placehold.co/800x600/f97316/ffffff?text=UDB&font=roboto";

// [Helper] 이미지 배정 함수
function assignImage(title: string, category: string): string {
    const searchString = `${title} ${category}`;

    for (const [keyword, url] of Object.entries(KEYWORD_IMAGES)) {
        if (searchString.includes(keyword)) {
            return url;
        }
    }

    return DEFAULT_LOGO_IMAGE;
}

// [Helper] 날짜 포맷 함수
function formatDate(str: string) {
    if (!str) return "";
    return str.replace(/-/g, ".");
}

function mapRawToCourse(row: any): Course {
    const raw = row.raw_data || {};
    const title = raw.lectureNm || row.title || "";
    const category = raw.categoryNm || row.category || "";

    return {
        id: row.id,
        title: title,
        category: category,
        target: raw.targetNm || row.target,
        status: raw.lectureStatusNm || row.status,

        // [수정됨] 키워드 기반 이미지 배정 로직 적용
        imageUrl: assignImage(title, category),

        dDay: row.d_day,
        institution: raw.organNm || row.institution,
        price: raw.lectureCost === 0 ? "무료" : `${Number(raw.lectureCost).toLocaleString()}원`,

        region: raw.sigunguNm || "서울시",
        place: raw.place || "장소 미정",

        courseDate: `${formatDate(raw.lectureStartYmd)} ~ ${formatDate(raw.lectureEndYmd)}`,
        applyDate: `${formatDate(raw.applyStartYmd)} ~ ${formatDate(raw.applyEndYmd)}`,

        time: raw.dayOfWeek ? `${raw.dayOfWeek} ${raw.lectureStartTm}~` : "시간 상세참조",
        capacity: raw.onApplyNum || 0,
        contact: raw.organTelNo || raw.contactInfo || ""
    };
}

export async function getCoursesFromDB(): Promise<Course[]> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('id', { ascending: false }); // 최신순 정렬

        if (error) throw error;

        return (data || []).map(mapRawToCourse);

    } catch (error) {
        console.error('Failed to fetch from DB:', error);
        return [];
    }
}

export async function getCourseById(id: string): Promise<Course | null> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return null;

        return mapRawToCourse(data);

    } catch (error) {
        console.error(`Failed to fetch course ${id}:`, error);
        return null;
    }
}