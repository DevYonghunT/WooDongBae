import { createClient } from '@supabase/supabase-js';
import { Course } from "@/types/course";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// [설정] 키워드별 이미지 매핑
const KEYWORD_IMAGES: Record<string, string> = {
    // ... (기존 키워드 유지, 너무 길어서 생략하지만 파일엔 꼭 있어야 합니다!) ...
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
    const raw = row.raw_data || {};

    const title = raw.lectureNm || raw.lecture_nm || raw.title || row.title || "제목 없음";
    const category = raw.cateNm || raw.category || row.category || "기타";

    // [핵심 수정] 기관명을 가져올 때 정제 함수를 통과시킴
    const rawInstitution = raw.organNm || raw.organ_nm || raw.institution || row.institution || "기관 미정";
    const institution = refineInstitutionName(rawInstitution);

    const target = raw.eduTarget || raw.targetNm || raw.target || row.target || "전체";

    let statusStr = raw.lectureStatusNm || raw.status || row.status || '-';

    if (statusStr === '마감' || statusStr === '접수완료' || statusStr === '강좌종료' || statusStr === '접수마감') statusStr = '모집종료';
    else if (statusStr.includes('대기')) statusStr = '접수대기';
    else if (statusStr.includes('추가')) statusStr = '추가접수';
    else if (statusStr === '준비') statusStr = '접수예정';

    if (!statusStr || statusStr === '-' || statusStr.trim() === '') {
        const startYmd = raw.applyStartYmd || row.apply_date;
        const endYmd = raw.applyEndYmd;

        if (!startYmd || !endYmd) {
            statusStr = '접수중';
        } else {
            const today = new Date();
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

    let imageUrl = row.image_url;
    if (!imageUrl || imageUrl.includes("placehold.co") || imageUrl.includes("picsum.photos")) {
        imageUrl = assignImage(title, category);
    }

    const courseDate = raw.course_date || row.course_date ||
        `${formatDate(raw.lectureStartYmd)} ~ ${formatDate(raw.lectureEndYmd)}`;

    const applyDate = raw.apply_date || row.apply_date ||
        `${formatDate(raw.applyStartYmd)} ~ ${formatDate(raw.applyEndYmd)}`;

    const place = raw.place || row.place || "장소 미정";
    const capacity = Number(raw.onApplyNum || raw.capacity || row.capacity || 0);
    const price = raw.eduFee || raw.price || row.price || "무료";

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
        status: statusStr,
        imageUrl,
        dDay: row.d_day || "",
        institution, // 정제된 기관명 사용
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

        const availableCourses = allCourses.filter(course =>
            ['추가접수', '마감임박', '접수중', '접수예정'].includes(course.status)
        );

        if (availableCourses.length === 0) return [];

        const highPriority = availableCourses.filter(c => ['추가접수', '마감임박'].includes(c.status));
        const normalPriority = availableCourses.filter(c => !['추가접수', '마감임박'].includes(c.status));

        const shuffle = (array: Course[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const shuffledHigh = shuffle([...highPriority]);
        const shuffledNormal = shuffle([...normalPriority]);
        const combined = [...shuffledHigh, ...shuffledNormal];

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