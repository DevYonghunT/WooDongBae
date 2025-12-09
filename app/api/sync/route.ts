import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

// API 설정
const OPERATION_NAME = 'getLectureList';
const BASE_URL = 'https://apis.data.go.kr/7010000/everlearning';
const API_URL = `${BASE_URL}/${OPERATION_NAME}`;

const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials are missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    return createClient(supabaseUrl, supabaseKey);
};
const PAGE_SIZE = 1000;

// [Helper] 상태 계산 함수
const calculateStatus = (statusStr: string, startYmd: string, endYmd: string) => {
    if (statusStr === '마감' || statusStr === '접수완료' || statusStr === '강좌종료') return '모집종료';
    if (statusStr && statusStr.includes('추가')) return '추가접수';
    if (statusStr && statusStr.includes('대기')) return '접수대기';

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

// [Helper] D-Day 계산 함수
const calculateDday = (endDateStr: string) => {
    if (!endDateStr) return "";
    const format = (str: string) => str.includes('-') ? str : str.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    const end = new Date(format(endDateStr));
    const today = new Date();

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "마감";
    if (diffDays === 0) return "오늘마감";
    return `D-${diffDays}`;
};

export async function GET() {
    try {
        const apiKey = process.env.NEXT_PUBLIC_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API key is missing. Please set NEXT_PUBLIC_API_KEY.' }, { status: 500 });
        }

        const supabase = getSupabaseClient();

        console.log("🔄 동기화 시작 (getLectureList)...");

        const parser = new XMLParser();

        const fetchPage = async (pageNo: number) => {
            const targetUrl = `${API_URL}?serviceKey=${apiKey}&numOfRows=${PAGE_SIZE}&pageNo=${pageNo}`;
            console.log(`📡 호출 URL (page ${pageNo}):`, targetUrl);

            const response = await fetch(targetUrl);

            if (!response.ok) {
                throw new Error(`API 호출 실패: ${response.status}`);
            }

            const xmlText = await response.text();

            // 에러 응답 체크
            if (xmlText.includes("<OpenAPI_ServiceResponse>")) {
                console.error("🔥 공공데이터 에러 응답:", xmlText);
                throw new Error("공공데이터 서비스 에러 (키 또는 트래픽 문제)");
            }

            const jsonObj = parser.parse(xmlText);
            const items = jsonObj?.response?.body?.items?.item;

            if (!items) return [];
            return Array.isArray(items) ? items : [items];
        };

        // 모든 페이지 수집 (페이지당 1000건)
        const allCourses: any[] = [];
        let pageNo = 1;

        while (true) {
            const pageCourses = await fetchPage(pageNo);
            if (pageCourses.length === 0) break;

            allCourses.push(...pageCourses);
            console.log(`✅ 페이지 ${pageNo}: ${pageCourses.length}개 누적 ${allCourses.length}개`);

            if (pageCourses.length < PAGE_SIZE) break; // 마지막 페이지
            pageNo += 1;
        }

        if (allCourses.length === 0) {
            return NextResponse.json({ message: "데이터가 없습니다." }, { status: 200 });
        }

        const rawCourses = allCourses;
        console.log(`✅ 총 ${rawCourses.length}개 강좌 발견!`);

        // 3. 데이터 매핑
        const coursesToUpsert = rawCourses.map((item: any, index: number) => {
            const rawStatus = item.lectureStatusNm || item.status || '-';
            const status = calculateStatus(rawStatus, item.applyStartYmd, item.applyEndYmd);
            const title = item.lectureNm || item.lecture_nm || '제목 없음';
            const fmtDate = (str: string) => str ? str.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '';

            // 검색용 링크
            const searchUrl = `https://everlearning.sen.go.kr/ever/menu/10010/program/30002/lectureList.do?searchKeyword=${encodeURIComponent(title)}`;

            return {
                title: title,
                category: item.cateNm || '평생학습',
                target: item.eduTarget || '전체',
                status: status,
                image_url: `https://picsum.photos/seed/${index}/800/600`,
                d_day: calculateDday(item.applyEndYmd),
                institution: item.organNm || '서울시교육청',
                price: item.eduFee || '무료',
                region: item.sigunguNm || '서울시',
                place: item.place || '장소 미정',
                course_date: `${fmtDate(item.lectureStartYmd)} ~ ${fmtDate(item.lectureEndYmd)}`,
                apply_date: `${fmtDate(item.applyStartYmd)} ~ ${fmtDate(item.applyEndYmd)}`,
                time: item.dayOfWeek ? `${item.dayOfWeek} ${item.lectureStartTm}~` : '',
                capacity: Number(item.onApplyNum || 0),
                contact: item.organTelNo || '',
                link: searchUrl,
                raw_data: item
            };
        });

        // 4. Supabase 저장 (Upsert)
        const BATCH_SIZE = 500;
        let successCount = 0;

        for (let i = 0; i < coursesToUpsert.length; i += BATCH_SIZE) {
            const batch = coursesToUpsert.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('courses').upsert(batch, {
                onConflict: 'institution, title',
                ignoreDuplicates: false
            });

            if (error) {
                console.error(`🔥 배치 저장 실패 (${i}~${i + BATCH_SIZE}):`, error);
            } else {
                successCount += batch.length;
                console.log(`💾 ${Math.min(i + BATCH_SIZE, coursesToUpsert.length)}/${coursesToUpsert.length} 저장 완료`);
            }
        }

        return NextResponse.json({
            message: `성공! 총 ${successCount}개 강좌 동기화 완료`,
            count: successCount
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}