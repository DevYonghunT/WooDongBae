import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 환경 변수 로드 (main.ts와 동일한 방식)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// API 설정
const OPERATION_NAME = 'getLectureList';
const BASE_URL = 'https://apis.data.go.kr/7010000/everlearning';
const API_URL = `${BASE_URL}/${OPERATION_NAME}`;
const PAGE_SIZE = 1000;

// [Helper] 상태 계산
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

// [Helper] D-Day 계산
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

export async function fetchAndSaveSeoulData() {
    try {
        console.log("🔄 [서울시 API] 데이터 동기화 시작...");

        const apiKey = process.env.NEXT_PUBLIC_API_KEY; // 공공데이터포털 디코딩 키
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!apiKey || !supabaseUrl || !supabaseKey) {
            throw new Error("필수 환경 변수(API_KEY, SUPABASE_URL, SERVICE_ROLE_KEY)가 누락되었습니다.");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const parser = new XMLParser();

        const fetchPage = async (pageNo: number) => {
            const targetUrl = `${API_URL}?serviceKey=${apiKey}&numOfRows=${PAGE_SIZE}&pageNo=${pageNo}`;
            try {
                const response = await fetch(targetUrl);
                if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

                const xmlText = await response.text();
                if (xmlText.includes("<OpenAPI_ServiceResponse>")) {
                    console.error("🔥 공공데이터 에러 응답:", xmlText);
                    return [];
                }

                const jsonObj = parser.parse(xmlText);
                const items = jsonObj?.response?.body?.items?.item;
                if (!items) return [];
                return Array.isArray(items) ? items : [items];
            } catch (e) {
                console.error(`   ❌ 페이지 ${pageNo} 호출 실패:`, e);
                return [];
            }
        };

        const allCourses: any[] = [];
        let pageNo = 1;

        while (true) {
            const pageCourses = await fetchPage(pageNo);
            if (pageCourses.length === 0) break;

            allCourses.push(...pageCourses);
            process.stdout.write(`\r   📄 페이지 ${pageNo} 수집 중... (누적 ${allCourses.length}개)`);

            if (pageCourses.length < PAGE_SIZE) break;
            pageNo++;
        }
        console.log(""); // 줄바꿈

        if (allCourses.length === 0) {
            console.log("⚠️ [서울시 API] 수집된 데이터가 없습니다.");
            return;
        }

        console.log(`✅ 총 ${allCourses.length}개 강좌 발견! DB 저장을 시작합니다.`);

        // 데이터 매핑
        const coursesToUpsert = allCourses.map((item: any, index: number) => {
            const rawStatus = item.lectureStatusNm || item.status || '-';
            const status = calculateStatus(rawStatus, item.applyStartYmd, item.applyEndYmd);
            const title = item.lectureNm || item.lecture_nm || '제목 없음';
            const fmtDate = (str: string) => str ? str.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '';
            const searchUrl = `https://everlearning.sen.go.kr/ever/menu/10010/program/30002/lectureList.do?searchKeyword=${encodeURIComponent(title)}`;

            return {
                title: title,
                category: item.cateNm || '평생학습',
                target: item.eduTarget || '전체',
                status: status,
                image_url: `https://picsum.photos/seed/${index}/800/600`, // 임시 이미지
                d_day: calculateDday(item.applyEndYmd),
                institution: item.organNm || '서울시교육청',
                price: item.eduFee || '무료',
                region: item.sigunguNm || '서울특별시', // [중요] 필터용 지역명 통일
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

        // 배치 저장
        const BATCH_SIZE = 500;
        for (let i = 0; i < coursesToUpsert.length; i += BATCH_SIZE) {
            const batch = coursesToUpsert.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('courses').upsert(batch, {
                onConflict: 'institution, title',
                ignoreDuplicates: false
            });

            if (error) console.error(`   🔥 저장 실패 (${i}~):`, error.message);
        }

        console.log("✨ [서울시 API] 동기화 완료!");

    } catch (error) {
        console.error("❌ [서울시 API] 치명적 오류:", error);
    }
}