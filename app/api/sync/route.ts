import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// [수정 1] 스크린샷에서 확인한 정확한 기능명
const OPERATION_NAME = 'getLectureList';
const BASE_URL = 'https://apis.data.go.kr/7010000/everlearning';
const API_URL = `${BASE_URL}/${OPERATION_NAME}`;

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export async function GET() {
    try {
        console.log("🔄 동기화 시작 (getLectureList)...");

        // 1. 공공데이터 API 호출
        const targetUrl = `${API_URL}?serviceKey=${API_KEY}&numOfRows=1000&pageNo=1`;
        console.log("📡 호출 URL:", targetUrl);

        const response = await fetch(targetUrl);

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }

        const xmlText = await response.text();

        // 에러 응답인지 체크
        if (xmlText.includes("<OpenAPI_ServiceResponse>")) {
            console.error("🔥 공공데이터 에러 응답:", xmlText);
            return NextResponse.json({ message: "공공데이터 서비스 에러 (키 또는 트래픽 문제)" }, { status: 500 });
        }

        // 2. XML 파싱
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlText);

        // [수정 2] 응답 구조에 맞게 items 찾기
        const items = jsonObj?.response?.body?.items?.item;

        if (!items) {
            console.log("데이터 없음. 전체 응답:", JSON.stringify(jsonObj, null, 2));
            return NextResponse.json({ message: "데이터가 없습니다." }, { status: 200 });
        }

        const rawCourses = Array.isArray(items) ? items : [items];
        console.log(`✅ ${rawCourses.length}개 강좌 발견!`);

        // 3. 데이터 매핑 (스크린샷 기반)
        const coursesToUpsert = rawCourses.map((item: any, index: number) => {
            return {
                title: item.lectureNm || item.lecture_nm || '제목 없음',
                category: item.cateNm || '평생학습',
                target: item.eduTarget || '전체',
                status: '접수중',

                // [수정됨] 여기가 핵심입니다! Unsplash -> Picsum으로 변경
                // index를 활용해 강좌마다 다른 이미지가 나오도록 설정
                image_url: `https://picsum.photos/seed/${index}/800/600`,

                d_day: 'D-Day',
                institution: item.organNm || '서울시교육청',
                price: item.eduFee || '무료',
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