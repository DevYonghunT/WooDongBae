import webPush from 'web-push';

const rawVapidSubject = (process.env.VAPID_SUBJECT ?? process.env.NEXT_PUBLIC_VAPID_SUBJECT ?? '').trim();
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

let isPushEnabled = false;
let disableReason = '';

// 1. 필수 환경변수 및 Subject 포맷 검증
if (!vapidPublicKey || !vapidPrivateKey) {
    disableReason = `VAPID keys are missing. Public=${!!vapidPublicKey}, Private=${!!vapidPrivateKey}`;
} else if (!rawVapidSubject || !(rawVapidSubject.startsWith('mailto:') || rawVapidSubject.startsWith('https://'))) {
    disableReason = `VAPID_SUBJECT is invalid. Must start with 'mailto:' or 'https://'. Current: "${rawVapidSubject}"`;
} else {
    // 2. 설정이 유효하면 VAPID 세부 정보 설정
    try {
        webPush.setVapidDetails(
            rawVapidSubject,
            vapidPublicKey,
            vapidPrivateKey,
        );
        isPushEnabled = true;
        console.log("✅ Web Push Initialized with Subject:", rawVapidSubject);
    } catch (e: any) {
        disableReason = `Failed to set VAPID details: ${e.message}`;
    }
}

if (!isPushEnabled) {
    console.warn(`⚠️ Push Notifications are DISABLED. Reason: ${disableReason}`);
}

export async function sendPushNotification(
    subscription: any,
    title: string,
    body: string,
    url: string = '/'
) {
    if (!isPushEnabled) {
        console.warn(`🚫 Push skipped (Disabled). Reason: ${disableReason}`);
        return { success: false, status: 'disabled', reason: disableReason };
    }

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
        return { success: false, status: 'error', error };
    }
}