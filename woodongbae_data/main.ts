import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
// [수정 1] .ts 확장자 명시
import { HanamGamilScraper } from './scrapers/hanam-gamil.ts';
import { Course } from './types.ts';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. .env 파일 위치 지정
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "";

console.log("-----------------------------------");
console.log("Checking Env Variables...");
console.log("URL:", SUPABASE_URL ? "✅ Loaded" : "❌ Missing");
console.log("KEY:", SUPABASE_KEY ? "✅ Loaded" : "❌ Missing");
console.log("-----------------------------------");

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("🚨 Error: .env 파일을 찾을 수 없거나 키가 비어있습니다.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log("🚀 크롤링 시작...");

    try {
        const scraper = new HanamGamilScraper();
        // [수정 2] Course[] 타입 명시
        const courses: Course[] = await scraper.scrape();

        console.log(`📦 ${courses.length}개 강좌 수집 완료. DB 저장을 시도합니다...`);

        if (courses.length > 0) {
            // [수정 3] map 함수 인자 c에 Course 타입 지정
            const dbData = courses.map((c: Course) => ({
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
                course_date: c.course_date, // 날짜 필드 추가
                apply_date: c.apply_date,   // 날짜 필드 추가
                time: c.time,               // 시간 필드 추가
                capacity: c.capacity,       // 정원 필드 추가
                contact: c.contact,         // 연락처 필드 추가
                link: c.link,               // 링크 필드 추가
                raw_data: c
            }));

            const { error } = await supabase.from('courses').insert(dbData);

            if (error) {
                console.error("🔥 DB 저장 실패:", error.message);
            } else {
                console.log("✨ DB 저장 성공!");
            }
        } else {
            console.log("⚠️ 수집된 데이터가 없습니다.");
        }

    } catch (error) {
        console.error("❌ 크롤링 중 오류 발생:", error);
    }
}

main();