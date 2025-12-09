import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
// import { fileURLToPath } from 'url'; // Removed to avoid import.meta usage
import { UniversalAiScraper } from './ai-scraper';

// 1. ES Module 환경에서 __dirname 대용
const __dirname = process.cwd();

// 2. .env 파일 로드
// 루트의 .env.local을 명시적으로 로드
const envPath = path.resolve(__dirname, '../.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.log("⚠️ 상위 폴더의 .env.local 로드 실패, 현재 폴더에서 시도합니다.");
    dotenv.config(); // fallback to default
}

console.log("📂 로드된 환경 변수 목록:");
if (result.parsed) {
    console.log(Object.keys(result.parsed));
} else {
    console.log("파일을 읽을 수 없습니다:", result.error);
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
    process.exit(1);
}
if (!GEMINI_KEY) {
    console.error("🚨 Error: GEMINI_API_KEY가 없습니다. .env.local 파일 (혹은 .env)에 추가해주세요.");
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
    { name: "구리시갈매도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/menu/10052/program/30017/lectureList.do?manageCd=GM" },
    { name: "구리시수택1동작은도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/program/lectureList.do?manageCd=SA&searchManageCd=SA&searchLectureDiv=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "구리시교문2동작은도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/program/lectureList.do?manageCd=SC&searchManageCd=SC&searchLectureDiv=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "구리시인창동작은도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/program/lectureList.do?manageCd=SG&searchManageCd=SG&searchLectureDiv=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "구리시수택작은도서관", region: "구리시", url: "https://www.gurilib.go.kr/inlib/program/lectureList.do?manageCd=SI&searchManageCd=SI&searchLectureDiv=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "구리시꿈꾸는공작소", region: "구리시", url: "https://www.gurilib.go.kr/inlib/program/lectureList.do?manageCd=MK&searchManageCd=MK&searchLectureDiv=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "남양주시정약용도서관", region: "남양주시", url: "https://lib.nyj.go.kr/jyy/menu/10082/program/30026/lectureList.do" },
    { name: "남양주시와부도서관", region: "남양주시", url: "https://lib.nyj.go.kr/waboo/menu/10173/program/30026/lectureList.do" },
    { name: "남양주시진접도서관", region: "남양주시", url: "https://lib.nyj.go.kr/jinjeop/menu/10264/program/30026/lectureList.do" },
    { name: "남양주시진접푸른숲도서관", region: "남양주시", url: "https://lib.nyj.go.kr/jinjeopgw/menu/10355/program/30026/lectureList.do" },
    { name: "남양주시화도도서관", region: "남양주시", url: "https://lib.nyj.go.kr/hwado/menu/10446/program/30026/lectureList.do" },
    { name: "남양주시이석영뉴미디어도서관", region: "남양주시", url: "https://lib.nyj.go.kr/lsy/menu/11402/program/30026/lectureList.do" },
    { name: "남양주시진건도서관", region: "남양주시", url: "https://lib.nyj.go.kr/jingeon/menu/10628/program/30026/lectureList.do" },
    { name: "남양주시오남도서관", region: "남양주시", url: "https://lib.nyj.go.kr/onam/menu/10537/program/30026/lectureList.do" },
    { name: "남양주시퇴계원도서관", region: "남양주시", url: "https://lib.nyj.go.kr/toegyewon/menu/10810/program/30026/lectureList.do" },
    { name: "남양주시별내도서관", region: "남양주시", url: "https://lib.nyj.go.kr/bnae/menu/10719/program/30026/lectureList.do" },
    { name: "남양주시호평도서관", region: "남양주시", url: "https://lib.nyj.go.kr/hp/menu/10901/program/30026/lectureList.do" },
    { name: "남양주시평내도서관", region: "남양주시", url: "https://lib.nyj.go.kr/pynae/menu/10992/program/30026/lectureList.do" },
    { name: "남양주시별빛도서관", region: "남양주시", url: "https://lib.nyj.go.kr/bbit/menu/11083/program/30026/lectureList.do" },
    { name: "광주시립중앙도서관", region: "광주시", url: "https://lib.gjcity.go.kr/center/lay1/program/S8T48C62/cultureprogram/cultureWrt_list.do" },
    { name: "광주시오포도서관", region: "광주시", url: "https://lib.gjcity.go.kr/op/lay1/program/S26T186C189/cultureprogram/cultureWrt_list.do" },
    { name: "광주시초월도서관", region: "광주시", url: "https://lib.gjcity.go.kr/cw/lay1/program/S28T315C317/cultureprogram/cultureWrt_list.do" },
    { name: "광주시곤지암도서관", region: "광주시", url: "https://lib.gjcity.go.kr/gj/lay1/program/S27T249C251/cultureprogram/cultureWrt_list.do" },
    { name: "광주시능평도서관", region: "광주시", url: "https://lib.gjcity.go.kr/np/lay1/program/S29T377C379/cultureprogram/cultureWrt_list.do" },
    { name: "광주시양벌도서관", region: "광주시", url: "https://lib.gjcity.go.kr/yb/lay1/program/S25T2805C2807/cultureprogram/cultureWrt_list.do?sitekey=7" },
    { name: "광주시광남도서관", region: "광주시", url: "https://lib.gjcity.go.kr/gn/lay1/program/S22T3341C3343/cultureprogram/cultureWrt_list.do" },
    { name: "광주시퇴촌도서관", region: "광주시", url: "https://lib.gjcity.go.kr/tc/lay1/program/S23T3030C3032/cultureprogram/cultureWrt_list.do" },
    { name: "광주시만선도서관", region: "광주시", url: "https://lib.gjcity.go.kr/ms/lay1/program/S24T3091C3093/cultureprogram/cultureWrt_list.do" },
    { name: "광주시신현도서관", region: "광주시", url: "https://lib.gjcity.go.kr/sh/lay1/program/S21T3643C3645/cultureprogram/cultureWrt_list.do" },
    { name: "광주시작은도서관", region: "광주시", url: "https://lib.gjcity.go.kr/slib/lay1/program/S39T2941C434/cultureprogram/cultureWrt_list.do" }

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