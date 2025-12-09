import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
// import { fileURLToPath } from 'url'; // Removed to avoid import.meta usage
import { UniversalAiScraper } from './ai-scraper.ts';

// 1. ES Module 환경에서 __dirname 대용
const __dirname = process.cwd();

// 2. .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

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
    process.exit(1);
}
if (!GEMINI_KEY) {
    console.error("🚨 Error: GEMINI_API_KEY가 없습니다. .env 파일에 추가해주세요.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// [핵심] 크롤링할 도서관 목록
const TARGET_SITES = [
    { name: "하남시감일도서관", region: "하남시", url: "https://www.hanamlib.go.kr/gamlib/selectWebEdcLctreList.do?key=1515" },
    { name: "하남시미사도서관", region: "하남시", url: "https://www.hanamlib.go.kr/mslib/selectWebEdcLctreList.do?key=689" },
    { name: "하남시나룰도서관", region: "하남시", url: "https://www.hanamlib.go.kr/nalib/selectWebEdcLctreList.do?key=72" },
    { name: "하남시위례도서관", region: "하남시", url: "https://www.hanamlib.go.kr/wilib/selectWebEdcLctreList.do?key=975" },
    { name: "하남시신장도서관", region: "하남시", url: "https://www.hanamlib.go.kr/silib/selectWebEdcLctreList.do?key=163" },
    { name: "하남시세미도서관", region: "하남시", url: "https://www.hanamlib.go.kr/selib/selectWebEdcLctreList.do?key=340" },
    { name: "하남시디지털도서관", region: "하남시", url: "https://www.hanamlib.go.kr/dilib/selectWebEdcLctreList.do?key=553" },
    { name: "하남시덕풍도서관", region: "하남시", url: "https://www.hanamlib.go.kr/dulib/selectWebEdcLctreList.do?key=231" },
    { name: "하남시일가도서관", region: "하남시", url: "https://www.hanamlib.go.kr/iglib/selectWebEdcLctreList.do?key=1047" },
    { name: "하남시사립작은도서관", region: "하남시", url: "https://www.hanamlib.go.kr/eulib/selectBbsNttList.do?bbsNo=201&key=1275" },
    { name: "하남시어울림작은도서관", region: "하남시", url: "https://www.hanamlib.go.kr/eulib/selectWebEdcLctreList.do?key=1248" },
    { name: "하남시덕풍스포츠작은도서관", region: "하남시", url: "https://www.hanamlib.go.kr/dslib/selectWebEdcLctreList.do?key=1396" },
    { name: "구리시인창도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/menu/10052/program/30017/lectureList.do?manageCd=MA" },
    { name: "구리시토평도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/menu/10052/program/30017/lectureList.do?manageCd=TP" },
    { name: "구리시교문도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/menu/10052/program/30017/lectureList.do?manageCd=BR" },
    { name: "구리시갈매도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/menu/10052/program/30017/lectureList.do?manageCd=GM" }
];

async function main() {
    console.log(`🚀 총 ${TARGET_SITES.length}개 도서관 크롤링 시작...`);

    const scraper = new UniversalAiScraper();

    for (const site of TARGET_SITES) {
        console.log(`\n------------------------------------------------`);
        console.log(`🏢 [${site.name}] 처리 중...`);
        console.log(`🔗 URL: ${site.url}`);

        try {
            const courses = await scraper.scrape(site.url, site.name, site.region);

            if (courses.length > 0) {
                // 1. 데이터 매핑
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

                // 2. 중복 제거 (수집된 데이터 내에서 동일 강좌 제거)
                const uniqueDbData = Array.from(
                    new Map(dbData.map(item => [item.institution + item.title, item])).values()
                );

                // 3. [핵심 수정] 데이터 저장 (Upsert 방식)
                // - 기존 데이터를 삭제하지 않고 덮어씌웁니다.
                // - 조건: 'institution'(기관명)과 'title'(강좌명)이 같으면 업데이트합니다.
                // - 장점: 기존 강좌의 ID가 변하지 않아 공유된 링크가 유지됩니다.
                const { error } = await supabase
                    .from('courses')
                    .upsert(uniqueDbData, { onConflict: 'institution, title' });

                if (error) console.error("🔥 저장 실패:", error.message);
                else console.log(`✨ ${uniqueDbData.length}건 저장/업데이트 완료!`);
            } else {
                console.log("⚠️ 데이터를 찾지 못했습니다 (빈 목록).");
            }
        } catch (err) {
            console.error(`❌ [${site.name}] 에러 발생:`, err);
        }

        // AI API 호출 제한 방지 (3초 대기)
        console.log("⏳ 다음 도서관으로 이동 전 3초 대기...");
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log("\n🎉 모든 크롤링 작업이 완료되었습니다!");
}

main();