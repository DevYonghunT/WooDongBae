import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeRegionAndInstitution, refineInstitutionName } from '../utils/normalization.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const PAGE_SIZE = 1000;

type Row = {
    id: number;
    title: string;
    region: string | null;
    institution: string | null;
    place: string | null;
};

const compact = (s?: string | null) => (s ?? "").trim();
const normalizeKey = (s: string) => s.replace(/\s+/g, "");

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

async function runAudit() {
    const rows = await fetchAllRows();
    console.log(`📊 Loaded ${rows.length} course rows`);

    const missingRegion: Row[] = [];
    const missingInstitution: Row[] = [];
    const regionMismatch: Row[] = [];
    const institutionMismatch: Row[] = [];

    for (const row of rows) {
        const storedRegion = compact(row.region);
        const storedInstitution = refineInstitutionName(compact(row.institution));
        const normalized = normalizeRegionAndInstitution(row.region ?? "", row.institution ?? "", row.place ?? "");

        if (!storedRegion) missingRegion.push(row);
        if (!storedInstitution) missingInstitution.push(row);

        if (storedRegion && normalizeKey(storedRegion) !== normalizeKey(normalized.region)) {
            regionMismatch.push(row);
        }
        if (storedInstitution && normalizeKey(storedInstitution) !== normalizeKey(normalized.institution)) {
            institutionMismatch.push(row);
        }
    }

    const printSample = (label: string, rows: Row[]) => {
        console.log(`\n${label}: ${rows.length}`);
        rows.slice(0, 20).forEach((r) => {
            const normalized = normalizeRegionAndInstitution(r.region ?? "", r.institution ?? "", r.place ?? "");
            console.log(
                ` - #${r.id} "${r.title}" | region="${compact(r.region)}" -> "${normalized.region}" | institution="${compact(r.institution)}" -> "${normalized.institution}"`
            );
        });
    };

    printSample("🚩 Missing region", missingRegion);
    printSample("🚩 Missing institution", missingInstitution);
    printSample("🔄 Region mismatch after normalization", regionMismatch);
    printSample("🔄 Institution mismatch after normalization", institutionMismatch);

    console.log("\n✅ Audit complete.");
}

runAudit().catch((e) => {
    console.error("Audit failed:", e);
    process.exit(1);
});