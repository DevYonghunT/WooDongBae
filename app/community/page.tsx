"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Megaphone, PenTool, FolderOpen, MessageSquare } from "lucide-react";
import { getCommunityData } from "@/app/actions/community";
import { motion, AnimatePresence } from "framer-motion";

// 글쓰기 모달 지연 로딩 (필요할 때만 로드)
const WritePostModal = dynamic(() => import("@/components/WritePostModal"));

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<"notice" | "free">("free");
    const [isWriteOpen, setIsWriteOpen] = useState(false);
    const [data, setData] = useState<{ notices: any[], posts: any[] }>({ notices: [], posts: [] });
    const [isLoading, setIsLoading] = useState(true);

    // [상태] 펼쳐진 게시글 ID 관리
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

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

    // [기능] 펼치기/접기 토글 (로그 추가)
    const toggleExpand = (type: "notice" | "post", id: number) => {
        const key = `${type}-${id}`;
        console.log("👆 클릭됨:", key); // F12 콘솔에서 확인 가능

        setExpandedIds(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key); // 이미 있으면 닫기
            } else {
                return [...prev, key]; // 없으면 열기
            }
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
                {/* 탭 버튼 영역 */}
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

                {/* 게시글 목록 영역 */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 animate-pulse">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-4 w-16 bg-gray-200 rounded-md" />
                                        <div className="h-4 w-12 bg-gray-100 rounded-md" />
                                    </div>
                                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                                    <div className="h-4 w-full bg-gray-100 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* === 공지사항 탭 === */}
                            {activeTab === "notice" && (
                                <div className="space-y-3">
                                    {data.notices.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                                <Megaphone className="w-8 h-8 text-orange-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-700 mb-1">아직 공지사항이 없어요</h3>
                                            <p className="text-sm text-gray-400">새로운 소식이 있으면 여기에 안내드릴게요.</p>
                                        </div>
                                    ) : (
                                        data.notices.map((notice) => {
                                            const isExpanded = expandedIds.includes(`notice-${notice.id}`);
                                            return (
                                                <div
                                                    key={`notice-${notice.id}`}
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

                                                            {/* 애니메이션 컨테이너: line-clamp 없이 높이로만 제어 */}
                                                            <motion.div
                                                                initial={false}
                                                                animate={{ height: isExpanded ? "auto" : 40 }} // 접히면 40px, 펼치면 자동
                                                                transition={{ duration: 0.3 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                                                    {notice.content}
                                                                </p>
                                                            </motion.div>

                                                            {/* 더보기 버튼 힌트 */}
                                                            <div className="mt-2 text-xs text-gray-400 text-right font-medium">
                                                                {isExpanded ? "접기 ▲" : "더 보기 ▼"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* === 자유게시판 탭 === */}
                            {activeTab === "free" && (
                                <div className="space-y-3">
                                    {data.posts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                                <MessageSquare className="w-8 h-8 text-orange-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-700 mb-1">아직 게시글이 없어요</h3>
                                            <p className="text-sm text-gray-400 mb-4">첫 번째 게시글의 주인공이 되어보세요!</p>
                                            <button
                                                onClick={() => setIsWriteOpen(true)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                                            >
                                                <PenTool className="w-4 h-4" />
                                                글쓰기
                                            </button>
                                        </div>
                                    ) : (
                                        data.posts.map((post) => {
                                            const isExpanded = expandedIds.includes(`post-${post.id}`);
                                            return (
                                                <div
                                                    key={`post-${post.id}`}
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

                                                    {/* 애니메이션 컨테이너 */}
                                                    <motion.div
                                                        initial={false}
                                                        animate={{ height: isExpanded ? "auto" : 24 }} // 접히면 24px (약 1줄), 펼치면 자동
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-wrap">
                                                            {post.content}
                                                        </p>
                                                    </motion.div>

                                                    <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-3 mt-3">
                                                        <span className="font-medium text-gray-600 flex items-center gap-1">
                                                            By. {post.nickname}
                                                        </span>
                                                        <div className="flex gap-3 text-gray-400">
                                                            <span>조회 {post.view_count}</span>
                                                            <span className="text-primary-500 font-bold">
                                                                {isExpanded ? "접기 ▲" : "읽기 ▼"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </>
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