import webPush from 'web-push';

const DEFAULT_VAPID_SUBJECT = 'mailto:notifications@woodongbae.local';

const rawVapidSubject = (process.env.VAPID_SUBJECT ?? process.env.NEXT_PUBLIC_VAPID_SUBJECT ?? '').trim();
const vapidSubject = rawVapidSubject
    ? (rawVapidSubject.startsWith('mailto:') || rawVapidSubject.startsWith('http://') || rawVapidSubject.startsWith('https://')
        ? rawVapidSubject
        : `mailto:${rawVapidSubject}`)
    : DEFAULT_VAPID_SUBJECT;

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID 키가 설정되어 있지 않습니다. VAPID_PUBLIC/PRIVATE_KEY 환경 변수를 확인하세요.');
}

webPush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey,
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