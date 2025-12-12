import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// import { sendNotificationSMS } from '../lib/send-sms.js'; // 기존 유지 (실제 파일유무 확인필요)
import { sendPushNotification } from '../lib/send-push.ts'; // 👈 [추가]

// 환경변수 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function runAlertJob() {
    console.log("🔔 [알림] 키워드 매칭 및 발송 시작...");

    // 1. 알림 신청자 목록 가져오기
    const { data: alerts } = await supabase.from('keyword_alerts').select('*');
    if (!alerts || alerts.length === 0) {
        console.log("   - 알림 신청자가 없습니다.");
        return;
    }

    // 2. 오늘 등록된 강좌 가져오기 (최근 24시간)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: newCourses } = await supabase
        .from('courses')
        .select('*')
        .gte('created_at', yesterday.toISOString());

    if (!newCourses || newCourses.length === 0) {
        console.log("   - 오늘 새로 등록된 강좌가 없습니다.");
        return;
    }

    console.log(`   - 신청자: ${alerts.length}명, 신규 강좌: ${newCourses.length}개`);

    // 3. 매칭 및 발송
    let sentCount = 0;

    for (const alert of alerts) {
        // 키워드가 포함된 강좌 찾기
        const matchedCourses = newCourses.filter(course =>
            course.title.includes(alert.keyword) ||
            course.category.includes(alert.keyword)
        );

        if (matchedCourses.length > 0) {
            console.log(`   📩 ${alert.email}님에게 '${alert.keyword}' 알림 발송 중...`);

            // 이메일 내용 생성 (간단 버전)
            const htmlContent = `
                <h1>'${alert.keyword}' 강좌가 떴어요! 🎉</h1>
                ${matchedCourses.map(c => `<p><strong>${c.title}</strong> (${c.institution})</p>`).join('')}
                <p><a href="https://woodongbae.xyz">우동배에서 확인하기</a></p>
            `;

            await resend.emails.send({
                from: 'onboarding@resend.dev', // 테스트용 (본인인증 전)
                to: alert.email, // 테스트 시에는 가입한 본인 이메일로만 발송됨
                subject: `[우동배] '${alert.keyword}' 새 강좌 알림`,
                html: htmlContent
            });
            sentCount++;
        }
    }

    console.log(`✨ [알림] 총 ${sentCount}건의 알림 메일을 보냈습니다.`);

    // ==========================================
    // [Part B] 웹 푸시 알림 (전체 구독자)
    // ==========================================
    console.log("   🚀 웹 푸시 알림 발송 시작...");

    // 1. 구독자 목록 가져오기
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*');

    if (subscriptions && subscriptions.length > 0) {
        let pushCount = 0;
        let deleteCount = 0;

        for (const sub of subscriptions) {
            // 알림 보낼 내용 구성
            const title = `새로운 강좌 ${newCourses.length}개가 떴어요! 🍊`;
            const body = `${newCourses[0].title} 외 ${newCourses.length - 1}건이 등록되었습니다.`;

            // 저장된 JSON 키를 객체로 변환
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };

            const result = await sendPushNotification(pushConfig, title, body, '/');

            if (result.success) {
                pushCount++;
            } else if (result.status === 'gone') {
                // 더 이상 유효하지 않은 구독(알림 차단 등)은 DB에서 삭제
                await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                deleteCount++;
            }
        }
        console.log(`   ✨ 푸시 결과: 성공 ${pushCount}건 / 삭제(차단) ${deleteCount}건`);
    } else {
        console.log("   - 푸시 구독자가 없습니다.");
    }
}