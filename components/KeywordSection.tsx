"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trash2, AlertCircle, Bell } from "lucide-react";
import toast from "react-hot-toast";

interface Keyword {
    id: string; // Assuming 'keywords' table has an ID
    word: string;
}

export default function KeywordSection() {
    const supabase = createClient();
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // 1. 내 키워드 불러오기
    useEffect(() => {
        const fetchKeywords = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data, error } = await supabase
                .from("keywords")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (data) setKeywords(data);
        };
        fetchKeywords();
    }, []);

    // 2. 키워드 추가하기
    const addKeyword = async () => {
        if (!input.trim()) return;
        setLoading(true);

        try {
            // [수정] 유저 정보 확실히 가져오기
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("로그인이 필요합니다.");
                return;
            }

            const { data, error } = await supabase
                .from("keywords")
                .insert({ user_id: user.id, word: input.trim() }) // user.id 직접 사용
                .select()
                .single();

            if (error) throw error;
            if (data) setKeywords([data, ...keywords]);
            setInput("");
        } catch (error: any) {
            console.error("키워드 추가 실패:", error.message || error);
            toast.error("키워드 추가에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 3. 키워드 삭제하기
    const removeKeyword = async (id: string) => {
        const { error } = await supabase.from("keywords").delete().eq("id", id);
        if (!error) {
            setKeywords(keywords.filter((k) => k.id !== id));
        } else {
            toast.error("삭제에 실패했습니다.");
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                등록한 알림 키워드
            </h2>

            {/* 입력창 */}
            <div className="flex gap-2 mb-6">
                <label htmlFor="keyword-input" className="sr-only">알림 키워드 입력</label>
                <input
                    id="keyword-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="예: 수영, 요가"
                    className="border border-gray-200 p-3 rounded-xl flex-1 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                    onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && addKeyword()}
                    disabled={loading}
                />
                <button
                    onClick={addKeyword}
                    disabled={loading || !input.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    {loading ? "추가 중..." : "추가"}
                </button>
            </div>

            {/* 목록 */}
            <div className="flex flex-wrap gap-2">
                {keywords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 w-full text-center bg-stone-50 rounded-xl">
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3">
                            <Bell className="w-6 h-6 text-orange-400" />
                        </div>
                        <p className="text-sm font-medium text-stone-500 mb-1">등록된 키워드가 없어요</p>
                        <p className="text-xs text-stone-400">관심 키워드를 추가하면 새 강좌 알림을 받을 수 있어요.</p>
                    </div>
                ) : (
                    keywords.map((k) => (
                        <span
                            key={k.id}
                            className="bg-orange-50 text-orange-700 border border-orange-100 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in"
                        >
                            #{k.word}
                            <button
                                onClick={() => removeKeyword(k.id)}
                                className="text-orange-300 hover:text-orange-500 transition-colors ml-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </span>
                    ))
                )}
            </div>

            <p className="text-xs text-stone-400 mt-6 pt-4 border-t border-stone-100 flex items-center gap-2">
                💡 키워드를 등록해두면 <strong>새로운 강좌</strong>가 등록될 때 알림(메일/앱)을 보내드립니다.
            </p>
        </div>
    );
}
