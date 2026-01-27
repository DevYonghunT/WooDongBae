"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Heart,
    HeartOff,
    Bell,
    BellOff,
    MessageSquare,
    FileText,
    LogIn,
    Edit,
    Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface ActivityLog {
    id: string;
    user_id: string;
    action_type: string;
    target_type?: string;
    target_id?: string;
    description?: string;
    metadata?: any;
    created_at: string;
}

interface ActivityTimelineProps {
    userId: string;
    initialLogs: ActivityLog[];
}

export default function ActivityTimeline({ userId, initialLogs }: ActivityTimelineProps) {
    const supabase = createClient();
    const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialLogs.length === 20);

    // 활동 타입별 아이콘 및 레이블
    const getActivityInfo = (log: ActivityLog) => {
        switch (log.action_type) {
            case "login":
                return {
                    icon: <LogIn className="w-5 h-5" />,
                    color: "text-blue-500",
                    bgColor: "bg-blue-50",
                    label: "로그인",
                    description: log.description || "서비스에 로그인했습니다.",
                };
            case "bookmark_add":
                return {
                    icon: <Heart className="w-5 h-5" />,
                    color: "text-red-500",
                    bgColor: "bg-red-50",
                    label: "찜 추가",
                    description: log.description || "강좌를 찜했습니다.",
                };
            case "bookmark_remove":
                return {
                    icon: <HeartOff className="w-5 h-5" />,
                    color: "text-stone-400",
                    bgColor: "bg-stone-50",
                    label: "찜 취소",
                    description: log.description || "찜을 취소했습니다.",
                };
            case "keyword_add":
                return {
                    icon: <Bell className="w-5 h-5" />,
                    color: "text-green-500",
                    bgColor: "bg-green-50",
                    label: "키워드 등록",
                    description: log.description || "알림 키워드를 등록했습니다.",
                };
            case "keyword_remove":
                return {
                    icon: <BellOff className="w-5 h-5" />,
                    color: "text-stone-400",
                    bgColor: "bg-stone-50",
                    label: "키워드 삭제",
                    description: log.description || "알림 키워드를 삭제했습니다.",
                };
            case "post_create":
                return {
                    icon: <FileText className="w-5 h-5" />,
                    color: "text-purple-500",
                    bgColor: "bg-purple-50",
                    label: "게시글 작성",
                    description: log.description || "커뮤니티에 글을 작성했습니다.",
                };
            case "comment_create":
                return {
                    icon: <MessageSquare className="w-5 h-5" />,
                    color: "text-orange-500",
                    bgColor: "bg-orange-50",
                    label: "댓글 작성",
                    description: log.description || "댓글을 작성했습니다.",
                };
            case "profile_update":
                return {
                    icon: <Edit className="w-5 h-5" />,
                    color: "text-indigo-500",
                    bgColor: "bg-indigo-50",
                    label: "프로필 수정",
                    description: log.description || "프로필을 수정했습니다.",
                };
            default:
                return {
                    icon: <FileText className="w-5 h-5" />,
                    color: "text-stone-400",
                    bgColor: "bg-stone-50",
                    label: log.action_type,
                    description: log.description || "활동이 기록되었습니다.",
                };
        }
    };

    // 날짜별 그룹화
    const groupedLogs = logs.reduce((acc, log) => {
        const date = format(new Date(log.created_at), "yyyy년 MM월 dd일", { locale: ko });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(log);
        return acc;
    }, {} as Record<string, ActivityLog[]>);

    // 더 불러오기
    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const lastLog = logs[logs.length - 1];
            const { data, error } = await supabase
                .from("activity_logs")
                .select("*")
                .eq("user_id", userId)
                .lt("created_at", lastLog.created_at)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;

            if (data && data.length > 0) {
                setLogs([...logs, ...data]);
                setHasMore(data.length === 20);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("[Load More Error]", err);
        } finally {
            setLoading(false);
        }
    };

    // 스크롤 이벤트로 자동 로드
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >=
                    document.documentElement.scrollHeight - 500 &&
                !loading &&
                hasMore
            ) {
                loadMore();
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loading, hasMore, logs]);

    if (logs.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-100 text-center">
                <p className="text-stone-400">아직 활동 내역이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                <div key={date}>
                    {/* 날짜 헤더 */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="text-sm font-bold text-stone-700">{date}</div>
                        <div className="flex-1 h-px bg-stone-200"></div>
                    </div>

                    {/* 타임라인 */}
                    <div className="relative pl-8 space-y-4">
                        {/* 타임라인 세로선 */}
                        <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-stone-200"></div>

                        {dateLogs.map((log, index) => {
                            const info = getActivityInfo(log);
                            return (
                                <div key={log.id} className="relative">
                                    {/* 타임라인 점 */}
                                    <div
                                        className={`absolute -left-[1.8rem] top-1.5 w-5 h-5 rounded-full ${info.bgColor} ${info.color} flex items-center justify-center border-2 border-white shadow-sm`}
                                    >
                                        {info.icon}
                                    </div>

                                    {/* 활동 카드 */}
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-stone-800">
                                                        {info.label}
                                                    </span>
                                                    <span className="text-xs text-stone-400">
                                                        {formatDistanceToNow(
                                                            new Date(log.created_at),
                                                            {
                                                                addSuffix: true,
                                                                locale: ko,
                                                            }
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-stone-600">
                                                    {info.description}
                                                </p>

                                                {/* 메타데이터 표시 */}
                                                {log.metadata && (
                                                    <div className="mt-2 text-xs text-stone-400">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* 로딩 인디케이터 */}
            {loading && (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
            )}

            {/* 더 이상 없음 */}
            {!hasMore && logs.length > 0 && (
                <div className="text-center py-8">
                    <p className="text-sm text-stone-400">모든 활동 내역을 확인했습니다.</p>
                </div>
            )}
        </div>
    );
}
