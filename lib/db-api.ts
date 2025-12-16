import { createClient } from '@supabase/supabase-js';
import { Course } from "@/types/course";

import { normalizeRegionAndInstitution, refineInstitutionName } from "@/utils/normalization";

// [설정 1] 환경 변수 가드
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("필수 환경 변수가 누락되었습니다: NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// [설정 2] 가져올 컬럼 명시
const COURSE_COLUMNS = `
  id, title, category, target, status, image_url, d_day, institution, price,
  region, place, course_date, apply_date, time, capacity, contact, link, created_at
`;

// [Type Definitions]
export interface FilterMetadata {
    region: string;
    institution: string;
}

export interface CourseFilterParams {
    majorRegion: string;
    minorRegion: string;
    organ: string;
    status: string;
    search: string;
}

// [설정 4] 키워드별 이미지 매핑
const KEYWORD_IMAGES: Record<string, string> = {
    '수영': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop',
    '배드민턴': 'https://images.unsplash.com/photo-1626224583764-84786c71971e?q=80&w=800&auto=format&fit=crop',
    '요가': 'https://images.unsplash.com/photo-1544367563-12123d8959c9?q=80&w=800&auto=format&fit=crop',
    '필라테스': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
    '헬스': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
    '체육': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
    '댄스': 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=800&auto=format&fit=crop',
    '발레': 'https://images.unsplash.com/photo-1596263576926-7846faadc62d?q=80&w=800&auto=format&fit=crop',
    '미술': 'https://images.unsplash.com/photo-1460661619275-dcf4b814cd68?q=80&w=800&auto=format&fit=crop',
    '그림': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop',
    '도예': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop',
    '피아노': 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=800&auto=format&fit=crop',
    '기타': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop',
    '서예': 'https://images.unsplash.com/photo-1515003387869-79633e707d72?q=80&w=800&auto=format&fit=crop',
    '코딩': 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop',
    '컴퓨터': 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?q=80&w=800&auto=format&fit=crop',
    '영어': 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop',
    '독서': 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=800&auto=format&fit=crop',
    '역사': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800&auto=format&fit=crop',
};

const DEFAULT_LOGO_IMAGE = "https://placehold.co/800x600/f97316/ffffff?text=UDB&font=roboto";

const STATUS_MAP: Record<string, string> = {
    '마감': '모집종료',
    '접수완료': '모집종료',
    '강좌종료': '모집종료',
    '접수마감': '모집종료',
    '준비': '접수예정'
};

function assignImage(title: string, category: string): string {
    const searchString = `${title} ${category}`;
    for (const [keyword, url] of Object.entries(KEYWORD_IMAGES)) {
        if (searchString.includes(keyword)) {
            return url;
        }
    }
    return DEFAULT_LOGO_IMAGE;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawToCourse(row: any): Course {
    const raw = row.raw_data || {};
    const title = row.title || raw.lectureNm || raw.title || "제목 없음";
    const category = row.category || raw.cateNm || raw.category || "기타";
    const rawInstitution = row.institution || raw.organNm || raw.institution || "기관 미정";
    const target = row.target || raw.eduTarget || raw.targetNm || "전체";
    const rawRegion = row.region || raw.sigunguNm || raw.region || "";
    const rawPlace = row.place || raw.place || "";
    const { region, institution } = normalizeRegionAndInstitution(rawRegion, rawInstitution, rawPlace);

    let statusStr = row.status || raw.lectureStatusNm || raw.status || '-';

    // Status normalization
    if (STATUS_MAP[statusStr]) {
        statusStr = STATUS_MAP[statusStr];
    } else if (statusStr.includes('대기')) {
        statusStr = '접수대기';
    } else if (statusStr.includes('추가')) {
        statusStr = '추가접수';
    }

    let imageUrl = row.image_url;
    if (!imageUrl || imageUrl.includes("placehold.co") || imageUrl.includes("picsum.photos")) {
        imageUrl = assignImage(title, category);
    }

    let link = row.link || (raw.lectureId ? `https://everlearning.sen.go.kr/ever/menu/10010/program/30002/lectureDetail.do?lectureId=${raw.lectureId}` : "");
    if (!link || link.includes('chairList.jsp') || link.includes('lectureDetail.do')) {
        link = `https://everlearning.sen.go.kr/ever/menu/10010/program/30002/lectureList.do?searchKeyword=${encodeURIComponent(title)}`;
    }

    return {
        id: row.id,
        title, category, target, status: statusStr, imageUrl, dDay: row.d_day || "", institution,
        price: row.price || "무료", region: region || "서울시", place: rawPlace || institution || "장소 미정",
        courseDate: row.course_date || "", applyDate: row.apply_date || "", time: row.time || "",
        capacity: Number(row.capacity || 0), contact: row.contact || "", link
    };
}

// [핵심 수정] 필터링용 메타데이터 (Efficient Fetching)
export async function getFilterMetadata(): Promise<FilterMetadata[]> {
    try {
        const batchSize = 1000;
        let hasMore = true;
        let page = 0;
        const allData: FilterMetadata[] = [];

        // Supabase에서 distinct 지원이 제한적이므로, 컬럼만 가져와서 JS Set으로 중복 제거
        // 메모리 효율을 위해 필요한 컬럼만 정확히 선택
        while (hasMore) {
            const { data, error } = await supabase
                .from('courses')
                .select('region, institution')
                .not('region', 'is', null)
                .range(page * batchSize, (page + 1) * batchSize - 1);

            if (error) throw error;

            if (data) {
                // 타입 단언: Supabase 반환값이 Partial<T> 일 수 있으므로
                const typedData = data as unknown as FilterMetadata[];
                const normalized = typedData.map(item =>
                    normalizeRegionAndInstitution(item.region, item.institution)
                );
                allData.push(...normalized);

                if (data.length < batchSize) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }

        // 중복 제거
        const uniqueSet = new Set<string>();
        const uniqueData: FilterMetadata[] = [];

        for (const item of allData) {
            const key = `${item.region}|${item.institution}`;
            if (!uniqueSet.has(key)) {
                uniqueSet.add(key);
                uniqueData.push(item);
            }
        }

        console.log(`✅ [Metadata] Loaded ${uniqueData.length} unique records from ${allData.length} total rows.`);
        return uniqueData;

    } catch (error) {
        console.error('Failed to fetch metadata:', error);
        return [];
    }
}

// [함수 2] 페이지네이션 및 서버 사이드 필터링 적용 함수
export async function getPaginatedCourses(
    page: number,
    limit: number,
    filters: CourseFilterParams,
    userId?: string // [추가] 유저 ID를 받아서 찜 여부 확인
): Promise<Course[]> {
    try {
        let query = supabase.from('courses').select(COURSE_COLUMNS);

        if (filters.majorRegion !== "전체 지역") {
            if (filters.majorRegion === "서울특별시") {
                if (filters.minorRegion !== "전체") {
                    const compactMinor = filters.minorRegion.replace(/\s+/g, '');
                    query = query.ilike('region', `%${compactMinor}%`);
                } else {
                    query = query.or('region.ilike.%구,region.ilike.%서울%');
                }
            } else {
                const compactMajor = filters.majorRegion.replace(/\s+/g, '');
                query = query.ilike('region', `%${compactMajor}%`);
            }
        }

        if (filters.organ !== "전체 기관") {
            const compactOrgan = filters.organ.replace(/\s+/g, '');
            query = query.ilike('institution', `%${compactOrgan}%`);
        }

        if (filters.status !== "전체 상태") {
            if (filters.status === "접수중") {
                query = query.in('status', ['접수중', '마감임박']);
            } else {
                query = query.eq('status', filters.status);
            }
        }

        if (filters.search) {
            const safeSearch = filters.search.replace(/[,%]/g, '');
            if (safeSearch) {
                query = query.or(`title.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`);
            }
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error } = await query
            .order('id', { ascending: false })
            .range(from, to);

        if (error) throw error;
        if (!data) return [];

        let courses = data.map(mapRawToCourse);

        // [핵심] 유저 ID가 있다면 찜 목록을 가져와서 매핑
        if (userId) {
            const courseIds = courses.map(c => c.id);
            if (courseIds.length > 0) {
                const { data: bookmarks, error: bookmarkError } = await supabase
                    .from('bookmarks')
                    .select('course_id')
                    .eq('user_id', userId)
                    .in('course_id', courseIds);

                if (!bookmarkError && bookmarks) {
                    const bookmarkedSet = new Set(bookmarks.map(b => b.course_id));
                    courses = courses.map(c => ({
                        ...c,
                        isBookmarked: bookmarkedSet.has(Number(c.id)) // ID 타입 주의 (DB는 int일 확률 높음)
                    }));
                }
            }
        }

        return courses;

    } catch (error) {
        console.error('Failed to fetch paginated courses:', error);
        throw error;
    }
}

export async function getRecommendedCourses(): Promise<Course[]> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select(COURSE_COLUMNS)
            .in('status', ['추가접수', '마감임박', '접수중', '접수예정'])
            .limit(50);

        if (error) throw error;
        if (!data || data.length === 0) return [];

        const courses = data.map(mapRawToCourse);
        const highPriority = courses.filter(c => ['추가접수', '마감임박'].includes(c.status));
        const normalPriority = courses.filter(c => !['추가접수', '마감임박'].includes(c.status));

        const shuffle = (array: Course[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };
        const shuffledHigh = shuffle([...highPriority]);
        const shuffledNormal = shuffle([...normalPriority]);
        return [...shuffledHigh, ...shuffledNormal].slice(0, 4);
    } catch (error) {
        console.error('Failed to fetch recommended courses:', error);
        return [];
    }
}

export async function getCourseById(id: string): Promise<Course | null> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select(COURSE_COLUMNS)
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
