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

            // [수정됨] 모델명을 'gemini-1.5-flash-latest'로 변경
            // (만약 이것도 404가 뜨면 'gemini-pro' 로 변경해보세요)
            const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
                You are a data extractor. 
                Extract course information from the provided web page text below.
                
                Return ONLY a valid JSON object with a key "courses" which is an array of objects.
                Do not include any markdown formatting (like \`\`\`json). Just the raw JSON string.

                Each object must match this structure:
                {
                    "title": "Course Name",
                    "category": "Category (e.g. 문화, 체육, IT...)",
                    "target": "Target Audience (e.g. 성인, 초등...)",
                    "status": "Status (only one of: '접수중', '마감임박', '접수예정', '접수대기', '모집종료', '추가접수')",
                    "apply_date": "YYYY.MM.DD ~ YYYY.MM.DD",
                    "course_date": "YYYY.MM.DD ~ YYYY.MM.DD",
                    "time": "Time string",
                    "price": "Price string (or '무료')",
                    "capacity": Number (0 if unknown)
                }
                
                - If status is unclear, infer it from dates (today is ${new Date().toISOString().split('T')[0]}).
                - Use '접수중' if current date is within apply_date.
                - Use '모집종료' if current date is past apply_date.

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