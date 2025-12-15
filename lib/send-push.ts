import webPush from 'web-push';

const subject =
    (process.env.VAPID_SUBJECT ??
        process.env.NEXT_PUBLIC_VAPID_SUBJECT ??
        process.env.DEFAULT_VAPID_SUBJECT ??
        "").trim();

const publicKey =
    (process.env.VAPID_PUBLIC_KEY ??
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
        "").trim();

const privateKey = (process.env.VAPID_PRIVATE_KEY ?? "").trim();

let isPushEnabled = false;
let disableReason = '';

if (!subject || !publicKey || !privateKey) {
    disableReason = `Missing env vars. Subject=${!!subject}, Public=${!!publicKey}, Private=${!!privateKey}`;
    console.warn("[web-push] missing env -> push disabled", {
        subject: !!subject,
        publicKey: !!publicKey,
        privateKey: !!privateKey,
    });
} else {
    webPush.setVapidDetails(subject, publicKey, privateKey);
    isPushEnabled = true;
    console.log("✅ Web Push Initialized with Subject:", subject);
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