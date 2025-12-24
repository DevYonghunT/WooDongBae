"use client";

import { useEffect, useState } from "react";
import { X, Bell, Trash2, Calendar, FolderOpen, BellRing } from "lucide-react";
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

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray: Uint8Array<ArrayBuffer> = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationModal({ isOpen, onClose, userId }: NotificationModalProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const supabase = createClient();
    const { openModal } = useLoginModal();

    // 1. 알림 목록 불러오기 & 구독 상태 확인
    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();
            checkSubscription();
        }
    }, [isOpen, userId]);

    // 구독 상태 확인
    const checkSubscription = async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setIsSubscribed(!!sub);
        } catch (e) {
            console.error("구독 상태 확인 실패:", e);
        }
    };

    const [statusMessage, setStatusMessage] = useState<string>("");

    // SW Ready Timeout Wrapper
    const waitForServiceWorker = async (timeoutMs = 5000) => {
        if (!('serviceWorker' in navigator)) throw new Error("Service Worker not supported");

        const readyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise<ServiceWorkerRegistration>((_, reject) =>
            setTimeout(() => reject(new Error("Service Worker readiness timed out")), timeoutMs)
        );

        return Promise.race([readyPromise, timeoutPromise]);
    };

    // 알림 구독 핸들러
    const handleSubscribe = async () => {
        if (!userId) {
            alert("로그인이 필요합니다.");
            return;
        }
        if (loading) return; // 중복 클릭 방지

        setLoading(true);
        setStatusMessage("알림 권한을 확인하고 있습니다...");

        try {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                throw new Error("이 브라우저는 푸시 알림을 지원하지 않습니다.");
            }

            // 1. 권한 확인 및 요청
            let permission = Notification.permission;
            console.log("[Push] Current permission:", permission);

            if (permission === 'denied') {
                setStatusMessage("알림 권한이 차단되어 있습니다.");
                alert("브라우저 설정에서 알림 권한을 '허용'으로 변경해주세요.");
                setLoading(false);
                return;
            }

            if (permission === 'default') {
                setStatusMessage("알림 권한 허용을 요청하는 중...");
                permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    setStatusMessage("알림 권한이 거부되었습니다.");
                    setLoading(false);
                    return;
                }
            }

            // 2. 서비스 워커 확인 및 등록
            setStatusMessage("서비스 워커를 준비하고 있습니다...");

            let reg = await navigator.serviceWorker.getRegistration();
            if (!reg) {
                console.log("[Push] No registration found, registering sw.js...");
                reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            }

            const registration = await waitForServiceWorker(5000).catch(err => {
                console.error("[Push] SW Ready Timeout:", err);
                // 타임아웃 시 한 번 더 시도하거나 안내
                if (reg?.active) return reg; // 이미 active면 반환
                throw new Error("서비스 워커 준비가 늦어지고 있습니다. 새로고침 후 다시 시도해주세요.");
            });

            console.log("[Push] SW Ready:", registration);

            if (!registration.active) {
                throw new Error("서비스 워커가 활성화되지 않았습니다. 잠시 후 다시 시도해주세요.");
            }

            // 3. 기존 구독 확인
            setStatusMessage("구독 정보를 확인하고 있습니다...");
            let subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                console.log("[Push] Found existing subscription:", subscription);
                setStatusMessage("이미 알림이 활성화되어 있습니다.");
                setIsSubscribed(true);
                // DB 싱크를 위해 넘어가거나 종료 (여기서는 DB 싱크까지 수행)
            } else {
                // 4. 새 구독 생성
                setStatusMessage("서버에 알림을 구독하는 중...");
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidKey) throw new Error("VAPID 공개키가 설정되지 않았습니다.");

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey.trim())
                });
            }

            // 5. 서버에 저장 (Upsert)
            setStatusMessage("구독 정보를 서버에 저장하는 중...");
            const { error } = await supabase.from('push_subscriptions').upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                keys: subscription.toJSON().keys
            });

            if (error) {
                console.error("DB 저장 실패:", error);
                throw new Error(`서버 저장 실패: ${error.message}`);
            }

            console.log("[Push] Subscription success");
            setStatusMessage("");
            setIsSubscribed(true);
            alert("푸시 알림이 성공적으로 활성화되었습니다! 🍊");

        } catch (e: any) {
            console.error("[Push Error]", e);
            setStatusMessage(`오류: ${e.message}`);
            alert(`알림 설정 실패: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

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
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 알림 권한/설정 바 */}
                {!isSubscribed && (
                    <div className="px-5 py-3 bg-orange-50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-orange-700 font-medium">실시간 푸시 알림 받기</span>
                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className={`bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${loading ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        처리중
                                    </>
                                ) : (
                                    <>
                                        <BellRing className="w-3 h-3" />
                                        알림 켜기
                                    </>
                                )}
                            </button>
                        </div>
                        {statusMessage && (
                            <p className="text-[10px] text-orange-600 animate-pulse font-medium">
                                {statusMessage}
                            </p>
                        )}
                    </div>
                )}

                {/* 목록 Header Actions */}
                <div className="px-5 py-2 flex justify-end">
                    <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-gray-500 hover:text-orange-600 underline underline-offset-2"
                    >
                        모두 읽음
                    </button>
                </div>

                {/* 목록 */}
                <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2 bg-gray-50/30">
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
