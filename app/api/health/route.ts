import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const checks: Record<string, string> = {
        api: "ok",
        database: "unknown",
        timestamp: new Date().toISOString(),
    };

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase.from("courses").select("id").limit(1);
        checks.database = error ? "error" : "ok";
    } catch {
        checks.database = "error";
    }

    const allOk = checks.api === "ok" && checks.database === "ok";

    return NextResponse.json(checks, {
        status: allOk ? 200 : 503,
    });
}
