import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function AdminPage() {
    // 👇 [수정] await cookies() 적용
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    );

    const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
    const { count: alertCount } = await supabase.from('keyword_alerts').select('*', { count: 'exact', head: true });

    const { data: recentAlerts } = await supabase
        .from('keyword_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="min-h-screen bg-stone-100 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-stone-800 mb-8">👑 관리자 대시보드</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-stone-500 font-medium">총 강좌 데이터</h3>
                        <p className="text-4xl font-bold text-stone-900 mt-2">{courseCount || 0}개</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-stone-500 font-medium">알림 구독 키워드</h3>
                        <p className="text-4xl font-bold text-orange-600 mt-2">{alertCount || 0}개</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-stone-500 font-medium">서비스 상태</h3>
                        <p className="text-xl font-bold text-green-600 mt-2 flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            정상 운영 중
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-bold text-stone-800 mb-4">최근 등록된 알림 키워드</h2>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-stone-100 text-stone-400 text-sm">
                                <th className="pb-3">키워드</th>
                                <th className="pb-3">이메일</th>
                                <th className="pb-3">등록일시</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* 👇 [수정] 타입 에러 해결을 위해 any 타입 명시 */}
                            {recentAlerts?.map((alert: any) => (
                                <tr key={alert.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                                    <td className="py-3 font-medium">{alert.keyword}</td>
                                    <td className="py-3 text-stone-500">{alert.email}</td>
                                    <td className="py-3 text-stone-400 text-sm">
                                        {new Date(alert.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}