"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, PenTool } from "lucide-react";
import { getCommunityData } from "@/app/actions/community";
import WritePostModal from "@/components/WritePostModal";
import { motion, AnimatePresence } from "framer-motion";

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<"notice" | "free">("free");
    const [isWriteOpen, setIsWriteOpen] = useState(false);
    const [data, setData] = useState<{ notices: any[], posts: any[] }>({ notices: [], posts: [] });
    const [isLoading, setIsLoading] = useState(true);

    // [추가] 펼쳐진 게시글 ID들을 저장하는 집합 (Set)
    // ID 충돌 방지를 위해 "notice-1", "post-5" 같은 문자열 형태로 저장
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        try {
            const res = await getCommunityData();
            setData(res);
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // [추가] 게시글 클릭 시 펼침/접힘 토글 함수
    const toggleExpand = (type: "notice" | "post", id: number) => {
        const key = `${type}-${id}`;
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key); // 이미 있으면 삭제 (접기)
            } else {
                newSet.add(key);    // 없으면 추가 (펼치기)
            }
            return newSet;
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-stone-50 border-b border-gray-200 pt-12 pb-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                        💬 우동배 커뮤니티
                    </h1>
                    <p className="text-gray-500 font-medium">
                        우리 동네 강좌 정보도 나누고, 자유롭게 이야기해요.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setActiveTab("notice")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "notice"
                                    ? "bg-white text-primary-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            📢 공지사항
                        </button>
                        <button
                            onClick={() => setActiveTab("free")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "free"
                                    ? "bg-white text-primary-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            🗣️ 자유게시판
                        </button>
                    </div>

                    {activeTab === "free" && (
                        <button
                            onClick={() => setIsWriteOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                        >
                            <PenTool className="w-4 h-4" />
                            글쓰기
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-20 text-gray-400">로딩 중...</div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {/* 공지사항 탭 */}
                            {activeTab === "notice" && (
                                <div className="space-y-3">
                                    {data.notices.length === 0 ? (
                                        <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            아직 등록된 공지사항이 없습니다.
                                        </div>
                                    ) : (
                                        data.notices.map((notice) => {
                                            const isExpanded = expandedIds.has(`notice-${notice.id}`);
                                            return (
                                                <motion.div
                                                    layout // [핵심] 크기 변경 애니메이션
                                                    key={notice.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => toggleExpand("notice", notice.id)}
                                                    className={`p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer relative overflow-hidden ${notice.is_pinned
                                                            ? "bg-primary-50/50 border-primary-100"
                                                            : "bg-white border-gray-100"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 p-2 bg-white rounded-full shadow-sm text-primary-500 shrink-0">
                                                            <Megaphone className="w-5 h-5" />
                                                        </div>
                                                        <div className="w-full">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {notice.is_pinned && (
                                                                    <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full">
                                                                        필독
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-md">
                                                                    {notice.category}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {formatDate(notice.created_at)}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-bold text-gray-800 text-lg mb-2">{notice.title}</h3>

                                                            {/* 내용 부분: 펼쳐지면 line-clamp 제거 + 줄바꿈 허용 */}
                                                            <motion.div layout>
                                                                <p className={`text-gray-600 text-sm leading-relaxed ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
                                                                    }`}>
                                                                    {notice.content}
                                                                </p>
                                                            </motion.div>

                                                            {/* 펼침 상태 힌트 (선택사항) */}
                                                            <motion.div layout className="mt-2 text-xs text-gray-400 text-right">
                                                                {isExpanded ? "접기 ▲" : "더 보기 ▼"}
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* 자유게시판 탭 */}
                            {activeTab === "free" && (
                                <div className="space-y-3">
                                    {data.posts.length === 0 ? (
                                        <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            첫 번째 게시글의 주인공이 되어보세요! 🎉
                                        </div>
                                    ) : (
                                        data.posts.map((post) => {
                                            const isExpanded = expandedIds.has(`post-${post.id}`);
                                            return (
                                                <motion.div
                                                    layout
                                                    key={post.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => toggleExpand("post", post.id)}
                                                    className="group p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex gap-2">
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                                                                {post.tag}
                                                            </span>
                                                            <span className="text-xs text-gray-400 py-0.5">
                                                                {formatDate(post.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-primary-600 transition-colors">
                                                        {post.title}
                                                    </h3>

                                                    {/* 내용 부분 */}
                                                    <motion.div layout>
                                                        <p className={`text-gray-500 text-sm leading-relaxed mb-3 ${isExpanded ? "whitespace-pre-wrap text-gray-700" : "line-clamp-1"
                                                            }`}>
                                                            {post.content}
                                                        </p>
                                                    </motion.div>

                                                    <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-3">
                                                        <span className="font-medium text-gray-600 flex items-center gap-1">
                                                            By. {post.nickname}
                                                        </span>
                                                        <div className="flex gap-3 text-gray-400">
                                                            <span>조회 {post.view_count}</span>
                                                            <span className="text-primary-500 font-medium">
                                                                {isExpanded ? "접기" : "읽기"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            <WritePostModal
                isOpen={isWriteOpen}
                onClose={() => setIsWriteOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}