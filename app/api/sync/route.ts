import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// API 설정
const OPERATION_NAME = 'getLectureList';
const BASE_URL = 'https://apis.data.go.kr/7010000/everlearning';
const API_URL = `${BASE_URL}/${OPERATION_NAME}`;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export async function GET() {
    try {
        console.log("🔄 동기화 시작 (getLectureList)...");

        // 1. 공공데이터 API 호출 (1000개 요청)
        const targetUrl = `${API_URL}?serviceKey=${API_KEY}&numOfRows=1000&pageNo=1`;
        console.log("📡 호출 URL:", targetUrl);

        const response = await fetch(targetUrl);

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }

        const xmlText = await response.text();

        // 에러 응답 체크
        if (xmlText.includes("<OpenAPI_ServiceResponse>")) {
            console.error("🔥 공공데이터 에러 응답:", xmlText);
            return NextResponse.json({ message: "공공데이터 서비스 에러 (키 또는 트래픽 문제)" }, { status: 500 });
        }

        // 2. XML 파싱
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlText);

        const items = jsonObj?.response?.body?.items?.item;

        if (!items) {
            console.log("데이터 없음. 전체 응답:", JSON.stringify(jsonObj, null, 2));
            return NextResponse.json({ message: "데이터가 없습니다." }, { status: 200 });
        }

        const rawCourses = Array.isArray(items) ? items : [items];
        console.log(`✅ ${rawCourses.length}개 강좌 발견!`);

        // [Helper] 상태 계산 함수 (DB API와 로직 통일)
        const calculateStatus = (statusStr: string, startYmd: string, endYmd: string) => {
            // 1. 명확한 상태 매핑
            if (statusStr === '마감' || statusStr === '접수완료' || statusStr === '강좌종료') return '모집종료';
            // [추가됨] '추가' 키워드 인식
            if (statusStr && statusStr.includes('추가')) return '추가접수';
            if (statusStr && statusStr.includes('대기')) return '접수대기';

            // 2. 상태값이 없거나('-') 애매할 때 날짜 기반 판단
            if (!statusStr || statusStr === '-' || statusStr.trim() === '') {
                if (!startYmd || !endYmd) return '접수중';

                const today = new Date();
                // 날짜 포맷 정규화 (YYYYMMDD or YYYY-MM-DD)
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

            // 날짜 차이 계산
            const diffTime = end.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return "마감";
            if (diffDays === 0) return "오늘마감";
            return `D-${diffDays}`;
        };

        // 3. 데이터 매핑
        const coursesToUpsert = rawCourses.map((item: any, index: number) => {
            // 원본 데이터에서 값 추출
            const rawStatus = item.lectureStatusNm || item.status || '-';
            const finalStatus = calculateStatus(rawStatus, item.applyStartYmd, item.applyEndYmd);

            return {
                title: item.lectureNm || item.lecture_nm || '제목 없음',
                category: item.cateNm || '평생학습',
                target: item.eduTarget || '전체',

                // [중요] 계산된 최종 상태값 저장
                status: finalStatus,

                // [중요] Picsum 랜덤 이미지 (index 활용하여 고유 이미지 생성)
                image_url: `https://picsum.photos/seed/${index}/800/600`,

                d_day: calculateDday(item.applyEndYmd), // D-Day 계산
                institution: item.organNm || '서울시교육청',
                price: item.eduFee || '무료',

                // [중요] 상세 정보 활용을 위해 원본 통째로 저장
                raw_data: item
            };
        });

        // 4. Supabase 저장
        await supabase.from('courses').delete().neq('id', 0); // 기존 데이터 삭제
        const { error } = await supabase.from('courses').insert(coursesToUpsert);

        if (error) {
            console.error("Supabase 저장 실패:", error);
            throw error;
        }

        return NextResponse.json({
            message: `성공! ${coursesToUpsert.length}개 강좌 동기화 완료`,
            count: coursesToUpsert.length
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}