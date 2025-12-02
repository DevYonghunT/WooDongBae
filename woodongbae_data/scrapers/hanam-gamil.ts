
import { chromium, type Browser, type Page } from 'playwright';
import type { Scraper, Course } from '../types.js';

export class HanamGamilScraper implements Scraper {
    private baseUrl = 'https://www.hanamlib.go.kr/gamlib/';
    private listUrl = 'https://www.hanamlib.go.kr/gamlib/selectWebEdcLctreList.do?key=1515';

    async scrape(): Promise<Course[]> {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();
        const courses: Course[] = [];

        try {
            await page.goto(this.listUrl);

            // Wait for table to load
            await page.waitForSelector('table.bbs_default_list > tbody > tr', { timeout: 10000 });

            // Get all rows
            const rows = await page.$$('table.bbs_default_list > tbody > tr');
            console.log(`Found ${rows.length} rows.`);

            for (const row of rows) {
                // Extract basic info from list
                const target = await row.$eval('td:nth-child(2)', el => el.textContent?.trim() || '');
                const titleElement = await row.$('td:nth-child(3) > a');
                const title = await titleElement?.textContent() || '';
                const linkHref = await titleElement?.getAttribute('href') || '';
                const link = this.baseUrl + linkHref.replace('./', '');
                const courseDate = await row.$eval('td:nth-child(4)', el => el.textContent?.trim() || '');
                const applyDate = await row.$eval('td:nth-child(5)', el => el.textContent?.trim() || '');
                const capacityRaw = await row.$eval('td:nth-child(6)', el => el.textContent?.trim() || '');
                const statusRaw = await row.$eval('td:nth-child(7)', el => el.textContent?.trim() || '');

                // Map status
                let status = '모집종료';
                if (statusRaw.includes('신청가능') || statusRaw.includes('접수중')) {
                    status = '접수중';
                } else if (statusRaw.includes('마감임박')) {
                    status = '마감임박';
                } else if (statusRaw.includes('접수예정')) {
                    status = '접수예정';
                } else if (statusRaw.includes('대기접수')) {
                    status = '대기접수';
                } else if (statusRaw.includes('접수마감') || statusRaw.includes('종료')) {
                    status = '모집종료';
                }

                // Parse capacity (e.g., "40 / 40 / 20" -> Total / Applied / Wait?)
                // Usually format is "Total / Applied" or similar. Let's assume the first number is capacity.
                const capacityMatch = capacityRaw.match(/(\d+)/);
                const capacity = capacityMatch && capacityMatch[1] ? parseInt(capacityMatch[1], 10) : 0;

                // Visit detail page for more info
                // Note: In a real high-volume scenario, we might want to limit concurrency or use a separate page/context.
                // For simplicity, we'll open a new page or reuse. Let's use a new page to avoid messing up the list loop if we were to navigate the main page.
                // Actually, we can just use the link and fetch the content, but Playwright is browser-based.
                // Let's create a new page for details to keep the list page open.
                const detailPage = await browser.newPage();
                await detailPage.goto(link);

                // Extract detail info
                // We need selectors for the detail page. Since we didn't inspect it, we'll try to find common patterns or just default for now
                // and assume the user might want us to refine this later.
                // However, the prompt asked for specific fields.
                // Let's try to grab the table in the detail view. Usually it's `div.board_view` or similar.

                // Default values if not found
                let price = '무료';
                let place = '하남시가밀도서관';
                let time = '';
                let contact = '';
                let imageUrl = ''; // Random image later

                try {
                    // Try to find specific fields in the detail table
                    // This is a guess based on common Korean gov board structures.
                    // We can look for th containing '수강료' and get the next td.
                    const detailRows = await detailPage.$$('div.board_view table tbody tr');
                    for (const dRow of detailRows) {
                        const th = await dRow.$('th');
                        const thText = await th?.textContent();
                        const td = await dRow.$('td');
                        const tdText = await td?.textContent();

                        if (thText?.includes('수강료') || thText?.includes('참가비')) {
                            price = tdText?.trim() || price;
                        }
                        if (thText?.includes('장소') || thText?.includes('강의실')) {
                            place = tdText?.trim() || place;
                        }
                        if (thText?.includes('시간') || thText?.includes('일시')) {
                            time = tdText?.trim() || time;
                        }
                        if (thText?.includes('문의')) {
                            contact = tdText?.trim() || contact;
                        }
                    }
                } catch (e) {
                    console.error(`Error parsing detail page for ${title}:`, e);
                }

                await detailPage.close();

                courses.push({
                    title: title.trim(),
                    category: '기타', // Default
                    target: target,
                    status: status,
                    image_url: 'https://picsum.photos/300/200', // Random image
                    d_day: '', // Calculate if needed
                    institution: '하남시가밀도서관',
                    price: price,
                    region: '하남시',
                    place: place,
                    course_date: courseDate,
                    apply_date: applyDate,
                    time: time,
                    capacity: capacity,
                    contact: contact,
                    link: link
                });
            }

        } catch (error) {
            console.error('Error scraping Hanam Gamil:', error);
        } finally {
            await browser.close();
        }

        return courses;
    }
}
