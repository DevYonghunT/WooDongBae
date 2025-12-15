"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
// 👇 상대 경로로 수정하여 안전하게 가져옵니다
import { useLoginModal } from "../store/useLoginModal";

// 👇 [변경] 공통 클라이언트 사용 (쿠키 공유됨)
const supabase = createClient();

export default function PushNotificationButton() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const { openModal } = useLoginModal(); // 로그인 모달 제어

    // VAPID 키 변환 헬퍼 함수
    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const handleSubscribe = async () => {
        // 1. 로그인 체크 (로그인 안 했으면 모달 띄우고 중단)
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            openModal("새로운 강좌 알림을 받으려면\n로그인이 필요해요! 🔔");
            return;
        }

        setLoading(true);
        try {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                alert("이 브라우저는 푸시 알림을 지원하지 않습니다.");
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                alert("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.");
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
            });

            // DB 저장 (user.id 포함)
            const { error } = await supabase.from("push_subscriptions").insert({
                endpoint: subscription.endpoint,
                keys: subscription.toJSON().keys,
                user_id: user.id, // 로그인한 유저 ID 저장
            });

            if (error) {
                if (error.code !== "23505") throw error; // 중복 에러는 무시
            }

            setIsSubscribed(true);
            alert("알림 설정이 완료되었습니다! 🔔");

        } catch (error) {
            console.error("알림 설정 실패:", error);
            alert("알림 설정 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscribe}
            disabled={loading || isSubscribed}
            // 👇 이 부분(스타일)이 복구되었습니다!
            className={`fixed top-20 right-4 z-40 p-3 rounded-full shadow-lg transition-all active:scale-95 ${isSubscribed
                ? "bg-gray-100 text-gray-400 cursor-default"
                : "bg-white text-orange-500 hover:bg-orange-50 border border-orange-100 animate-in fade-in zoom-in"
                }`}
        >
            <BellRing className={`w-6 h-6 ${isSubscribed ? "" : "animate-pulse"}`} />
        </button>
    );
}