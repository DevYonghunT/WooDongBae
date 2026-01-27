import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import ActivityTimeline from "@/components/ActivityTimeline";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "활동 내역 | 마이페이지",
    description: "나의 활동 내역을 확인하세요.",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function ActivityPage() {
    const supabase = await createClient();

    // 로그인 확인
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        redirect("/");
    }

    // 초기 활동 로그 가져오기 (최근 20개)
    const { data: initialLogs, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        console.error("[Activity Logs Error]", error);
    }

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* 헤더 */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/mypage"
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">활동 내역</h1>
                        <p className="text-sm text-stone-500 mt-1">
                            나의 모든 활동을 확인할 수 있습니다.
                        </p>
                    </div>
                </div>

                {/* 타임라인 */}
                <ActivityTimeline userId={user.id} initialLogs={initialLogs || []} />
            </div>
        </div>
    );
}
