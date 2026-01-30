import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const checks: Record<string, string> = {
        api: "ok",
        database: "unknown",
        timestamp: new Date().toISOString(),
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        checks.database = "config_error";
        return NextResponse.json(checks, { status: 503 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from("courses").select("id").limit(1);

        if (error) {
            checks.database = "error";
            if (process.env.NODE_ENV !== "production") {
                console.error("[Health Check] DB Error:", error.message);
            }
        } else {
            checks.database = "ok";
        }
    } catch (err) {
        checks.database = "error";
        if (process.env.NODE_ENV !== "production") {
            console.error("[Health Check] Exception:", err);
        }
    }

    const allOk = checks.api === "ok" && checks.database === "ok";

    return NextResponse.json(checks, {
        status: allOk ? 200 : 503,
    });
}
