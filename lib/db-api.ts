import { createClient } from '@supabase/supabase-js';
import { Course } from "@/types/course";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// [설정] 키워드별 이미지 매핑
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

// 기본 로고 이미지
const DEFAULT_LOGO_IMAGE = "https://placehold.co/800x600/f97316/ffffff?text=UDB&font=roboto";

// [설정] 상태값 우선순위 (낮을수록 상단 노출)
const STATUS_PRIORITY: Record<string, number> = {
    '추가접수': 1,
    '마감임박': 2,
    '접수중': 3,
    '접수예정': 4,
    '접수대기': 5,
    '모집종료': 6
};

// [Helper] 이미지 자동 배정 함수
function assignImage(title: string, category: string): string {
    const searchString = `${title} ${category}`;
    for (const [keyword, url] of Object.entries(KEYWORD_IMAGES)) {
        if (searchString.includes(keyword)) {
            return url;
        }
    }
    return DEFAULT_LOGO_IMAGE;
}

// [Helper] 날짜 포맷 함수 (YYYYMMDD -> YYYY.MM.DD)
function formatDate(str: string) {
    if (!str) return "";
    return str.replace(/-/g, "."); // 하이픈이 있으면 점으로 변경
}

// [핵심] 통합 데이터 매핑 함수 (API & 크롤링 호환)
function mapRawToCourse(row: any): Course {
    const raw = row.raw_data || {};

    // 1. 기본 정보 매핑 (API vs 크롤링 필드명 대응)
    const title = raw.lectureNm || raw.lecture_nm || raw.title || row.title || "제목 없음";
    const category = raw.cateNm || raw.category || row.category || "기타";
    const institution = raw.organNm || raw.organ_nm || raw.institution || row.institution || "기관 미정";
    const target = raw.eduTarget || raw.targetNm || raw.target || row.target || "전체";

    // 2. 상태값(Status) 표준화 로직
    // (API: lectureStatusNm / 크롤링: status / DB컬럼: status)
    let statusStr = raw.lectureStatusNm || raw.status || row.status || '-';

    // 상태값 키워드 변환
    if (statusStr === '마감' || statusStr === '접수완료' || statusStr === '강좌종료' || statusStr === '접수마감') statusStr = '모집종료';
    else if (statusStr.includes('대기')) statusStr = '접수대기';
    else if (statusStr.includes('추가')) statusStr = '추가접수';
    else if (statusStr === '준비') statusStr = '접수예정';

    // 날짜 기반 상태 자동 판별 (상태값이 없거나 애매할 때)
    if (!statusStr || statusStr === '-' || statusStr.trim() === '') {
        const startYmd = raw.applyStartYmd || row.apply_date; // 필드명 주의
        const endYmd = raw.applyEndYmd;

        if (!startYmd || !endYmd) {
            statusStr = '접수중'; // 날짜도 없으면 기본값
        } else {
            const today = new Date();
            // 날짜 포맷 정규화
            const format = (str: string) => str.includes('-') ? str : str.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            const start = new Date(format(startYmd));
            const end = new Date(format(endYmd));

            today.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            if (today < start) statusStr = '접수예정';
            else if (today > end) statusStr = '모집종료';
            else statusStr = '접수중';
        }
    }

    // 3. 이미지 (Image)
    // DB 컬럼에 image_url이 있고, 유효한 URL이면 사용 (크롤러 데이터 우선)
    // 단, placehold.co나 picsum.photos 랜덤 이미지는 키워드 매칭보다 우선순위를 낮춤 (선택사항)
    let imageUrl = row.image_url;
    // 이미지가 없거나, 기본 플레이스홀더/랜덤이미지라면 -> 키워드 매칭 시도
    if (!imageUrl || imageUrl.includes("placehold.co") || imageUrl.includes("picsum.photos")) {
        imageUrl = assignImage(title, category);
    }

    // 4. 날짜 및 기타 정보
    const courseDate = raw.course_date || row.course_date ||
        `${formatDate(raw.lectureStartYmd)} ~ ${formatDate(raw.lectureEndYmd)}`;

    const applyDate = raw.apply_date || row.apply_date ||
        `${formatDate(raw.applyStartYmd)} ~ ${formatDate(raw.applyEndYmd)}`;

    const place = raw.place || row.place || "장소 미정";
    const capacity = Number(raw.onApplyNum || raw.capacity || row.capacity || 0);
    const price = raw.eduFee || raw.price || row.price || "무료";

    // 5. 링크 (Link)
    let link = row.link || raw.link || "";
    if (!link && raw.lectureId) {
        link = `https://everlearning.sen.go.kr/ever/menu/10010/program/30002/lectureDetail.do?lectureId=${raw.lectureId}`;
    } else if (!link) {
        link = `https://everlearning.sen.go.kr/chair/chairList.jsp?searchWord=${encodeURIComponent(title)}`;
    }

    return {
        id: row.id,
        title,
        category,
        target,
        status: statusStr, // 최종 계산된 상태값
        imageUrl,
        dDay: row.d_day || "",
        institution,
        price: typeof price === 'number' || (!isNaN(Number(price)) && price !== "무료") ? `${Number(price).toLocaleString()}원` : price,
        region: raw.sigunguNm || row.region || "서울시",
        place,
        courseDate,
        applyDate,
        time: raw.dayOfWeek ? `${raw.dayOfWeek} ${raw.lectureStartTm}~` : (raw.time || row.time || "시간 상세참조"),
        capacity,
        contact: raw.organTelNo || raw.contactInfo || row.contact || "",
        link
    };
}

// 1. 전체 강좌 목록 가져오기
export async function getCoursesFromDB(): Promise<Course[]> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        return (data || [])
            .map(mapRawToCourse)
            .sort((a, b) => {
                // 정렬 로직 (우선순위 -> 최신순)
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

// 2. 추천 강좌 가져오기
export async function getRecommendedCourses(): Promise<Course[]> {
    try {
        const allCourses = await getCoursesFromDB();

        // 신청 가능한 강좌만 필터링
        const availableCourses = allCourses.filter(course =>
            ['추가접수', '마감임박', '접수중', '접수예정'].includes(course.status)
        );

        if (availableCourses.length === 0) return [];

        // 우선순위 그룹 분리
        const highPriority = availableCourses.filter(c => ['추가접수', '마감임박'].includes(c.status));
        const normalPriority = availableCourses.filter(c => !['추가접수', '마감임박'].includes(c.status));

        // 셔플 함수
        const shuffle = (array: Course[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        // 그룹별 셔플 및 병합
        const shuffledHigh = shuffle([...highPriority]);
        const shuffledNormal = shuffle([...normalPriority]);
        const combined = [...shuffledHigh, ...shuffledNormal];

        // 상위 4개 반환
        return combined.slice(0, 4);

    } catch (error) {
        console.error('Failed to fetch recommended courses:', error);
        return [];
    }
}

// 3. 상세 강좌 가져오기
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