import { chromium } from 'playwright';
import type { Page, ElementHandle } from 'playwright';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { Course } from './types.ts';
import { normalizeRegionAndInstitution } from '../utils/normalization.ts';

type AnyHandle = ElementHandle<Element>;

export class UniversalAiScraper {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing in .env file");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // 1. 공통: Gemini 모델 생성 헬퍼
    private getModel(): GenerativeModel {
        return this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                temperature: 0.0,
            }
        });
    }

    // 2. 공통: 텍스트 추출 헬퍼
    private async extractPageText(page: Page): Promise<string> {
        return await page.evaluate(() => {
            const main = document.querySelector('#content, #main, .content, .main_content, #container, #contents, #wrap, main, body') || document.body;
            if (!main) return "";

            // 불필요한 요소 제거 (clone 후 작업하여 원본 손상 방지)
            const clone = main.cloneNode(true) as HTMLElement;
            const scripts = clone.querySelectorAll('script, style, noscript, header, footer, nav, .menu, .gnb, iframe');
            scripts.forEach(el => el.remove());

            return clone.innerText.replace(/\s+/g, ' ').substring(0, 60000);
        });
    }

    // 3. 공통: Gemini 텍스트 파서 안전화
    private parseCoursesJson(text: string): any[] {
        try {
            // Markdown 코드 블록 제거
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            return parsed.courses || [];
        } catch (e) {
            console.log("      ⚠️ JSON Parsing Failed, checking raw text...");
            return [];
        }
    }

    // 4. 이미지(포스터) 기반 추출 함수
    private async extractCoursesFromImageBuffer(image: Buffer, model: GenerativeModel): Promise<any[]> {
        try {
            const prompt = `
                You are a data extractor using Vision/OCR.
                Analyze the provided image (poster, flyer, or list) and extract course information.
                
                **CRITICAL RULES:**
                1. Extract TITLES exactly.
                2. If category is unclear, use "기타".
                3. If price is "0" or "free", output "무료".
                4. Extract dates in "YYYY.MM.DD ~ YYYY.MM.DD" format (assume 2025).
                
                Return JSON: { "courses": [ { "title": "...", "category": "...", "target": "...", "status": "...", "apply_date": "...", "course_date": "...", "time": "...", "price": "...", "capacity": 0 } ] }
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: image.toString('base64'),
                        mimeType: 'image/png'
                    }
                }
            ]);

            return this.parseCoursesJson(result.response.text());
        } catch (e) {
            console.log("      ❌ Image Extraction Error:", e);
            return [];
        }
    }

    // 5. 현재 페이지에서 “가장 큰 이미지”를 찾아 OCR 시도
    private async tryExtractFromVisibleImages(page: Page, model: GenerativeModel): Promise<any[]> {
        console.log("      🖼️ 텍스트 부족 -> 화면 내 큰 이미지(포스터) 탐색 중...");
        try {
            const images = await page.$$('img');
            let bestImg: ElementHandle<HTMLImageElement> | null = null;
            let maxArea = 0;

            for (const img of images) {
                const box = await img.boundingBox();
                if (box) {
                    const area = box.width * box.height;
                    // 너무 작은 아이콘 등 제외 (250x250 이상)
                    if (area > 250 * 250 && area > maxArea) {
                        maxArea = area;
                        bestImg = img as unknown as ElementHandle<HTMLImageElement>;
                    }
                }
            }

            if (bestImg) {
                console.log("      📸 가장 큰 이미지 발견, 캡처 및 분석...");
                await bestImg.scrollIntoViewIfNeeded();
                // 이미지 요소만 캡처
                const buffer = await bestImg.screenshot({ type: 'png' });
                const courses = await this.extractCoursesFromImageBuffer(buffer, model);
                if (courses.length > 0) {
                    console.log(`      ✨ 이미지에서 ${courses.length}개 추출 성공`);
                    return courses;
                }
            }
        } catch (e) {
            console.log("      ⚠️ Visible Image Extraction Failed");
        }
        return [];
    }

    // 6. “클릭해야 포스터가 열리는” 케이스 커버
    private async tryClickToOpenPosterAndExtract(page: Page, model: GenerativeModel): Promise<any[]> {
        console.log("      🖱️ 포스터/첨부파일 클릭 탐색 중...");

        const candidates: AnyHandle[] = [];

        try {
            // 후보 요소 수집
            const anchors = await page.$$('a[href$=".jpg"], a[href$=".png"], a[href$=".jpeg"], a[href$=".webp"], a:has-text("첨부"), a:has-text("포스터"), a:has-text("이미지"), a:has-text("다운로드"), a:has-text("보기"), a:has-text("확대")');
            for (const a of anchors) candidates.push(a as unknown as AnyHandle);

            const buttons = await page.$$('button:has-text("보기"), button:has-text("포스터"), button:has-text("이미지")');
            for (const b of buttons) candidates.push(b as unknown as AnyHandle);

            // 이미지 감싸는 a 태그 추가 확인
            const images = await page.$$('img');
            for (const img of images) {
                const handle = await img.evaluateHandle((el) => el.closest('a'));
                const linkEl = handle.asElement();
                if (linkEl) candidates.push(linkEl as unknown as AnyHandle);
                await handle.dispose();
            }

            // 상위 5개만 시도
            const limitedCandidates = candidates.slice(0, 5);

            for (const candidate of limitedCandidates) {
                try {
                    // 1. Popup 이벤트 리스너 준비
                    const popupPromise = page.context().waitForEvent('page', { timeout: 3000 }).catch(() => null);

                    // 2. 클릭
                    await candidate.click({ timeout: 2000 }).catch(() => { });

                    // A) 새 창/탭 처리
                    const popup = await popupPromise;
                    if (popup) {
                        console.log("      tab 새 탭 감지. 포스터 분석 시도...");
                        await popup.waitForLoadState('networkidle');
                        // 탭 내 이미지 분석 우선, 실패하면 전체 스샷
                        let courses = await this.tryExtractFromVisibleImages(popup, model);
                        if (courses.length === 0) {
                            const buffer = await popup.screenshot({ fullPage: true });
                            courses = await this.extractCoursesFromImageBuffer(buffer, model);
                        }
                        await popup.close();
                        if (courses.length > 0) return courses;
                    }

                    // B) 모달/라이트박스 처리
                    // 클릭 후 모달이 떴는지 잠시 대기
                    await page.waitForTimeout(1500);
                    const modal = await page.$('#modal, .modal, .popup, .layer, .lightbox, .dialog');
                    if (modal && await modal.isVisible()) {
                        console.log("      📦 모달 감지. 스크린샷 분석...");
                        const buffer = await modal.screenshot();
                        const courses = await this.extractCoursesFromImageBuffer(buffer, model);
                        // 모달 닫기 시도
                        await page.keyboard.press('Escape').catch(() => { });
                        if (courses.length > 0) return courses;
                    }

                    // C) 직접 이미지 파일 링크인 경우 (다운로드 등)
                    const href = await candidate.getAttribute('href');
                    if (href && (href.endsWith('.jpg') || href.endsWith('.png') || href.endsWith('.jpeg'))) {
                        console.log("      📥 이미지 링크 다운로드 분석...");
                        const absUrl = new URL(href, page.url()).toString();
                        const response = await page.request.get(absUrl);
                        if (response.ok()) {
                            const buffer = await response.body();
                            const courses = await this.extractCoursesFromImageBuffer(buffer, model);
                            if (courses.length > 0) return courses;
                        }
                    }

                } catch (innerE) {
                    continue; // 다음 후보 시도
                }
            }

        } catch (e) {
            console.log("      ⚠️ Click Extraction Failed");
        }
        return [];
    }

    // 7. “목록 -> 상세 -> 포스터” 탐색
    private async tryFollowDetailLinks(page: Page, model: GenerativeModel): Promise<any[]> {
        console.log("      🔗 상세 페이지 진입 탐색 중...");
        try {
            // 상세페이지로 추정되는 링크 수집
            // 1. href에 특정 키워드
            const hrefCandidates = await page.$$('a[href*="Detail"], a[href*="view"], a[href*="read"], a[href*="program"]');
            // 2. onclick에 특정 키워드
            const clickCandidates = await page.$$('a[onclick*="Detail"], a[onclick*="view"]');

            let links = [...hrefCandidates, ...clickCandidates];
            // 중복 제거 및 상위 5개
            links = links.slice(0, 5);

            for (const linkEl of links) {
                try {
                    const href = await linkEl.getAttribute('href') || "";
                    // 그냥 #이나 javascript:void(0)인 경우 처리 주의

                    console.log("      ➡️ 상세 페이지 진입 시도...");

                    // 페이지 이동 전 URL 저장
                    const originalUrl = page.url();

                    await linkEl.click({ timeout: 3000 });
                    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

                    // 이동했는지 확인
                    if (page.url() === originalUrl) {
                        // 이동 안했으면 패스
                        continue;
                    }

                    // 상세 페이지 분석: 텍스트 우선
                    const text = await this.extractPageText(page);
                    // 간략 프롬프트로 텍스트 분석
                    const prompt = `Extract courses from text. Return JSON { "courses": [...] }. Text: ${text.substring(0, 10000)}`;
                    const result = await model.generateContent(prompt);
                    let courses = this.parseCoursesJson(result.response.text());

                    if (courses.length === 0) {
                        // 없으면 이미지 분석
                        courses = await this.tryExtractFromVisibleImages(page, model);
                    }
                    if (courses.length === 0) {
                        // 없으면 팝업/클릭 분석
                        courses = await this.tryClickToOpenPosterAndExtract(page, model);
                    }

                    if (courses.length > 0) {
                        console.log(`      ✅ 상세 페이지에서 정보 획득!`);
                        return courses;
                    }

                    // 실패 시 뒤로가기
                    await page.goBack();
                    await page.waitForLoadState('networkidle');

                } catch (e) {
                    console.log("      ⚠️ Detail Link Error");
                    // 복구 시도
                    try { await page.goBack(); } catch { }
                }
            }

        } catch (e) {
            console.log("      ⚠️ Detail Link Traversal Failed");
        }

        return [];
    }

    // 1. 일반 도서관 스크래핑 (메인 메서드 수정)
    async scrape(url: string, institutionName: string, regionName: string): Promise<Course[]> {
        console.log(`🤖 [${institutionName}] 접속 중...`);
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const model = this.getModel();

        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
            await page.waitForTimeout(1500);

            // 리스트 요소 대기
            await page.waitForSelector(
                'table, tbody tr, ul li, .list, .board, .bbs, .paging, a[href*="Cultural"]',
                { timeout: 10000 }
            ).catch(() => { });

            // 1단계: 텍스트 추출
            const pageContent = await this.extractPageText(page);
            console.log("      🧠 텍스트 분석 중...");

            // 기존 프롬프트 재사용 (조금 축약)
            const prompt = `
                You are a data extractor for Korean lifelong learning courses.
                Extract course information from text.
                
                **RULES:**
                1. EXTRACT TITLES EXACTLY.
                2. Price: "0"->"무료", others with "원".
                3. Dates: "YYYY.MM.DD ~ YYYY.MM.DD" (2025).
                4. Status mapping: "접수중", "접수대기", "마감임박", "접수예정", "모집종료", "추가접수".
                
                Return JSON: { "courses": [ { "title": "...", "category": "...", "target": "...", "status": "...", "apply_date": "...", "course_date": "...", "time": "...", "price": "...", "capacity": 0 } ] }
                
                [Text]: ${pageContent}
            `;

            const result = await model.generateContent(prompt);
            let rawCourses = this.parseCoursesJson(result.response.text());

            // 2단계: 폴백 로직 (텍스트 실패 시)
            if (rawCourses.length === 0 || pageContent.length < 500) {
                console.log("      ⚠️ 텍스트 추출 실패 또는 내용 부족. 비전/클릭 폴백 시작...");

                // (a) 보이는 큰 이미지(포스터) 분석
                rawCourses = await this.tryExtractFromVisibleImages(page, model);

                // (b) 클릭해서 여는 포스터 분석
                if (rawCourses.length === 0) {
                    rawCourses = await this.tryClickToOpenPosterAndExtract(page, model);
                }

                // (c) 상세 페이지 진입 후 분석
                if (rawCourses.length === 0) {
                    rawCourses = await this.tryFollowDetailLinks(page, model);
                }
            }

            console.log(`✅ 최종 ${rawCourses.length}개 발견`);

            // 데이터 정규화 및 매핑 (기존 로직 유지)
            // link는 현재 페이지 URL 사용 가능하면 사용 (상세페이지 진입했으면 그게 맞지만, 
            // tryFollowDetailLinks는 로직상 array를 리턴하고 끝나서, 개별 링크 매핑은 복잡함.
            // 일단은 원본 url 또는 page.url() 사용)

            const finalLink = page.url();

            const courses: Course[] = rawCourses.map((c: any) => {
                const rawRegion = (regionName ?? '').trim();
                const rawInstitution = (institutionName ?? '').trim();
                const rawPlace = String(c.place || rawInstitution).trim();

                const normalized = normalizeRegionAndInstitution(rawRegion, rawInstitution, rawPlace);

                return {
                    title: c.title,
                    category: c.category || '기타',
                    target: c.target || '전체',
                    status: c.status,
                    image_url: '',
                    d_day: '',
                    institution: institutionName,
                    price: c.price || '무료',
                    region: normalized.region || rawRegion,
                    place: c.place || institutionName,
                    course_date: c.course_date,
                    apply_date: c.apply_date,
                    time: c.time,
                    capacity: c.capacity || 0,
                    contact: '',
                    link: finalLink // page.url()이 이동된 상태일 수 있으나, 보통 목록 페이지로 돌아오거나 하면 그 url임.
                };
            });

            return courses;

        } catch (error) {
            console.error(`❌ [${institutionName}] Error:`, error);
            return [];
        } finally {
            await browser.close();
        }
    }

    // [수정] 성남시 전용 스크래핑 메서드 (안전장치 강화판 - 그대로 유지하되 헬퍼 활용 가능)
    // (기존 코드 유지)
    async scrapeSeongnam(url: string, maxPages: number = 5): Promise<Course[]> {
        console.log(`🤖 성남시 통합 포털 스크래핑 시작 (최대 ${maxPages}페이지)`);

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        let allCourses: Course[] = [];

        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

            // 1. [설정] 50개씩 보기
            try {
                const pageUnitSelector = 'select[name="pageUnit"]';
                await page.waitForSelector(pageUnitSelector, { timeout: 5000 });

                console.log("   ⚙️ 50개씩 보기 설정 중...");
                await page.selectOption(pageUnitSelector, '50');

                const viewButton = await page.$('a:has-text("보기")');
                if (viewButton) {
                    await viewButton.click();
                    console.log("   ✅ 보기 버튼 클릭 완료");
                    await page.waitForTimeout(3000);
                } else {
                    console.log("   ⚠️ 보기 버튼을 찾을 수 없습니다.");
                    await page.waitForTimeout(3000);
                }
            } catch (e) {
                console.log("   ⚠️ 설정 변경 실패 (기본값으로 진행)");
            }

            // 2. 페이지 순회
            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                console.log(`   📄 페이지 ${pageNum} 분석 중...`);

                // 헬퍼 활용하여 추출
                const pageContent = await page.evaluate(() => {
                    const main = document.querySelector('#container') || document.body;
                    if (!main) return "";
                    const clone = main.cloneNode(true) as HTMLElement;
                    const scripts = clone.querySelectorAll('script, style, noscript, .header, .footer, #header, #footer');
                    scripts.forEach(el => el.remove());
                    return clone.innerText.replace(/\s+/g, ' ').substring(0, 60000);
                });

                if (!pageContent || pageContent.trim().length === 0) {
                    console.log("      ⚠️ 페이지 내용이 비어있습니다.");
                    break;
                }

                // 텍스트 분석
                const model = this.getModel(); // 헬퍼 사용
                const prompt = `
                    You are a strict data extractor.
                    Extract ALL courses from the text below.
                    Return JSON: { "courses": [ { "title": "...", "institution": "...", ... } ] }
                    [Text]: ${pageContent}
                `;

                const result = await model.generateContent(prompt);
                const rawCourses = this.parseCoursesJson(result.response.text()); // 헬퍼 사용

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