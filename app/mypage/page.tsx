import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import KeywordSection from "@/components/KeywordSection";
import NotificationSettingsPanel from "@/components/NotificationSettingsPanel";
import ProfileCard from "@/components/ProfileCard";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "마이페이지",
    description: "찜한 강좌와 알림 키워드를 관리하세요.",
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: "마이페이지 | 우동배",
        url: "/mypage",
    },
};

export default async function MyPage() {
    const supabase = await createClient();

    // 1. 로그인 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/");
    }

    // 2. 찜 목록 가져오기
    const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("*, courses(*)")
        .eq("user_id", user.id);

    // [Debug] 데이터 확인용 로그
    console.log("[MyPage] User ID:", user.id);
    console.log("[MyPage] Bookmarks Count:", bookmarks?.length);

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* 프로필 섹션 */}
                <ProfileCard user={user} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 찜한 강좌 목록 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                        <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-6">
                            <Heart className="w-5 h-5 text-red-500 fill-current" />
                            찜한 강좌 ({bookmarks?.length || 0})
                        </h2>

                        <div className="space-y-4">
                            {bookmarks?.length === 0 ? (
                                <p className="text-stone-400 text-sm py-4">아직 찜한 강좌가 없어요.</p>
                            ) : (
                                bookmarks?.map((item: any) => (
                                    <Link
                                        key={item.id}
                                        href={`/courses/${item.courses.id}`}
                                        className="block p-4 rounded-xl bg-stone-50 hover:bg-orange-50 transition-colors group"
                                    >
                                        <div className="font-bold text-stone-800 group-hover:text-orange-600 truncate">
                                            {item.courses.title}
                                        </div>
                                        <div className="text-xs text-stone-500 mt-1 flex justify-between">
                                            <span>{item.courses.institution}</span>
                                            <span className={item.courses.status === '접수중' ? 'text-blue-600 font-bold' : ''}>
                                                {item.courses.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 알림 키워드 관리 */}
                    <KeywordSection />
                </div>

                {/* 알림 설정 패널 (전체 너비) */}
                <NotificationSettingsPanel />
            </div>
        </div>
    );
}