import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { UniversalAiScraper } from './ai-scraper.ts';
import { fetchAndSaveSeoulData } from './seoul-api.ts';
import { sanitizeErrorForLogging } from './sanitizer.ts';



// 1. [수정] ES Module 환경에서 __dirname을 파일 기준으로 정확하게 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. .env 파일 로드 (파일 위치 기준 상위 폴더 찾기)
const envPath = path.resolve(__dirname, '../.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.log(`⚠️ 설정된 경로(${envPath})에서 .env.local을 찾을 수 없습니다.`);
    // 만약 실패하면 현재 폴더의 .env라도 시도
    dotenv.config();
}

console.log("📂 로드된 환경 변수 목록:");
if (result.parsed) {
    console.log(Object.keys(result.parsed));
} else {
    console.log("파일을 읽을 수 없습니다:", result.error);
}

// 3. 변수 할당
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// [수정] ANON_KEY 대신 SERVICE_ROLE_KEY 사용
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase 환경변수(SERVICE_ROLE_KEY)가 설정되지 않았습니다.");
}
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

// 4. 디버깅 로그
console.log("-----------------------------------");
console.log("Checking Env Variables...");
console.log("URL:", supabaseUrl ? "✅ Loaded" : "❌ Missing");
console.log("KEY:", supabaseKey ? "✅ Loaded" : "❌ Missing");
console.log("GEMINI:", GEMINI_KEY ? "✅ Loaded" : "❌ Missing");
console.log("-----------------------------------");

// 5. 필수 키 검사
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase 환경변수(SERVICE_ROLE_KEY)가 설정되지 않았습니다.");
}
if (!GEMINI_KEY) {
    console.error("🚨 Error: GEMINI_API_KEY가 없습니다. .env.local 파일 (혹은 .env)에 추가해주세요.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    { name: "광주시작은도서관", region: "광주시", url: "https://lib.gjcity.go.kr/slib/lay1/program/S39T2941C434/cultureprogram/cultureWrt_list.do" },
    { name: "의정부시정보도서관", region: "의정부시", url: "https://www.uilib.go.kr/information/module/teach/index.do?menu_idx=24" },
    { name: "의정부시과학도서관", region: "의정부시", url: "https://www.uilib.go.kr/science/module/teach/index.do?menu_idx=24" },
    { name: "의정부시미술도서관", region: "의정부시", url: "https://www.uilib.go.kr/art/module/teach/index.do?menu_idx=24" },
    { name: "의정부시음악도서관", region: "의정부시", url: "https://www.uilib.go.kr/music/module/teach/index.do?menu_idx=24" },
    { name: "의정부시영어도서관", region: "의정부시", url: "https://www.uilib.go.kr/english/module/teach/index.do?menu_idx=24" },
    { name: "의정부시가재울도서관", region: "의정부시", url: "https://www.uilib.go.kr/gajaeul/module/teach/index.do?menu_idx=24" },
    { name: "의정부시작은도서관", region: "의정부시", url: "https://www.uilib.go.kr/small/module/teach/index.do?menu_idx=57" },
    { name: "광명시하안도서관", region: "광명시", url: "https://gmlib.gm.go.kr/front/index.php?g_page=event&m_page=event14&siteC%E3%85%81ode=ST01" },
    { name: "광명시광명도서관", region: "광명시", url: "https://gmlib.gm.go.kr/front/index.php?g_page=event&m_page=event14&siteCode=ST02" },
    { name: "광명시철산도서관", region: "광명시", url: "https://gmlib.gm.go.kr/front/index.php?g_page=event&m_page=event14&siteCode=ST03" },
    { name: "광명시소하도서관", region: "광명시", url: "https://gmlib.gm.go.kr/front/index.php?g_page=event&m_page=event14&siteCode=ST04" },
    { name: "광명시충현도서관", region: "광명시", url: "https://gmlib.gm.go.kr/front/index.php?g_page=event&m_page=event14&siteCode=ST05" },
    { name: "광명시연서도서관", region: "광명시", url: "https://gmlib.gm.go.kr/front/index.php?g_page=event&m_page=event14&siteCode=ST06" },
    { name: "광명시작은도서관", region: "광명시", url: "https://gmlib.gm.go.kr/front/index.php?g_page=event&m_page=event14&siteCode=ST50" },
    { name: "용인시중앙도서관", region: "용인시", url: "https://lib.yongin.go.kr/yongin/menu/10264/program/30027/lectureList.do" },
    { name: "용인시누갈희망누리도서관", region: "용인시", url: "https://lib.yongin.go.kr/gugal/menu/10451/program/30027/lectureList.do" },
    { name: "용인시구성도서관", region: "용인시", url: "https://lib.yongin.go.kr/guseong/menu/10647/program/30027/lectureList.do" },
    { name: "용인시기흥도서관", region: "용인시", url: "https://lib.yongin.go.kr/giheung/menu/10844/program/30027/lectureList.do" },
    { name: "용인시남사도서관", region: "용인시", url: "https://lib.yongin.go.kr/namsa/menu/11036/program/30027/lectureList.do" },
    { name: "용인시동백도서관", region: "용인시", url: "https://lib.yongin.go.kr/dongbaek/menu/11232/program/30027/lectureList.do" },
    { name: "용인시동천도서관", region: "용인시", url: "https://lib.yongin.go.kr/dongcheon/menu/37151445/program/30027/lectureList.do" },
    { name: "용인시모현도서관", region: "용인시", url: "https://lib.yongin.go.kr/mohyeon/menu/11425/program/30027/lectureList.do" },
    { name: "용인시보라도서관", region: "용인시", url: "https://lib.yongin.go.kr/bora/menu/11620/program/30027/lectureList.do" },
    { name: "용인시상현도서관", region: "용인시", url: "https://lib.yongin.go.kr/sanghyeon/menu/11818/program/30027/lectureList.do" },
    { name: "용인시서농도서관", region: "용인시", url: "https://lib.yongin.go.kr/seonong/menu/12013/program/30027/lectureList.do" },
    { name: "용인시성복도서관", region: "용인시", url: "https://lib.yongin.go.kr/seongbok/menu/12205/program/30027/lectureList.do" },
    { name: "용인시수지도서관", region: "용인시", url: "https://lib.yongin.go.kr/suji/menu/12408/program/30027/lectureList.do" },
    { name: "용인시양지해밀도서관", region: "용인시", url: "https://lib.yongin.go.kr/haemil/menu/12615/program/30027/lectureList.do" },
    { name: "용인시영덕도서관", region: "용인시", url: "https://lib.yongin.go.kr/yeongdeok/menu/12806/program/30027/lectureList.do" },
    { name: "용인시이동꿈틀도서관", region: "용인시", url: "https://lib.yongin.go.kr/idong/menu/12998/program/30027/lectureList.do" },
    { name: "용인시죽전도서관", region: "용인시", url: "https://lib.yongin.go.kr/idong/menu/12998/program/30027/lectureList.do" },
    { name: "용인시청덕도서관", region: "용인시", url: "https://lib.yongin.go.kr/cheongdeok/menu/13386/program/30027/lectureList.do" },
    { name: "용인시포곡도서관", region: "용인시", url: "https://lib.yongin.go.kr/pogok/menu/13580/program/30027/lectureList.do" },
    { name: "용인시흥덕도서관", region: "용인시", url: "https://lib.yongin.go.kr/heungdeok/menu/13777/program/30027/lectureList.do" },
    { name: "용인시중앙도서관", region: "용인시", url: "https://lib.yongin.go.kr/yongin/menu/10266/program/30069/vacationCourseList.do" },
    { name: "용인시누갈희망누리도서관", region: "용인시", url: "https://lib.yongin.go.kr/gugal/menu/10453/program/30069/vacationCourseList.do" },
    { name: "용인시구성도서관", region: "용인시", url: "https://lib.yongin.go.kr/guseong/menu/10649/program/30069/vacationCourseList.do" },
    { name: "용인시기흥도서관", region: "용인시", url: "https://lib.yongin.go.kr/giheung/menu/10846/program/30069/vacationCourseList.do" },
    { name: "용인시남사도서관", region: "용인시", url: "https://lib.yongin.go.kr/namsa/menu/11038/program/30069/vacationCourseList.do" },
    { name: "용인시동백도서관", region: "용인시", url: "https://lib.yongin.go.kr/dongbaek/menu/11234/program/30069/vacationCourseList.do" },
    { name: "용인시동천도서관", region: "용인시", url: "https://lib.yongin.go.kr/dongcheon/menu/37151447/program/30069/vacationCourseList.do" },
    { name: "용인시모현도서관", region: "용인시", url: "https://lib.yongin.go.kr/mohyeon/menu/11427/program/30069/vacationCourseList.do" },
    { name: "용인시보라도서관", region: "용인시", url: "https://lib.yongin.go.kr/bora/menu/11622/program/30069/vacationCourseList.do" },
    { name: "용인시상현도서관", region: "용인시", url: "https://lib.yongin.go.kr/sanghyeon/menu/11820/program/30069/vacationCourseList.do" },
    { name: "용인시서농도서관", region: "용인시", url: "https://lib.yongin.go.kr/seonong/menu/12015/program/30069/vacationCourseList.do" },
    { name: "용인시성복도서관", region: "용인시", url: "https://lib.yongin.go.kr/seongbok/menu/12207/program/30069/vacationCourseList.do" },
    { name: "용인시수지도서관", region: "용인시", url: "https://lib.yongin.go.kr/suji/menu/12410/program/30069/vacationCourseList.do" },
    { name: "용인시양지해밀도서관", region: "용인시", url: "https://lib.yongin.go.kr/haemil/menu/12617/program/30069/vacationCourseList.do" },
    { name: "용인시영덕도서관", region: "용인시", url: "https://lib.yongin.go.kr/yeongdeok/menu/12808/program/30069/vacationCourseList.do" },
    { name: "용인시이동꿈틀도서관", region: "용인시", url: "https://lib.yongin.go.kr/idong/menu/13000/program/30069/vacationCourseList.do" },
    { name: "용인시죽전도서관", region: "용인시", url: "https://lib.yongin.go.kr/jukjeon/menu/13195/program/30069/vacationCourseList.do" },
    { name: "용인시청덕도서관", region: "용인시", url: "https://lib.yongin.go.kr/cheongdeok/menu/13388/program/30069/vacationCourseList.do" },
    { name: "용인시포곡도서관", region: "용인시", url: "https://lib.yongin.go.kr/pogok/menu/13582/program/30069/vacationCourseList.do" },
    { name: "용인시흥덕도서관", region: "용인시", url: "https://lib.yongin.go.kr/heungdeok/menu/13779/program/30069/vacationCourseList.do" },
    { name: "서울특별시강동구중앙도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=9&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시강동구숲속도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=8&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시강동구성내도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=2&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시강동구해공도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=3&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시강동구강일도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=4&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시강동구암사도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=5&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시강동구천호도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=6&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시강동구둔촌도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=7&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시강동구작은도서관", region: "서울특별시", url: "https://www.gdlibrary.or.kr/portal/menu/46/tmpr/lctr-evnt/reading?searchHmpg=10&libCd=&searchStatus=&searchKeyword=eventTitle&searchInput=" },
    { name: "서울특별시송파구글마루도서관", region: "서울특별시", url: "https://www.splib.or.kr/spjlib/menu/10164/program/30014/eventList.do" },
    { name: "서울특별시송파구통합도서관", region: "서울특별시", url: "https://www.splib.or.kr/intro/menu/10052/program/30014/eventList.do" },
    { name: "서울특별시송파구위례도서관", region: "서울특별시", url: "https://www.splib.or.kr/spwlib/menu/10406/program/30014/eventList.do" },
    { name: "서울특별시송파구거마도서관", region: "서울특별시", url: "https://www.splib.or.kr/spglib/menu/10515/program/30014/eventList.do" },
    { name: "서울특별시송파구어린이도서관", region: "서울특별시", url: "https://www.splib.or.kr/spclib/menu/10289/program/30014/eventList.do" },
    { name: "서울특별시송파구어린이영어도서관", region: "서울특별시", url: "https://www.splib.or.kr/spelib/menu/10627/program/30014/eventList.do" },
    { name: "서울특별시송파구돌마리도서관", region: "서울특별시", url: "https://www.splib.or.kr/spdlib/menu/10735/program/30014/eventList.do" },
    { name: "서울특별시송파구소나무언덕1호작은도서관", region: "서울특별시", url: "https://www.splib.or.kr/sp1lib/menu/10841/program/30014/eventList.do" },
    { name: "서울특별시송파구소나무언덕2호도서관", region: "서울특별시", url: "https://www.splib.or.kr/sp2lib/menu/10949/program/30014/eventList.do" },
    { name: "서울특별시송파구소나무언덕3호도서관", region: "서울특별시", url: "https://www.splib.or.kr/sp3lib/menu/11059/program/30014/eventList.do" },
    { name: "서울특별시송파구소나무언덕4호도서관", region: "서울특별시", url: "https://www.splib.or.kr/sp4lib/menu/11169/program/30014/eventList.do" },
    { name: "서울특별시송파구소나무언덕잠실본동도서관", region: "서울특별시", url: "https://www.splib.or.kr/spmlib/menu/11276/program/30014/eventList.do" },
    { name: "서울특별시강남구도곡정보문화도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MA&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구개포하늘꿈도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MM&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구논현도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MB&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구논현문화마루도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MN&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구논현문화마루도서관별관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=SA&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구대치1동작은도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=SB&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구대치도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MC&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구못골도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MD&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구못골한옥어린이도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=ME&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구삼성도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=SC&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구세곡도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=SD&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구세곡마루도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=SF&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구역삼2동작은도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=SE&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구역삼도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MF&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구역삼푸른솔도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MG&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구열린도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MH&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구일원라온영어도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=SH&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구정다운도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MI&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구즐거운도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MJ&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구청담도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=MI&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강남구행복한도서관", region: "서울특별시", url: "https://library.gangnam.go.kr/dogoklib/menu/10116/program/30013/lectureList.do?searchCategory=&manageCd=ML&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서초구반포도서관", region: "서초구", url: "https://www.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시서초구반포도서관", region: "서초구", url: "https://www.seocholib.or.kr/Cultural/CulturalChargedList" },
    { name: "서울특별시서초구내곡도서관", region: "서초구", url: "https://naegok.seocholib.or.kr/Cultural/CulturalChargedList" },
    { name: "서울특별시서초구내곡도서관", region: "서초구", url: "https://naegok.seocholib.or.kr/ProgramCulture" },
    { name: "서울특별시서초구양재도서관", region: "서초구", url: "https://yangjae.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시서초구양재도서관", region: "서초구", url: "https://yangjae.seocholib.or.kr/Cultural/CulturalChargedList" },
    { name: "서울특별시서초구청소년도서관", region: "서초구", url: "https://seocho.seocholib.or.kr/ProgramCulture" },
    { name: "서울특별시서초구청소년도서관", region: "서초구", url: "https://seocho.seocholib.or.kr/Maker/MakerList" },
    { name: "서울특별시서초구청소년도서관", region: "서초구", url: "https://seocho.seocholib.or.kr/Maker/MakerChargedList" },
    { name: "서울특별시서초구방배숲환경도서관", region: "서초구", url: "https://forest.seocholib.or.kr/ProgramCulture" },
    { name: "서울특별시서초구잠원도서관", region: "서초구", url: "https://jamwon.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시서초구방배도서관", region: "서초구", url: "https://bangbae.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시서초구그림책도서관", region: "서초구", url: "https://picturebook.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시관악구중앙도서관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=MA&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구글빛정보도서관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=KJ&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구성현도서관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=KP&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구은천도서관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=KE&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구조원도서관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=KW&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구하난곡도서관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=G4&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구낙성대도서관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=G3&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구용꿈도서관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=L5&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구동주민센터", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=DSM&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시관악구자치회관", region: "서울특별시", url: "https://lib.gwanak.go.kr/galib/menu/10028/program/30006/lectureList.do?manageCd=JSM&searchOnlineYn=&searchStatusCd=&targetCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시강서구등빛도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=AG" },
    { name: "서울특별시강서구가양도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=BG" },
    { name: "서울특별시강서구강서영어도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=AA" },
    { name: "서울특별시강서구곰달래도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=AB" },
    { name: "서울특별시강서구꿈꾸는어린이도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=AD" },
    { name: "서울특별시강서구길꽃어린이도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=AC" },
    { name: "서울특별시강서구우장산숲속도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=AF" },
    { name: "서울특별시강서구푸른들청소년도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=AE" },
    { name: "서울특별시강서구작은도서관", region: "서울특별시", url: "https://lib.gangseo.seoul.kr/LibProgramApply?libCode=ZA" },
    { name: "서울특별시구로구꿈나무도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=1&libraryProgramTypeId=1" },
    { name: "서울특별시구로구꿈마을도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=31&libraryProgramTypeId=1" },
    { name: "서울특별시구로구온누리도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=28&libraryProgramTypeId=1" },
    { name: "서울특별시구로구하늘도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=34&libraryProgramTypeId=1" },
    { name: "서울특별시구로구개봉도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=35&libraryProgramTypeId=1" },
    { name: "서울특별시구로구글마루한옥어린이도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=36&libraryProgramTypeId=1" },
    { name: "서울특별시구로구신도림어린이영어도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=37&libraryProgramTypeId=1" },
    { name: "서울특별시구로구궁동어린이도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=39&libraryProgramTypeId=1" },
    { name: "서울특별시구로구기적의도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=42&libraryProgramTypeId=1" },
    { name: "서울특별시구로구청행정자료실", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=23&libraryProgramTypeId=1" },
    { name: "서울특별시구로구숲속작은도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=48&libraryProgramTypeId=1" },
    { name: "서울특별시구로구항동푸른도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=57&libraryProgramTypeId=1" },
    { name: "서울특별시구로구고척열린도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=59&libraryProgramTypeId=1" },
    { name: "서울특별시구로구미래도서관", region: "서울특별시", url: "https://lib.guro.go.kr/#/libprg/culture-lecture?offset=0&max=20&branchId=63&libraryProgramTypeId=1" },
    { name: "서울특별시노원구중앙도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=MA&page=1" },
    { name: "서울특별시노원구어린이도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=MB&page=1" },
    { name: "서울특별시노원구월계도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=MC&page=1" },
    { name: "서울특별시노원구상계도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=MD&page=1" },
    { name: "서울특별시노원구불암도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=ME&page=1" },
    { name: "서울특별시노원구화랑도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=MF&page=1" },
    { name: "서울특별시노원구휴먼도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=MG&page=1" },
    { name: "서울특별시노원구하계어린이도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=MH&page=1" },
    { name: "서울특별시노원구월계어린이도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=MI&page=1" },
    { name: "서울특별시노원구작은통합도서관", region: "서울특별시", url: "https://www.nowonlib.kr/CulturalProgram?code=ZA&page=1" },
    { name: "서울특별시도봉구문화정보도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=2" },
    { name: "서울특별시도봉구아이나라도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=3" },
    { name: "서울특별시도봉구학마을도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=4" },
    { name: "서울특별시도봉구기적의도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=5" },
    { name: "서울특별시도봉구쌍문채움도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=76" },
    { name: "서울특별시도봉구원당마을한옥도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=84" },
    { name: "서울특별시도봉구둘리도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=7" },
    { name: "서울특별시도봉구김근태기념도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=83" },
    { name: "서울특별시도봉구공립작은도서관", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=8" },
    { name: "서울특별시도봉구통합사업", region: "서울특별시", url: "https://www.unilib.dobong.kr/edusat/list.do?sh_ct_idx=77" },
    { name: "서울특별시동대문구정보화도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=1770&manageCd=MA&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구정보화도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2350&manageCd=MA&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구정보화도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2010&manageCd=MA&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구정보화도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=1791&manageCd=MA&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구정보화도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2110&manageCd=MA&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구정보화도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2070&manageCd=MA&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구답십리도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=1090&manageCd=MF&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구답십리도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=65&manageCd=MF&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구답십리도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2150&manageCd=MF&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구답십리도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2231&manageCd=MF&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구배봉산숲속도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=1430&manageCd=SP&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구배봉산숲속도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2210&manageCd=SP&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구배봉산숲속도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2232&manageCd=SP&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구책마당도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2232&manageCd=SN&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구휘경행복도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=1350&manageCd=MM&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구휘경행복도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2170&manageCd=MM&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구장안어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=15&manageCd=MB&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구장안어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2330&manageCd=MB&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구장안어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2271&manageCd=MB&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구장안어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=5&manageCd=MB&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구제기동감초마을현진건기념도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2130&manageCd=MN&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구제기동감초마을현진건기념도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=1850&manageCd=MN&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구제기동감초마을현진건기념도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=1950&manageCd=MN&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구제기동감초마을현진건기념도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=1951&manageCd=MN&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구용두어린이영어도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=12&manageCd=MC&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구용두어린이영어도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=44&manageCd=MC&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구용두어린이영어도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=43&manageCd=MC&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구휘경어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2370&manageCd=MJ&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구휘경어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=38&manageCd=MJ&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구휘경어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=2190&manageCd=MJ&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구이문어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=73&manageCd=ME&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구이문어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=72&manageCd=ME&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동대문구이문체육문화센터어린이도서관", region: "서울특별시", url: "https://www.l4d.or.kr/intro/menu/10108/program/30048/lecturePbList.do?searchCategoryCd=26&manageCd=MD&statusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시동작구김영삼도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0010&category_idx=0" },
    { name: "서울특별시동작구까망돌도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0011&category_idx=0" },
    { name: "서울특별시동작구사당솔밭도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0001&category_idx=0" },
    { name: "서울특별시동작구신대방누리도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0012&category_idx=0" },
    { name: "서울특별시동작구영어마루도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0003&category_idx=0" },
    { name: "서울특별시동작구약수도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0006&category_idx=0" },
    { name: "서울특별시동작구대방어린이도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0004&category_idx=0" },
    { name: "서울특별시동작구샘터도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0005&category_idx=0" },
    { name: "서울특별시동작구다울작은도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0008&category_idx=0" },
    { name: "서울특별시동작구국사봉숲속도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0009&category_idx=0" },
    { name: "서울특별시동작구신대방햇살도서관", region: "서울특별시", url: "https://lib.dongjak.go.kr/dj/module/teach/index.do?group_idx=0&teach_idx=0&menu_idx=32&category_idx=0&searchCate1=16&large_category_idx=0&org_code=0013&category_idx=0" },
    { name: "서울특별시마포구중앙도서관", region: "서울특별시", url: "https://mplib.mapo.go.kr/mcl/MENU1069/PGM3021/lectureList.do" },
    { name: "서울특별시마포구소금나루도서관", region: "서울특별시", url: "https://mplib.mapo.go.kr/naru/MENU2160/PGM3021/lectureList.do" },
    { name: "서울특별시마포구서강도서관", region: "서울특별시", url: "https://mplib.mapo.go.kr/sglib/MENU1200/PGM3021/lectureList.do" },
    { name: "서울특별시마포구푸르메어린이도서관", region: "서울특별시", url: "https://mplib.mapo.go.kr/purme/MENU1847/PGM3021/lectureList.do" },
    { name: "서울특별시마포구어린이영어도서관", region: "서울특별시", url: "https://mplib.mapo.go.kr/englib/MENU1623/PGM3021/lectureList.do?libraryCode=MK" },
    { name: "서울특별시마포구꿈나래어린이영어도서관", region: "서울특별시", url: "https://mplib.mapo.go.kr/englib/MENU1624/PGM3021/lectureList.do?libraryCode=ML" },
    { name: "서울특별시마포구작은도서관", region: "서울특별시", url: "https://mplib.mapo.go.kr/libsmall/MENU1365/PGM3021/lectureList.do" },
    { name: "서울특별시서대문구이진아도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=MA&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구새롬도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=MB&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구도담도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=MC&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구작은도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=QQ&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구알음알음도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SA&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구하늘샘도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SB&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구북아현도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SC&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구아이누리도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SE&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구새싹서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SF&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구꿈이있는도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SG&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구문화촌도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SH&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구햇살도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SI&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구행복도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SJ&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구파랑새도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SK&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구늘푸른도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SM&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구논골도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=SP&searchCondition=title&searchKeyword=" },
    { name: "서울특별시서대문구해담는도서관", region: "서울특별시", url: "https://lib.sdm.or.kr/sdmlib/menu/10091/program/30025/eventList.do?searchOnlineStatusCd=&manageCd=MG&searchCondition=title&searchKeyword=" },
    { name: "서울특별시성북구정보도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/sblib/eventList.do" },
    { name: "서울특별시성북구아리랑도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/arlib/menu/10268/program/30267/eventList.do" },
    { name: "서울특별시성북구해오름도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/horlib/menu/10368/program/30268/eventList.do" },
    { name: "서울특별시성북구길빛도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/gblib/menu/11572/program/30459/eventList.do" },
    { name: "서울특별시성북구서경로꿈마루도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/kmlib/menu/10540/program/30270/eventList.do" },
    { name: "서울특별시성북구석관동미리내도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/mrlib/menu/10626/program/30271/eventList.do" },
    { name: "서울특별시성북구정릉도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/jnlib/menu/10799/program/30273/eventList.do" },
    { name: "서울특별시성북구종암동새날도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/snlib/menu/10454/program/30269/eventList.do" },
    { name: "서울특별시성북구월곡꿈그림도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/wglib/menu/10977/program/30329/eventList.do" },
    { name: "서울특별시성북구청수도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/cslib/menu/10888/program/30274/eventList.do" },
    { name: "서울특별시성북구아리랑어린이도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/arclib/menu/11088/program/30362/eventList.do" },
    { name: "서울특별시성북구글빛도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/gbitlib/menu/12772/program/30529/eventList.do" },
    { name: "서울특별시성북구오동숲속도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/odlib/menu/12965/program/30605/eventList.do" },
    { name: "서울특별시성북구장위행복누림도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/jwlib/menu/11289/program/30443/eventList.do" },
    { name: "서울특별시성북구달빛마루도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/dblib/menu/10713/program/30272/eventList.do" },
    { name: "서울특별시성북구보문숲길도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/bmlib/menu/14163/program/31679/eventList.do" },
    { name: "서울특별시성북구어린이청소년도서관", region: "서울특별시", url: "https://www.sblib.seoul.kr/scylib/menu/14428/program/31799/lectureList.do" },
    { name: "서울특별시양천구중앙도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/yclib/edusat/list.do" },
    { name: "서울특별시양천구갈산도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/libgalsan/edusat/list.do" },
    { name: "서울특별시양천구개울건강도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/libgaeul/edusat/list.do" },
    { name: "서울특별시양천구목마교육도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/libmokma/edusat/list.do" },
    { name: "서울특별시양천구미감도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/libmigam/edusat/list.do" },
    { name: "서울특별시양천구방아다리문학도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/libbanga/edusat/list.do" },
    { name: "서울특별시양천구신월음악도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/libsin/edusat/list.do" },
    { name: "서울특별시양천구영어특성화도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/libeng/edusat/list.do" },
    { name: "서울특별시양천구해맞이역사도서관", region: "서울특별시", url: "https://lib.yangcheon.or.kr/libsun/edusat/list.do" },
    { name: "서울특별시영등포구신길도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/sclib/menu/12304/program/30012/lectureList.do" },
    { name: "서울특별시영등포구대림도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/drlib/menu/10093/program/30012/lectureList.do" },
    { name: "서울특별시영등포구문래도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/mllib/menu/10181/program/30012/lectureList.do" },
    { name: "서울특별시영등포구선유도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/sylib/menu/10273/program/30012/lectureList.do" },
    { name: "서울특별시영등포구여의샛강도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/yulib/menu/10362/program/30012/lectureList.do" },
    { name: "서울특별시영등포구생각공장도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/sglib/menu/11719/program/30012/lectureList.do" },
    { name: "서울특별시영등포구원지공원도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/wjlib/menu/12218/program/30012/lectureList.do" },
    { name: "서울특별시영등포구밤동산작은도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/bdslib/menu/11819/program/30012/lectureList.do" },
    { name: "서울특별시영등포구조롱박작은도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/jlblib/menu/11919/program/30012/lectureList.do" },
    { name: "서울특별시영등포구공립작은도서관", region: "서울특별시", url: "https://www.ydplib.or.kr/small/menu/10445/program/30038/lectureList.do" },
    { name: "서울특별시용산구립도서관", region: "서울특별시", url: "https://www.yslibrary.or.kr/intro/unityLectureList.do" },
    { name: "서울특별시용산구꿈나무도서관", region: "서울특별시", url: "https://www.yslibrary.or.kr/dream/menu/10119/program/30046/lectureList.do" },
    { name: "서울특별시용산구청파도서관", region: "서울특별시", url: "https://www.yslibrary.or.kr/cheongpa/menu/10051/program/30022/lectureList.do" },
    { name: "서울특별시용산구용마루어린이도서관", region: "서울특별시", url: "https://www.yslibrary.or.kr/yongmaru/menu/10548/program/30118/lectureList.do" },
    { name: "서울특별시용산구작은도서관", region: "서울특별시", url: "https://www.yslibrary.or.kr/small/menu/10186/program/30080/lectureList.do" },
    { name: "서울특별시종로구도서관", region: "서울특별시", url: "https://jnlib.sen.go.kr/jnlib/module/teach/index.do?menu_idx=15&searchCate1=16" },
    { name: "서울특별시종로구도서관", region: "서울특별시", url: "https://www.jfac.or.kr/site/main/program/educ_always_list" },
    { name: "서울특별시종로구도서관", region: "서울특별시", url: "https://www.jfac.or.kr/site/main/program/educ_season_list" },
    { name: "서울특별시중랑구립도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/intro/menu/10053/program/30018/eventLectureList.do" },
    { name: "서울특별시중랑구정보도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/jnlib/menu/10188/program/30018/eventLectureList.do" },
    { name: "서울특별시중랑구정보도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/jnlib/menu/10191/program/30047/cultureLectureList.do" },
    { name: "서울특별시중랑구면목정보도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/mmlib/menu/10307/program/30018/eventLectureList.do" },
    { name: "서울특별시중랑구숲어린이도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/suplib/menu/10422/program/30018/eventLectureList.do" },
    { name: "서울특별시중랑구숲어린이도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/suplib/menu/11074/program/30047/cultureLectureList.do" },
    { name: "서울특별시중랑구중화어린이도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/jhklib/menu/10539/program/30018/eventLectureList.do" },
    { name: "서울특별시중랑구중화어린이도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/jhklib/menu/11078/program/30047/cultureLectureList.do" },
    { name: "서울특별시중랑구양원숲속도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/ywlib/menu/10646/program/30018/eventLectureList.do" },
    { name: "서울특별시중랑구양원숲속도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/ywlib/menu/11082/program/30047/cultureLectureList.do" },
    { name: "서울특별시중랑구상봉도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/sblib/menu/10766/program/30018/eventLectureList.do" },
    { name: "서울특별시중랑구상봉도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/sblib/menu/11086/program/30047/cultureLectureList.do" },
    { name: "서울특별시중랑구중화문학도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/jhmlib/menu/11004/program/30018/eventLectureList.do" },
    { name: "서울특별시중랑구작은도서관", region: "서울특별시", url: "https://www.jungnanglib.seoul.kr/small/menu/10843/program/30069/smallLectureList.do" },
    { name: "서울특별시광진구도서관", region: "서울특별시", url: "https://www.gwangjinlib.seoul.kr/gjinfo/menu/10083/program/30018/eventList.do?currentPageNo=1&eventIdx=0" },
    { name: "서울특별시강북구문화정보도서관", region: "서울특별시", url: "https://www.gblib.or.kr/gangbuk/lecture/list.do" },
    { name: "서울특별시강북구문화정보도서관", region: "서울특별시", url: "https://www.gblib.or.kr/gangbuk/event/list.do" },
    { name: "서울특별시강북구청소년문화정보도서관", region: "서울특별시", url: "https://www.gblib.or.kr/youth/event/list.do" },
    { name: "서울특별시강북구솔샘문화정보도서관", region: "서울특별시", url: "https://www.gblib.or.kr/solsem/event/list.do" },
    { name: "서울특별시강북구수유문화정보도서관", region: "서울특별시", url: "https://www.gblib.or.kr/suyu/event/list.do" },
    { name: "서울특별시강북구미아문화정보도서관", region: "서울특별시", url: "https://www.gblib.or.kr/mia/event/list.do" },
    { name: "서울특별시강북구삼각산어린이도서관", region: "서울특별시", url: "https://www.gblib.or.kr/kids/event/list.do" },
    { name: "서울특별시금천구립도서관", region: "서울특별시", url: "https://geumcheonlib.seoul.kr/geumcheonlib/uce/programList.do?&selfId=1090" },
    { name: "서울특별시성동구립도서관", region: "서울특별시", url: "https://www.sdlib.or.kr/SD/edusat/list.do" },
    { name: "서울특별시성동구금호도서관", region: "서울특별시", url: "https://www.sdlib.or.kr/KH/edusat/list.do" },
    { name: "서울특별시성동구용답도서관", region: "서울특별시", url: "https://www.sdlib.or.kr/YD/edusat/list.do" },
    { name: "서울특별시성동구무지개도서관", region: "서울특별시", url: "https://www.sdlib.or.kr/RB/edusat/list.do" },
    { name: "서울특별시성동구성수도서관", region: "서울특별시", url: "https://www.sdlib.or.kr/SS/edusat/list.do" },
    { name: "서울특별시성동구청계도서관", region: "서울특별시", url: "https://www.sdlib.or.kr/CG/edusat/list.do" },
    { name: "서울특별시성동구매봉산숲속도서관", region: "서울특별시", url: "https://www.sdlib.or.kr/fore/edusat/list.do" },
    { name: "서울특별시은평구립도서관", region: "서울특별시", url: "https://www.eplib.or.kr/culture/event.asp?mode=list" },
    { name: "서울특별시은평구립도서관", region: "서울특별시", url: "https://www.eplib.or.kr/culture/event.asp?mode=bookdongsan" },
    { name: "서울특별시은평구증산정보도서관", region: "서울특별시", url: "https://www.jsplib.or.kr/culture/event.asp?mode=list" },
    { name: "서울특별시은평구응암정보도서관", region: "서울특별시", url: "https://www.ealib.or.kr/culture/event.asp" },
    { name: "서울특별시은평구뉴타운도서관", region: "서울특별시", url: "https://www.enlib.or.kr/culture/event.asp?mode=list" },
    { name: "서울특별시은평구구산동도서관마을", region: "서울특별시", url: "https://www.gsvlib.or.kr/culture/event.asp?mode=list" },
    { name: "서울특별시은평구내를건너서숲으로도서관", region: "서울특별시", url: "https://www.nslib.or.kr/culture/event.asp" },
    { name: "서울특별시은평구은뜨락도서관", region: "서울특별시", url: "https://www.edlib.or.kr/culture/event.asp?mode=list" },
    { name: "서울특별시중구가온도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=MF&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시중구어울림도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=MH&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시중구남산타운어린이도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=MD&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시중구손기정어린이도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=ME&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시중구신당누리도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=MC&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시중구다산성곽도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=MA&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시중구장충동작은도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=CA&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시중구손기정문화도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=MB&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },
    { name: "서울특별시중구작은도서관", region: "서울특별시", url: "https://www.junggulib.or.kr/SJGL/menu/10070/program/30020/lectureList.do?manageCd=SS&lectureTypeCd=&targetCd=&searchStatusCd=&searchCondition=title&searchKeyword=" },


    {
        name: "성남시평생학습통합플랫폼",
        region: "성남시",
        url: "https://sugang.seongnam.go.kr/ilms/learning/learningList.do",
        isSeongnam: true
    }
];

// 1. 옵션 값 추출
async function main() {
    const args = process.argv.slice(2);
    const startArg = args.find(arg => arg.startsWith('--start='));
    const endArg = args.find(arg => arg.startsWith('--end='));
    const targetArg = args.find(arg => arg.startsWith('--target='));

    let sitesToScrape = TARGET_SITES;

    // 2. 인덱스 범위로 자르기 (--start, --end)
    if (startArg || endArg) {
        const start = startArg ? parseInt(startArg.split('=')[1]) : 0;
        const end = endArg ? parseInt(endArg.split('=')[1]) : TARGET_SITES.length;

        console.log(`✂️ 범위 지정 모드: 인덱스 ${start}번부터 ${end}번 앞까지 실행합니다.`);
        sitesToScrape = sitesToScrape.slice(start, end);
    }

    // 3. 이름으로 검색하기 (--target)
    if (targetArg) {
        const keyword = targetArg.split('=')[1];
        console.log(`🎯 타겟 지정 모드: "${keyword}"가 포함된 도서관만 실행합니다.`);
        sitesToScrape = sitesToScrape.filter(site => site.name.includes(keyword) || site.region.includes(keyword));
    }

    // 4. 대상 목록 확인 출력
    if (sitesToScrape.length === 0) {
        console.error("❌ 조건에 맞는 도서관이 없습니다. 스크래핑을 종료합니다.");
        return;
    }

    console.log(`\n📋 [스크래핑 대상 목록 (${sitesToScrape.length}개)]`);
    sitesToScrape.forEach((s, i) => console.log(`   ${i + 1}. [${s.region}] ${s.name}`));
    console.log(`------------------------------------------------\n`);

    console.log(`🚀 총 ${sitesToScrape.length}개 도서관 크롤링 시작...`);

    // ✅ 스크래핑보다 먼저 서울시 API 동기화
    console.log("\n------------------------------------------------");
    console.log("🚀 [1/3] 서울시 강좌 API 동기화 (스크래핑 전에 실행)");
    await fetchAndSaveSeoulData();
    console.log("------------------------------------------------\n");

    const scraper = new UniversalAiScraper();

    for (const site of sitesToScrape) {
        console.log(`\n------------------------------------------------`);
        console.log(`🏢 [${site.name}] 처리 중...`);
        console.log(`🔗 URL: ${site.url}`);

        try {
            let courses: any[] = [];
            // [수정] 성남시 전용 로직 분기
            if ((site as any).isSeongnam) {
                courses = await scraper.scrapeSeongnam(site.url, 100);
            } else {
                courses = await scraper.scrape(site.url, site.name, site.region);
            }

            if (courses.length > 0) {
                // 1. 데이터 매핑
                const dbData = courses.map(c => ({
                    // [수정] 제목의 앞뒤 공백 제거 및 연속된 공백을 하나로 통일
                    title: c.title.trim().replace(/\s+/g, ' '),

                    // [수정] 카테고리도 깔끔하게 정리
                    category: c.category.trim(),

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

                // 2. 중복 제거
                const uniqueDbData = Array.from(
                    new Map(dbData.map(item => [item.institution + item.title, item])).values()
                );

                // 3. 데이터 저장 (Upsert)
                const { error } = await supabase
                    .from('courses')
                    .upsert(uniqueDbData, {
                        onConflict: 'institution, title', // 이 부분이 DB의 제약조건과 일치해야 함
                        ignoreDuplicates: false // 중복이면 업데이트(덮어쓰기) 하라는 뜻
                    });
                console.log(error);

                if (error) console.error("🔥 저장 실패:", error.message);
                else console.log(`✨ ${uniqueDbData.length}건 저장/업데이트 완료!`);
            } else {
                console.log("⚠️ 데이터를 찾지 못했습니다 (빈 목록).");
            }
        } catch (err) {
            console.error(`❌ [${site.name}] 에러 발생:`, sanitizeErrorForLogging(err));
        }

        // AI API 호출 제한 방지 (2초 대기)
        console.log("⏳ 다음 도서관으로 이동 전 2초 대기...");
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Cleanup: 브라우저 인스턴스 정리
    await scraper.cleanup();

    console.log("\n🎉 모든 크롤링 및 API 동기화 작업이 완료되었습니다!");

    console.log("\n------------------------------------------------");
    console.log("\n------------------------------------------------");
    console.log("🔔 [3/3] 알림 발송 시작...");

    const { runAlertJob } = await import("./alert-job.ts");
    const { runBookmarkAlertJob } = await import("./bookmark-alert-job.ts");

    await runAlertJob();
    await runBookmarkAlertJob();
    console.log("------------------------------------------------\n");

    console.log("\n🎉 모든 크롤링, API 동기화, 알림 발송이 완료되었습니다!");

}

main();