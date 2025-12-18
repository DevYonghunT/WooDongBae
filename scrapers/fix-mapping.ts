import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeRegionAndInstitution } from '../utils/normalization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase credentials are missing.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const PAGE_SIZE = 1000;
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to DRY RUN (true) unless explicitly 'false'

type Row = {
    id: number;
    title: string;
    region: string | null;
    institution: string | null;
    place: string | null;
};

async function fetchAllRows() {
    let page = 0;
    let all: Row[] = [];

    while (true) {
        const { data, error } = await supabase
            .from('courses')
            .select('id, title, region, institution, place')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        all = all.concat(data as Row[]);
        if (data.length < PAGE_SIZE) break;
        page++;
    }
    return all;
}

async function runFix() {
    console.log(`🚀 Starting Region Fix Script (DRY_RUN: ${DRY_RUN})`);

    const rows = await fetchAllRows();
    console.log(`📊 Loaded ${rows.length} rows`);

    const updates: { id: number; oldRegion: string; newRegion: string }[] = [];

    for (const row of rows) {
        const rawRegion = (row.region ?? "").trim();
        const rawInstitution = (row.institution ?? "").trim();
        const rawPlace = (row.place ?? "").trim();

        // Check normalization result
        const normalized = normalizeRegionAndInstitution(rawRegion, rawInstitution, rawPlace);
        const newRegion = normalized.region;

        // Condition: 
        // 1. Current region is "서울특별시" or empty
        // 2. New normalized region is DIFFERENT and NOT empty
        // 3. New normalized region is not "서울특별시" (we want valid districts like "송파구")

        const isTarget = rawRegion === "서울특별시" || !rawRegion;
        const hasBetterData = newRegion && newRegion !== "서울특별시" && newRegion !== rawRegion;

        if (isTarget && hasBetterData) {
            updates.push({
                id: row.id,
                oldRegion: rawRegion,
                newRegion: newRegion
            });
        }
    }

    console.log(`🔎 Found ${updates.length} rows to update.`);

    // Sampling
    if (updates.length > 0) {
        console.log("\nSample Updates:");
        updates.slice(0, 10).forEach(u => {
            console.log(` - ID ${u.id}: "${u.oldRegion}" -> "${u.newRegion}"`);
        });
    }

    if (DRY_RUN) {
        console.log(`\n✅ [DRY RUN] No changes made. Run with DRY_RUN=false to apply.`);
        return;
    }

    console.log(`\n💾 Applying updates...`);
    let successCount = 0;
    let failCount = 0;

    // Batch update (sequential for safety, or we can assume unrelated rows)
    // Actually, calling update one by one is slow but safest for a script.
    // For 500 rows it's manageable. If 5000+, batching by CASE WHEN is better, but Supabase SDK simplistic approach:

    for (const u of updates) {
        const { error } = await supabase
            .from('courses')
            .update({ region: u.newRegion })
            .eq('id', u.id);

        if (error) {
            console.error(`❌ Failed ID ${u.id}:`, error.message);
            failCount++;
        } else {
            successCount++;
            if (successCount % 100 === 0) process.stdout.write('.');
        }
    }

    console.log(`\n✅ Update Complete: ${successCount} updated, ${failCount} failed.`);
}

runFix().catch((e) => {
    console.error("Script failed:", e);
    process.exit(1);
});
