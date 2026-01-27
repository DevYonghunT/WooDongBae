import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase Admin Client (서비스 역할 키 사용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin 권한
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Supabase Admin API로 사용자 삭제
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error("[Delete User Error]", error);
            return NextResponse.json(
                { error: error.message || "Failed to delete user" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error("[Delete Account API Error]", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
