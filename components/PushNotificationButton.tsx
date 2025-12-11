"use client";

import { useState, useEffect } from "react";
import { BellRing } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// 클라이언트 사이드에서만 Supabase 사용
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PushNotificationButton() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

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
        setLoading(true);
        try {
            // 1. 브라우저 지원 확인
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                alert("이 브라우저는 푸시 알림을 지원하지 않습니다.");
                return;
            }

            // 2. 권한 요청
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                alert("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.");
                return;
            }

            // 3. 서비스 워커 등록 확인
            const registration = await navigator.serviceWorker.ready;

            // 4. 구독 정보 생성 (브라우저 -> 구글/애플 서버)
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
            });

            // 5. 내 DB(Supabase)에 저장
            const { error } = await supabase.from("push_subscriptions").insert({
                endpoint: subscription.endpoint,
                keys: subscription.toJSON().keys,
            });

            if (error) {
                if (error.code === "23505") { // 중복 에러 무시
                    console.log("이미 등록된 기기입니다.");
                } else {
                    throw error;
                }
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
            className={`fixed top-20 right-4 z-40 p-3 rounded-full shadow-lg transition-all ${isSubscribed
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-white text-primary-600 hover:bg-primary-50 border border-primary-100"
                }`}
        >
            <BellRing className={`w-5 h-5 ${isSubscribed ? "" : "animate-pulse"}`} />
        </button>
    );
}