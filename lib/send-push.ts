import webPush from 'web-push';

// VAPID 키 설정 (환경변수에서 가져옴)
webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
    subscription: any,
    title: string,
    body: string,
    url: string = '/'
) {
    try {
        const payload = JSON.stringify({
            title: title,
            body: body,
            url: url
        });

        await webPush.sendNotification(subscription, payload);
        return { success: true };
    } catch (error: any) {
        // 구독이 만료되었거나 취소된 경우 (410 Gone)
        if (error.statusCode === 410 || error.statusCode === 404) {
            return { success: false, status: 'gone' };
        }
        console.error("❌ 푸시 발송 실패:", error);
        return { success: false, status: 'error' };
    }
}