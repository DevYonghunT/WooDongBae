import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    type?: string;
    created_at: string;
}

/**
 * Supabase Realtime을 활용한 실시간 알림 구독
 * @param userId 사용자 ID
 * @param onNotification 알림 수신 시 호출될 콜백 함수
 * @returns unsubscribe 함수
 */
export function subscribeToRealtimeNotifications(
    userId: string,
    onNotification: (noti: Notification) => void
): () => void {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    try {
        channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log("[Realtime] New notification:", payload);

                    const newNotification = payload.new as Notification;
                    onNotification(newNotification);

                    // 브라우저 알림 표시
                    showBrowserNotification(newNotification);
                }
            )
            .subscribe((status) => {
                console.log("[Realtime] Subscription status:", status);
            });

        return () => {
            if (channel) {
                console.log("[Realtime] Unsubscribing from notifications");
                supabase.removeChannel(channel);
            }
        };
    } catch (error) {
        console.error("[Realtime] Subscription error:", error);
        return () => {}; // 에러 시 빈 함수 반환
    }
}

/**
 * 브라우저 알림 표시
 * @param notification 알림 객체
 */
function showBrowserNotification(notification: Notification) {
    // 브라우저 알림 권한 확인
    if (typeof window === "undefined" || !("Notification" in window)) {
        console.warn("[Browser Notification] Not supported");
        return;
    }

    if (Notification.permission === "granted") {
        try {
            const notif = new Notification(notification.title, {
                body: notification.message,
                icon: "/icon.png",
                badge: "/icon.png",
                tag: notification.id, // 같은 알림은 중복 표시 방지
                requireInteraction: false, // 자동으로 사라짐
                data: {
                    url: notification.link || "/",
                },
            });

            // 알림 클릭 시 해당 링크로 이동
            notif.onclick = function (event) {
                event.preventDefault();
                window.focus();
                if (notification.link) {
                    window.location.href = notification.link;
                }
                notif.close();
            };

            // 5초 후 자동으로 닫기
            setTimeout(() => {
                notif.close();
            }, 5000);
        } catch (error) {
            console.error("[Browser Notification] Display error:", error);
        }
    } else if (Notification.permission !== "denied") {
        // 권한이 아직 요청되지 않았다면 요청
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                showBrowserNotification(notification);
            }
        });
    }
}

/**
 * 브라우저 알림 권한 요청
 * @returns Promise<NotificationPermission>
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === "undefined" || !("Notification" in window)) {
        console.warn("[Browser Notification] Not supported");
        return "denied";
    }

    if (Notification.permission === "granted") {
        return "granted";
    }

    if (Notification.permission === "denied") {
        return "denied";
    }

    // 권한 요청
    try {
        const permission = await Notification.requestPermission();
        console.log("[Browser Notification] Permission:", permission);
        return permission;
    } catch (error) {
        console.error("[Browser Notification] Permission request error:", error);
        return "denied";
    }
}

/**
 * 알림 읽음 처리
 * @param notificationId 알림 ID
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId);

        if (error) throw error;

        console.log("[Notification] Marked as read:", notificationId);
        return true;
    } catch (error) {
        console.error("[Notification] Mark as read error:", error);
        return false;
    }
}

/**
 * 모든 알림 읽음 처리
 * @param userId 사용자 ID
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) throw error;

        console.log("[Notification] Marked all as read for user:", userId);
        return true;
    } catch (error) {
        console.error("[Notification] Mark all as read error:", error);
        return false;
    }
}

/**
 * 알림 삭제
 * @param notificationId 알림 ID
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", notificationId);

        if (error) throw error;

        console.log("[Notification] Deleted:", notificationId);
        return true;
    } catch (error) {
        console.error("[Notification] Delete error:", error);
        return false;
    }
}

/**
 * 여러 알림 삭제 (벌크 삭제)
 * @param notificationIds 알림 ID 배열
 */
export async function deleteNotifications(notificationIds: string[]): Promise<boolean> {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .in("id", notificationIds);

        if (error) throw error;

        console.log("[Notification] Deleted multiple:", notificationIds.length);
        return true;
    } catch (error) {
        console.error("[Notification] Delete multiple error:", error);
        return false;
    }
}

/**
 * 안읽은 알림 개수 조회
 * @param userId 사용자 ID
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const supabase = createClient();

    try {
        const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) throw error;

        return count || 0;
    } catch (error) {
        console.error("[Notification] Get unread count error:", error);
        return 0;
    }
}
