
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. 환경변수 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// 2. 클라이언트 설정
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // 관리자 권한 필수
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) {
    console.error("❌ 필수 환경변수가 누락되었습니다.");
    console.error(`- URL: ${!!SUPABASE_URL}`);
    console.error(`- SERVICE_KEY: ${!!SUPABASE_KEY}`);
    console.error(`- GEMINI_KEY: ${!!GEMINI_KEY}`);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// 3. 표준 카테고리 정의
const STANDARD_CATEGORIES = [
    '스포츠/운동', '인문학/독서', '어학/외국어', 'IT/컴퓨터', '미술/공예',
    '음악/악기', '요리/제과', '자격증/취업', '건강/웰빙', '경제/재테크',
    '어린이/육아', '기타'
];

async function main() {
    console.log("🤖 AI 분류 에이전트 시작...");

    try {
        // STEP 1: 분류 대상 데이터 조회
        const TARGET_CATEGORIES = ['기타', '평생학습', '문화예술', '인문교양', '강좌'];

        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, title, institution, category')
            .in('category', TARGET_CATEGORIES)

        if (error) throw error;
        if (!courses || courses.length === 0) {
            console.log("✅ 재분류할 대상이 없습니다.");
            return;
        }

        console.log(`📋 총 ${courses.length}개의 재분류 대상 발견.`);

        // STEP 2: 배치 처리 (20개씩)
        const BATCH_SIZE = 20;
        for (let i = 0; i < courses.length; i += BATCH_SIZE) {
            const batch = courses.slice(i, i + BATCH_SIZE);
            console.log(`🔄 [Batch ${Math.floor(i / BATCH_SIZE) + 1}] ${batch.length}개 처리 중...`);

            const prompt = `
                다음은 강좌 목록이야. 각 강좌를 아래 표준 카테고리 중 하나로 가장 적절하게 분류해줘.
                
                [표준 카테고리]
                ${STANDARD_CATEGORIES.join(', ')}

                [강좌 목록]
                ${JSON.stringify(batch.map(c => ({ id: c.id, title: c.title, institution: c.institution })))}

                강좌 제목과 기관명을 단서로 사용해.
                응답은 반드시 아래 JSON 형식으로만 줘 (마크다운 없이).
                { "results": [ { "id": 123, "category": "IT/컴퓨터" }, ... ] }
            `;

            try {
                const result = await model.generateContent(prompt);
                const response = result.response;
                const text = response.text();

                // JSON 파싱 (마크다운 코드 블록 제거)
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(jsonStr);

                if (parsed.results && Array.isArray(parsed.results)) {
                    // STEP 3: DB 업데이트
                    let updatedCount = 0;
                    for (const item of parsed.results) {
                        const { error: updateError } = await supabase
                            .from('courses')
                            .update({ category: item.category })
                            .eq('id', item.id);

                        if (!updateError) updatedCount++;
                        else console.error(`❌ ID ${item.id} 업데이트 실패:`, updateError.message);
                    }
                    console.log(`✅ [Batch ${Math.floor(i / BATCH_SIZE) + 1}] ${updatedCount}/${batch.length}개 업데이트 완료`);
                }

            } catch (err) {
                console.error(`🔥 배치 처리 중 오류 발생:`, err);
            }

            // API 부하 방지 대기
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("🎉 모든 작업이 완료되었습니다.");

    } catch (error) {
        console.error("🔥 치명적 오류:", error);
    }
}

main();
