import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Course } from './types.ts';

export class UniversalAiScraper {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing in .env file");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // 1. 일반 도서관 스크래핑 (의정부시 등)
    async scrape(url: string, institutionName: string, regionName: string): Promise<Course[]> {
        console.log(`🤖 [${institutionName}] 접속 중...`);
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // [핵심 1] 텍스트 추출 최적화 (본문만 타겟팅)
            const pageContent = await page.evaluate(() => {
                // 본문 영역 추정 (id나 class에 content, wrapper, main 등이 포함된 요소)
                const main = document.querySelector('#content, #main, .content, .main_content, #container') || document.body;

                // 불필요한 요소 제거
                const scripts = main.querySelectorAll('script, style, noscript, header, footer, nav, .menu, .gnb');
                scripts.forEach(el => el.remove());

                // 텍스트 정제 (공백 축소)
                return (main as HTMLElement).innerText.replace(/\s+/g, ' ').substring(0, 40000); // 4만자까지 허용
            });

            console.log("🧠 Gemini 분석 중...");

            // [핵심 2] 출력 토큰 대폭 상향 (잘림 방지)
            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: {
                    maxOutputTokens: 8192, // 답변 길이 제한 해제 (중요!)
                    responseMimeType: "application/json"
                }
            });

            const prompt = `
                You are a data extractor for Korean lifelong learning courses.
                Extract course information from the provided web page text below.
                
                **CRITICAL RULES FOR DATES (Timezone: Asia/Seoul, Current Year: 2025):**
                1. "apply_date": Look for keywords like "접수기간", "신청기간", "모집기간".
                2. "course_date": Look for keywords like "수강기간", "교육기간", "강좌기간", "운영기간".
                3. Format: ALWAYS use "YYYY.MM.DD ~ YYYY.MM.DD". 
                   - If year is missing in text (e.g. "3/5"), assume 2025 (e.g. "2025.03.05").
                   - If only start date exists, use "YYYY.MM.DD ~ ".
                
                **IMPORTANT RULE about STATUS:**
                1. Trust the text status on the screen MORE than the date calculation.
                2. Map the Korean status text to the following standard statuses:
                   - "신청가능", "접수중", "신청중" -> "접수중"
                   - "대기접수", "대기신청", "접수대기" -> "접수대기"
                   - "마감임박" -> "마감임박"
                   - "접수예정", "준비" -> "접수예정"
                   - "마감", "접수마감", "교육중", "진행중", "종료" -> "모집종료"
                   - "추가접수", "추가모집" -> "추가접수"
                
                Return ONLY a valid JSON object with a key "courses".
                
                JSON Structure:
                {
                    "title": "Course Name",
                    "category": "Category (Art, IT, Sports, etc.)",
                    "target": "Target Audience",
                    "status": "Standardized Status",
                    "apply_date": "YYYY.MM.DD ~ YYYY.MM.DD",
                    "course_date": "YYYY.MM.DD ~ YYYY.MM.DD",
                    "time": "Time string (e.g. '매주 월 10:00~12:00')",
                    "price": "Price string (or '무료')",
                    "capacity": Number (0 if unknown)
                }

                [Web Page Text]:
                ${pageContent}
            `;

            const result = await model.generateContent(prompt);
            const rawCourses = JSON.parse(result.response.text()).courses || [];

            console.log(`✅ ${rawCourses.length}개 발견`);

            return rawCourses.map((c: any) => ({
                title: c.title,
                category: c.category || '기타',
                target: c.target || '전체',
                status: c.status,
                image_url: '',
                d_day: '',
                institution: institutionName,
                price: c.price || '무료',
                region: regionName,
                place: c.place || institutionName,
                course_date: c.course_date,
                apply_date: c.apply_date,
                time: c.time,
                capacity: c.capacity || 0,
                contact: '',
                link: url
            }));

        } catch (error) {
            console.error(`❌ [${institutionName}] Error:`, error);
            return [];
        } finally {
            await browser.close();
        }
    }

    // [수정] 성남시 전용 스크래핑 메서드 (안전장치 강화판)
    async scrapeSeongnam(url: string, maxPages: number = 5): Promise<Course[]> {
        console.log(`🤖 성남시 통합 포털 스크래핑 시작 (최대 ${maxPages}페이지)`);

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        let allCourses: Course[] = [];

        try {
            // [변경] 네트워크가 유휴 상태가 될 때까지 충분히 대기 (networkidle)
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

            // 1. [설정] 50개씩 보기
            try {
                const pageUnitSelector = 'select[name="pageUnit"]';
                // 셀렉터가 화면에 나타날 때까지 최대 5초 대기
                await page.waitForSelector(pageUnitSelector, { timeout: 5000 });

                console.log("   ⚙️ 50개씩 보기 설정 중...");
                await page.selectOption(pageUnitSelector, '50');

                // [핵심 수정] "보기" 버튼 클릭하여 실제로 적용
                const viewButton = await page.$('a:has-text("보기")');
                if (viewButton) {
                    await viewButton.click();
                    console.log("   ✅ 보기 버튼 클릭 완료");
                    await page.waitForTimeout(3000); // 페이지 리로드 대기
                } else {
                    console.log("   ⚠️ 보기 버튼을 찾을 수 없습니다.");
                    await page.waitForTimeout(3000); // 버튼 못찾아도 일단 대기
                }
            } catch (e) {
                console.log("   ⚠️ 설정 변경 실패 (기본값으로 진행, 페이지 로드 이슈일 수 있음)");
            }

            // 2. 페이지 순회
            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                console.log(`   📄 페이지 ${pageNum} 분석 중...`);

                // 텍스트 추출 (에러 발생 지점 수정)
                const pageContent = await page.evaluate(() => {
                    // [핵심 수정] 본문 영역을 찾을 때까지 여러 후보군을 시도하고, 정 없으면 html 태그 사용
                    const main = document.querySelector('#container') ||
                        document.querySelector('#content') ||
                        document.querySelector('#wrap') ||
                        document.body ||
                        document.documentElement;

                    // [핵심 수정] main이 null이면 빈 문자열 반환하여 크래시 방지
                    if (!main) return "";

                    // 복사본 생성 (원본 DOM 훼손 방지)
                    const clone = main.cloneNode(true) as HTMLElement;

                    // 불필요한 요소 제거
                    const scripts = clone.querySelectorAll('script, style, noscript, .header, .footer, #header, #footer');
                    scripts.forEach(el => el.remove());

                    // 텍스트 추출
                    return clone.innerText.replace(/\s+/g, ' ').substring(0, 60000);
                });

                // 내용이 비어있으면 건너뛰기
                if (!pageContent || pageContent.trim().length === 0) {
                    console.log("      ⚠️ 페이지 내용이 비어있습니다.");
                    break;
                }

                // Gemini 호출
                const model = this.genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    generationConfig: {
                        maxOutputTokens: 8192,
                        responseMimeType: "application/json"
                    }
                });

                const prompt = `
                    You are a strict data extractor.
                    Extract ALL courses from the text below.
                    
                    **CRITICAL RULES:**
                    1. Each course MUST have a "title". If title is unknown, DO NOT include it.
                    2. Map "교육기관" column to "institution".
                    3. Map "신청상태" to "status" ("신청가능"->"접수중", "마감"->"모집종료").
                    
                    **DATE EXTRACTION RULES (Current Year: 2025):**
                    - Look for "교육기간" (Education Period) column -> Map to "course_date".
                    - Look for "접수기간" (Application Period) column -> Map to "apply_date".
                    - Format must be "YYYY.MM.DD ~ YYYY.MM.DD". Add year "2025" if missing.
                    
                    Return JSON: { "courses": [ { "title": "...", "institution": "...", ... } ] }
                    
                    [Text]: ${pageContent}
                `;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                const rawData = JSON.parse(responseText);
                const rawCourses = rawData.courses || [];

                console.log(`      🔍 ${rawCourses.length}개 항목 발견`);

                const validCourses = rawCourses
                    .filter((c: any) => c.title && c.title.trim().length > 0)
                    .map((c: any) => ({
                        title: c.title,
                        category: c.category || '기타',
                        target: c.target || '전체',
                        status: c.status || '접수중',
                        image_url: '',
                        d_day: '',
                        institution: c.institution || '성남시평생학습관',
                        price: c.price || '무료',
                        region: '성남시',
                        place: c.institution || '성남시',
                        course_date: c.course_date,
                        apply_date: c.apply_date,
                        time: c.time,
                        capacity: typeof c.capacity === 'number' ? c.capacity : 0,
                        contact: '',
                        link: url
                    }));

                allCourses = [...allCourses, ...validCourses];

                // 3. 다음 페이지 이동
                if (pageNum < maxPages) {
                    try {
                        // [수정] fn_list(2,'') 형태의 링크를 찾도록 변경
                        const nextBtn = await page.$(`a[onclick*="fn_list(${pageNum + 1}"]`);

                        if (nextBtn) {
                            await nextBtn.click();
                            console.log(`      ➡️ 페이지 ${pageNum + 1}로 이동`);
                            await page.waitForTimeout(4000);
                        } else {
                            console.log("      🚫 다음 페이지 버튼 없음. 종료.");
                            break;
                        }
                    } catch (e) {
                        console.log("      ⚠️ 페이지 이동 에러:", e);
                        break;
                    }
                }
            }

        } catch (e) {
            console.error("❌ Seongnam Critical Error:", e);
        } finally {
            await browser.close();
        }

        return allCourses;
    }
}