import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Course } from './types.ts';

export class UniversalAiScraper {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing in .env file");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async scrape(url: string, institutionName: string, regionName: string): Promise<Course[]> {
        console.log(`🤖 AI Scraper (Gemini)가 ${institutionName} 접속 중...`);

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const pageContent = await page.evaluate(() => {
                const body = document.body.cloneNode(true) as HTMLElement;
                const scripts = body.querySelectorAll('script, style, noscript, svg, img, footer, header, nav');
                scripts.forEach(el => el.remove());
                return body.innerText.replace(/\s+/g, ' ').substring(0, 30000);
            });

            console.log("🧠 Gemini에게 데이터 분석 요청 중...");

            const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            console.log("🔧 사용 중인 모델: gemini-2.0-flash");

            // [핵심 수정] 프롬프트에 상태값 매핑 규칙을 강력하게 추가
            const prompt = `
                You are a data extractor. 
                Extract course information from the provided web page text below.
                
                ** IMPORTANT RULE about STATUS:**
                1. Trust the text status on the screen MORE than the date calculation.
                2. Map the Korean status text to the following standard statuses:
            - "신청가능", "접수중", "신청중" -> "접수중"
                - "대기접수", "대기신청", "접수대기" -> "접수대기"
                - "마감임박" -> "마감임박"
                - "접수예정", "준비" -> "접수예정"
                - "마감", "접수마감", "교육중", "진행중", "종료" -> "모집종료"
                - "추가접수", "추가모집" -> "추가접수"
                
                Return ONLY a valid JSON object with a key "courses" which is an array of objects.
                Do not include any markdown formatting.

                Each object must match this structure:
            {
                "title": "Course Name",
                    "category": "Category",
                        "target": "Target Audience",
                            "status": "Standardized Status (접수중, 접수대기, 모집종료, etc.)",
                                "apply_date": "YYYY.MM.DD ~ YYYY.MM.DD",
                                    "course_date": "YYYY.MM.DD ~ YYYY.MM.DD",
                                        "time": "Time string",
                                            "price": "Price string (or '무료')",
                                                "capacity": Number(0 if unknown)
                }

            [Web Page Text]:
                ${pageContent}
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const jsonResult = JSON.parse(text);
            const rawCourses = jsonResult.courses || [];

            console.log(`✅ Gemini가 ${rawCourses.length}개의 강좌를 찾아냈습니다!`);

            return rawCourses.map((c: any) => ({
                title: c.title,
                category: c.category,
                target: c.target,
                status: c.status,
                image_url: `https://picsum.photos/seed/${Math.random()}/800/600`,
                d_day: '',
                institution: institutionName,
                price: c.price,
                region: regionName,
                place: institutionName,
                course_date: c.course_date,
                apply_date: c.apply_date,
                time: c.time,
                capacity: c.capacity,
                contact: '',
                link: url
            }));

        } catch (error) {
            console.error("❌ Gemini Scraping Error:", error);
            return [];
        } finally {
            await browser.close();
        }
    }
}