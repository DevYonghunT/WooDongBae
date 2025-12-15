import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, Trash2 } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function MyPage() {
    // 👇 [수정] Next.js 15에서는 cookies()가 Promise입니다. await 필수!
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // 서버 컴포넌트에서 쿠키 설정 무시 (미들웨어에서 처리됨)
                    }
                },
            },
        }
    );

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

    // 3. 알림 키워드 가져오기
    const { data: alerts } = await supabase
        .from("keyword_alerts")
        .select("*")
        .eq("email", user.email || "");

    // [Debug] 데이터 확인용 로그
    console.log("[MyPage] User ID:", user.id);
    console.log("[MyPage] Bookmarks Count:", bookmarks?.length);

    // 4. 삭제 액션
    async function deleteKeyword(id: number) {
        "use server";
        const cookieStore = await cookies(); // 여기도 await 추가
        const sb = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    }
                }
            }
        );
        await sb.from("keyword_alerts").delete().eq("id", id);
        redirect("/mypage");
    }

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* 프로필 섹션 */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 flex items-center gap-6">
                    <img
                        src={user.user_metadata.avatar_url || "https://via.placeholder.com/100"}
                        alt="프로필"
                        className="w-24 h-24 rounded-full border-4 border-orange-50"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">
                            {user.user_metadata.full_name || user.user_metadata.name || "사용자"}님, 안녕하세요! 👋
                        </h1>
                        {!user.email.includes('woodongbae.xyz') && (
                            <p className="text-stone-500 mt-1">{user.email}</p>
                        )}
                    </div>
                </div>

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
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                        <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-orange-500" />
                            등록한 알림 키워드
                        </h2>

                        <div className="space-y-3">
                            {alerts?.length === 0 ? (
                                <p className="text-stone-400 text-sm py-4">등록된 알림 키워드가 없습니다.</p>
                            ) : (
                                alerts?.map((alert: any) => (
                                    <div key={alert.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                                        <span className="font-medium text-stone-700">{alert.keyword}</span>
                                        <form action={deleteKeyword.bind(null, alert.id)}>
                                            <button className="text-stone-400 hover:text-red-500 p-2 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                ))
                            )}
                        </div>
                        <p className="text-xs text-stone-400 mt-4 bg-stone-50 p-3 rounded-lg">
                            💡 키워드를 등록해두면 새로운 강좌가 떴을 때 메일로 알려드립니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}