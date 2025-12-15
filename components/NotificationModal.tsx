"use client";

import { useEffect, useState } from "react";
import { X, Bell, Trash2, Calendar, FolderOpen } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useLoginModal } from "@/store/useLoginModal"; // 로그인 안했으면 모달 띄우기 위해

// Notification 타입 (Supabase 테이블과 일치)
interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string; // 로그인한 유저 ID
}

export default function NotificationModal({ isOpen, onClose, userId }: NotificationModalProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const { openModal } = useLoginModal();

    // 1. 알림 목록 불러오기
    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();
        }
    }, [isOpen, userId]);

    const fetchNotifications = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("notifications") // 테이블명이 'notifications'라고 가정
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) {
                // 테이블이 없을 수도 있으니 에러 로그만 찍고 무시 (생략)
                console.error("알림 fetch 실패:", error.message || JSON.stringify(error));
                return;
            }
            if (data) setNotifications(data);
        } catch (error) {
            console.error("알림 로드 중 에러:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. 읽음 처리 (전체)
    const handleMarkAllRead = async () => {
        if (!userId) return;
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (!error) {
            // 로컬 상태 업데이트
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    // 3. 알림 삭제
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("삭제하시겠습니까?")) return;

        const { error } = await supabase.from("notifications").delete().eq("id", id);
        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-end sm:items-start p-4 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}>
            {/* 모달 본문 */}
            <div
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden mt-16 animate-in slide-in-from-right-10 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-500 fill-orange-500" />
                        <h2 className="text-lg font-bold text-gray-800">알림 센터</h2>
                        <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            {notifications.filter(n => !n.is_read).length}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-gray-500 hover:text-orange-600 underline underline-offset-2"
                        >
                            모두 읽음
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 목록 */}
                <div className="max-h-[70vh] overflow-y-auto p-2 space-y-2 bg-gray-50/30">
                    {loading ? (
                        <div className="py-10 text-center text-gray-400">
                            <span className="loading loading-spinner loading-sm"></span> 불러오는 중...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Bell className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-medium">새로운 알림이 없습니다.</p>
                        </div>
                    ) : (
                        notifications.map((noti) => (
                            <div
                                key={noti.id}
                                className={`relative group p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${noti.is_read ? "bg-white border-gray-100 opacity-60 hover:opacity-100" : "bg-white border-orange-100 shadow-sm"
                                    }`}
                                onClick={() => {
                                    if (noti.link) window.location.href = noti.link;
                                }}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-bold mb-1 ${noti.is_read ? 'text-gray-600' : 'text-gray-900'}`}>{noti.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{noti.message}</p>
                                        <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(noti.created_at), "M월 d일 a h:mm", { locale: ko })}
                                        </div>
                                    </div>
                                    {!noti.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                    )}
                                </div>

                                {/* 삭제 버튼 (hover 시 등장) */}
                                <button
                                    onClick={(e) => handleDelete(noti.id, e)}
                                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
