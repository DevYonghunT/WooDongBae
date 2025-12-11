import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
}