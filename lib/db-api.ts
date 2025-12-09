import { createClient } from '@supabase/supabase-js';
import { Course } from "@/types/course";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// [설정] 키워드별 이미지 매핑
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

const STATUS_PRIORITY: Record<string, number> = {
    '추가접수': 1,
    '마감임박': 2,
    '접수중': 3,
    '접수예정': 4,
    '접수대기': 5,
    '모집종료': 6
};

// [최적화 1] 가져올 컬럼 명시 (무거운 raw_data 제외)
const COURSE_COLUMNS = `
  id, title, category, target, status, image_url, d_day, institution, price,
  region, place, course_date, apply_date, time, capacity, contact, link, created_at
`;

// [추가됨] 기관명 정제 함수 (지도 검색 정확도 향상)
function refineInstitutionName(rawName: string): string {
    let name = rawName.trim();

    // 검색이 잘 안되는 특정 케이스 수동 보정
    if (name.includes("성동광진")) return "성동광진교육지원청";
    if (name === "학생체육관") return "서울특별시교육청학생체육관";
    if (name === "구리시꿈꾸는공작소") return "구리시인창도서관"; // 사용자 요청 반영

    return name;
}

function assignImage(title: string, category: string): string {
    const searchString = `${title} ${category}`;
    for (const [keyword, url] of Object.entries(KEYWORD_IMAGES)) {
        if (searchString.includes(keyword)) {
            return url;
        }
    }
    return DEFAULT_LOGO_IMAGE;
}

function formatDate(str: string) {
    if (!str) return "";
    return str.replace(/-/g, ".");
}

function mapRawToCourse(row: any): Course {
    // raw_data가 없어도 컬럼 데이터로 매핑되도록 처리
    const raw = row.raw_data || {};

    const title = row.title || raw.lectureNm || raw.title || "제목 없음";
    const category = row.category || raw.cateNm || raw.category || "기타";

    // 기관명 정제
    const institution = refineInstitutionName(row.institution || raw.organNm || raw.institution || "기관 미정");
    const target = row.target || raw.eduTarget || raw.targetNm || "전체";

    let statusStr = row.status || raw.lectureStatusNm || raw.status || '-';

    // 상태 계산 로직
    if (statusStr === '마감' || statusStr === '접수완료' || statusStr === '강좌종료' || statusStr === '접수마감') statusStr = '모집종료';
    else if (statusStr.includes('대기')) statusStr = '접수대기';
    else if (statusStr.includes('추가')) statusStr = '추가접수';
    else if (statusStr === '준비') statusStr = '접수예정';

    // (날짜 기반 상태 계산 로직 - 기본적으로 컬럼 status가 있지만 혹시 없을 경우를 대비해 유지)
    if (!statusStr || statusStr === '-' || statusStr.trim() === '') {
        const startYmd = raw.applyStartYmd || row.apply_date;
        const endYmd = raw.applyEndYmd;
        // ... (필요하다면 날짜 로직 사용, 하지만 보통 DB값 사용)
    }

    // 이미지 처리
    let imageUrl = row.image_url;
    if (!imageUrl || imageUrl.includes("placehold.co") || imageUrl.includes("picsum.photos")) {
        imageUrl = assignImage(title, category);
    }

    // 링크 처리 (검색 링크 우선)
    // DB의 row.link가 있으면 사용, 없으면 raw.lectureId로 생성 시도, 그마저도 없으면 빈 문자열
    let link = row.link || (raw.lectureId ? `https://everlearning.sen.go.kr/ever/menu/10010/program/30002/lectureDetail.do?lectureId=${raw.lectureId}` : "");

    // 1. 링크가 없거나
    // 2. 404가 뜨는 'chairList.jsp'가 포함되어 있거나
    // 3. 리다이렉트 문제가 있는 'lectureDetail.do'라면
    // -> 안전한 목록 페이지(lectureList.do)로 변경
    if (!link || link.includes('chairList.jsp') || link.includes('lectureDetail.do')) {
        link = `https://everlearning.sen.go.kr/ever/menu/10010/program/30002/lectureList.do?searchKeyword=${encodeURIComponent(title)}`;
    }

    // [핵심] 이제 row(컬럼값)을 우선적으로 사용합니다.
    return {
        id: row.id,
        title,
        category,
        target,
        status: statusStr,
        imageUrl,
        dDay: row.d_day || "",
        institution,
        price: row.price || "무료",
        region: row.region || "서울시",
        place: row.place || "장소 미정",
        courseDate: row.course_date || "",
        applyDate: row.apply_date || "",
        time: row.time || "",
        capacity: Number(row.capacity || 0),
        contact: row.contact || "",
        link
    };
}

// [최적화 2] 전체 강좌 조회 시 가벼운 쿼리 사용
export async function getCoursesFromDB(): Promise<Course[]> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select(COURSE_COLUMNS) // '*' 대신 필요한 컬럼만 선택
            .order('id', { ascending: false });

        if (error) throw error;

        return (data || [])
            .map(mapRawToCourse)
            .sort((a, b) => {
                const pA = STATUS_PRIORITY[a.status] || 99;
                const pB = STATUS_PRIORITY[b.status] || 99;
                if (pA !== pB) return pA - pB;
                return Number(b.id) - Number(a.id);
            });

    } catch (error) {
        console.error('Failed to fetch from DB:', error);
        return [];
    }
}

// [최적화 3] 추천 강좌: DB단에서 필터링해서 가져오기 (속도 대폭 향상)
export async function getRecommendedCourses(): Promise<Course[]> {
    try {
        // DB에서 '접수중', '추가접수' 등 유효한 상태인 것만 가져옴 (전체 로드 X)
        const { data, error } = await supabase
            .from('courses')
            .select(COURSE_COLUMNS)
            .in('status', ['추가접수', '마감임박', '접수중', '접수예정'])
            .limit(50); // 랜덤 셔플을 위해 충분한 양(50개)만 가져옴

        if (error) throw error;
        if (!data || data.length === 0) return [];

        const courses = data.map(mapRawToCourse);

        // 우선순위 정렬 및 셔플 (JS 로직 유지)
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

// 상세 페이지용 (단일 조회는 이미 빠르지만 raw_data 제외 적용)
export async function getCourseById(id: string): Promise<Course | null> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select(COURSE_COLUMNS) // raw_data 제외
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