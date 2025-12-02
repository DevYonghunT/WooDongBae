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

// [수정됨] 정렬 우선순위 (필터 옵션과 이름 통일)
const STATUS_PRIORITY: Record<string, number> = {
    '추가접수': 1,
    '마감임박': 2,
    '접수중': 3,
    '접수예정': 4,
    '접수대기': 5,
    '모집종료': 6
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

function formatDate(str: string) {
    if (!str) return "";
    return str.replace(/-/g, ".");
}

// [핵심] DB 원본 데이터를 우리 앱의 Course 타입으로 변환 (상태 계산 로직 포함)
function mapRawToCourse(row: any): Course {
    const raw = row.raw_data || {};
    const title = raw.lectureNm || row.title || "";
    const category = raw.categoryNm || row.category || "";
    const lectureId = raw.lectureId;

    const detailLink = lectureId
        ? `https://everlearning.sen.go.kr/ever/menu/10010/program/30002/lectureDetail.do?lectureId=${lectureId}`
        : `https://everlearning.sen.go.kr/chair/chairList.jsp?searchWord=${encodeURIComponent(title)}`;

    // [중요] 상태값 판단 및 변환 함수
    const calculateStatus = (statusStr: string, startYmd: string, endYmd: string) => {
        // 1. 명확한 상태 매핑
        if (statusStr === '마감' || statusStr === '접수완료' || statusStr === '강좌종료') return '모집종료';

        // [추가됨] '추가' 글자 포함 시 무조건 추가접수
        if (statusStr && statusStr.includes('추가')) return '추가접수';

        if (statusStr && statusStr.includes('대기')) return '접수대기';

        // 2. 날짜 기반 판단 (기존 로직 유지)
        if (!statusStr || statusStr === '-' || statusStr.trim() === '') {
            if (!startYmd || !endYmd) return '접수중';

            const today = new Date();
            const format = (str: string) => str.includes('-') ? str : str.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            const start = new Date(format(startYmd));
            const end = new Date(format(endYmd));

            today.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            if (today < start) return '접수예정';
            if (today > end) return '모집종료';
            return '접수중';
        }
        return statusStr;
    };

    const rawStatus = raw.lectureStatusNm || row.status || '-';
    const finalStatus = calculateStatus(rawStatus, raw.applyStartYmd, raw.applyEndYmd);

    return {
        id: row.id,
        title: title,
        category: category,
        target: raw.targetNm || row.target,
        status: finalStatus, // 계산된 최종 상태값 사용
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
        contact: raw.organTelNo || raw.contactInfo || "",

        link: detailLink
    };
}

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
                // 정렬 로직 (STATUS_PRIORITY 기준)
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

export async function getRecommendedCourses(): Promise<Course[]> {
    try {
        const allCourses = await getCoursesFromDB();

        // 1. 신청 가능한 강좌만 필터링
        const availableCourses = allCourses.filter(course =>
            ['추가접수', '마감임박', '접수중', '접수예정'].includes(course.status)
        );

        if (availableCourses.length === 0) return [];

        // 2. 가중치 그룹 분리
        const highPriority = availableCourses.filter(c => ['추가접수', '마감임박'].includes(c.status));
        const normalPriority = availableCourses.filter(c => !['추가접수', '마감임박'].includes(c.status));

        // 3. 셔플 함수 (Fisher-Yates Shuffle)
        const shuffle = (array: Course[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        // 4. 각 그룹 셔플 및 병합
        // 우선순위 그룹을 먼저 배치하되, 너무 편향되지 않도록 적절히 섞을 수도 있음.
        // 여기서는 요구사항대로 "우선적으로" 보여주기 위해 앞쪽에 배치.
        const shuffledHigh = shuffle([...highPriority]);
        const shuffledNormal = shuffle([...normalPriority]);

        const combined = [...shuffledHigh, ...shuffledNormal];

        // 5. 상위 4개 반환
        return combined.slice(0, 4);

    } catch (error) {
        console.error('Failed to fetch recommended courses:', error);
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