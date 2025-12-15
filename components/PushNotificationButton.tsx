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

    // [추가] 모달 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userId, setUserId] = useState<string | undefined>(undefined);

    const { openModal } = useLoginModal(); // 로그인 모달 제어

    // [추가] 초기 로드시 유저 정보 확인
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
        return user;
    };

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
        // [수정] 모달 열기 로직으로 변경됨.
        // 하지만 만약 "알림 허용" 버튼 클릭 시 구독 로직이 필요하다면 아래 함수를 재활용하거나
        // 모달 내부로 이동해야 함. 요청사항은 "알림 버튼 클릭 -> 모달 열기 + 리스트 갱신" 이므로 
        // 여기서는 toggleModal만 수행하고, 기존 구독 로직은 별도 함수로 분리하거나 모달 내에서 처리.
        // **사용자 경험상**: 종 모양 누르면 -> 알림 센터가 뜨는게 맞음.

        const user = await checkUser();
        if (!user) {
            openModal("알림을 확인하려면 로그인이 필요해요! 🔔");
            return;
        }
        setIsModalOpen(true);
    };

    // (기존 구독 로직은 모달 내부 혹은 별도 트리거로 옮기는 게 좋지만, 
    // 일단 사용자가 'Permission' 로직을 원했으므로 보존해둠. 
    // 단, 메인 버튼 클릭은 이제 모달 열기로 변경)

    // 알림 구독 요청 (필요 시 호출)
    const requestPermission = async () => {
        const user = await checkUser();
        if (!user) return;

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

            const { error } = await supabase.from("push_subscriptions").insert({
                endpoint: subscription.endpoint,
                keys: subscription.toJSON().keys,
                user_id: user.id,
            });

            if (error && error.code !== "23505") throw error;

            setIsSubscribed(true);
            alert("알림 설정이 완료되었습니다! 🔔");

        } catch (error) {
            console.error("알림 설정 실패:", error);
            alert("알림 설정 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // NotificationModal을 동적 import 하거나 상단에서 import
    const NotificationModal = require("./NotificationModal").default; // require 사용 safe resolve

    return (
        <>
            <button
                onClick={handleSubscribe} // 이제 모달 열기
                disabled={loading}
                className={`fixed top-20 right-4 z-40 p-3 rounded-full shadow-lg transition-all active:scale-95 bg-white text-orange-500 hover:bg-orange-50 border border-orange-100 animate-in fade-in zoom-in`}
            >
                {/* 읽지 않은 알림 뱃지 표시 로직 추가 가능 */}
                <BellRing className="w-6 h-6" />
            </button>

            {/* 모달 렌더링 */}
            {isModalOpen && userId && (
                <NotificationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userId={userId}
                />
            )}
        </>
    );
}