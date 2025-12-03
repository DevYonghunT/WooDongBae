import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { UniversalAiScraper } from './ai-scraper.ts';

// 1. ES Module 환경에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. .env 파일 로드 시도 (우선순위: scrapers폴더 -> 상위폴더)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("⚠️  scrapers 폴더에 .env가 없거나 비어있어서 상위 폴더 .env.local을 찾습니다...");
    dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
}

// 3. 변수 할당
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

// 4. 디버깅 로그
console.log("-----------------------------------");
console.log("Checking Env Variables...");
console.log("URL:", SUPABASE_URL ? "✅ Loaded" : "❌ Missing");
console.log("KEY:", SUPABASE_KEY ? "✅ Loaded" : "❌ Missing");
console.log("GEMINI:", GEMINI_KEY ? "✅ Loaded" : "❌ Missing");
console.log("-----------------------------------");

// 5. 필수 키 검사
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("🚨 Error: Supabase URL 또는 Key가 없습니다.");
    console.error("해결법: scrapers/.env 파일을 만들고 키를 넣어주세요.");
    process.exit(1);
}

// 6. Supabase 클라이언트 초기화
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_SITES = [
    {
        name: "하남시가밀도서관",
        region: "하남시",
        url: "https://www.hanamlib.go.kr/gamlib/selectWebEdcLctreList.do?key=1515"
    }
];

async function main() {
    console.log("🚀 AI 범용 크롤러 시작...");

    // Gemini 키가 없으면 실행 불가
    if (!GEMINI_KEY) {
        console.error("🚨 Error: GEMINI_API_KEY가 없습니다. .env 파일에 추가해주세요.");
        process.exit(1);
    }

    const scraper = new UniversalAiScraper();

    for (const site of TARGET_SITES) {
        console.log(`\n--- [${site.name}] 처리 중 ---`);

        try {
            const courses = await scraper.scrape(site.url, site.name, site.region);

            if (courses.length > 0) {
                const dbData = courses.map(c => ({
                    title: c.title,
                    category: c.category,
                    target: c.target,
                    status: c.status,
                    image_url: c.image_url,
                    d_day: c.d_day,
                    institution: c.institution,
                    price: c.price,
                    region: c.region,
                    place: c.place,
                    course_date: c.course_date,
                    apply_date: c.apply_date,
                    time: c.time,
                    capacity: c.capacity,
                    contact: c.contact,
                    link: c.link,
                    raw_data: c
                }));

                // 해당 기관 데이터 초기화 후 재저장
                await supabase.from('courses').delete().eq('institution', site.name);

                const { error } = await supabase.from('courses').insert(dbData);

                if (error) console.error("🔥 저장 실패:", error.message);
                else console.log(`✨ ${courses.length}건 저장 완료!`);
            } else {
                console.log("⚠️ 데이터를 찾지 못했습니다.");
            }
        } catch (err) {
            console.error(`❌ [${site.name}] 처리 중 에러 발생:`, err);
        }
    }
}

main();