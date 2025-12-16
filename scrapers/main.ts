import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // [주석 해제] url 모듈 사용
import { UniversalAiScraper } from './ai-scraper.ts';
import { fetchAndSaveSeoulData } from './seoul-api.ts'; // [추가] 서울시 API 함수 임포트



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
    { name: "서울특별시서초구반포도서관", region: "서울특별시", url: "https://www.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시서초구반포도서관", region: "서울특별시", url: "https://www.seocholib.or.kr/Cultural/CulturalChargedList" },
    { name: "서울특별시서초구내곡도서관", region: "서울특별시", url: "https://naegok.seocholib.or.kr/Cultural/CulturalChargedList" },
    { name: "서울특별시서초구내곡도서관", region: "서울특별시", url: "https://naegok.seocholib.or.kr/ProgramCulture" },
    { name: "서울특별시서초구양재도서관", region: "서울특별시", url: "https://yangjae.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시서초구양재도서관", region: "서울특별시", url: "https://yangjae.seocholib.or.kr/Cultural/CulturalChargedList" },
    { name: "서울특별시서초구청소년도서관", region: "서울특별시", url: "https://seocho.seocholib.or.kr/ProgramCulture" },
    { name: "서울특별시서초구청소년도서관", region: "서울특별시", url: "https://seocho.seocholib.or.kr/Maker/MakerList" },
    { name: "서울특별시서초구청소년도서관", region: "서울특별시", url: "https://seocho.seocholib.or.kr/Maker/MakerChargedList" },
    { name: "서울특별시서초구방배숲환경도서관", region: "서울특별시", url: "https://forest.seocholib.or.kr/ProgramCulture" },
    { name: "서울특별시서초구잠원도서관", region: "서울특별시", url: "https://jamwon.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시서초구방배도서관", region: "서울특별시", url: "https://bangbae.seocholib.or.kr/Cultural/CulturalList" },
    { name: "서울특별시서초구그림책도서관", region: "서울특별시", url: "https://picturebook.seocholib.or.kr/Cultural/CulturalList" },

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
            console.error(`❌ [${site.name}] 에러 발생:`, err);
        }

        // AI API 호출 제한 방지 (2초 대기)
        console.log("⏳ 다음 도서관으로 이동 전 2초 대기...");
        await new Promise(resolve => setTimeout(resolve, 2000));
    }



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