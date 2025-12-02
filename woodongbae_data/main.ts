import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { HanamGamilScraper } from './scrapers/hanam-gamil.js';
import type { Course } from './types.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function main() {
    console.log('Starting Hanam Library Scraper...');

    // Initialize Scrapers
    const scrapers = [
        new HanamGamilScraper(),
    ];

    let allCourses: Course[] = [];

    // Run all scrapers
    for (const scraper of scrapers) {
        try {
            console.log(`Running ${scraper.constructor.name}...`);
            const courses = await scraper.scrape();
            console.log(`Scraped ${courses.length} courses from ${scraper.constructor.name}`);
            allCourses = [...allCourses, ...courses];
        } catch (error) {
            console.error(`Error running ${scraper.constructor.name}:`, error);
        }
    }

    console.log(`Total courses collected: ${allCourses.length}`);

    // Upsert to Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
        console.log('Connecting to Supabase...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        const { data, error } = await supabase
            .from('courses')
            .upsert(allCourses, { onConflict: 'link' }); // Assuming 'link' is unique enough, or we need a composite key. 
        // The user didn't specify a unique ID, but 'link' is usually a good candidate for scraping.

        if (error) {
            console.error('Error upserting to Supabase:', error);
        } else {
            console.log('Successfully upserted data to Supabase.');
        }
    } else {
        console.log('Supabase credentials not found. Skipping DB upload.');
        console.log('Sample Data:', allCourses.slice(0, 2));
    }
}

main().catch(console.error);
