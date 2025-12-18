import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendPushNotification } from '../lib/send-push.ts';

// 환경변수 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase Admin 클라이언트 (유저 이메일 조회용)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

interface UserKeyword {
    user_id: string;
    word: string;
}

export async function runAlertJob() {
    // 설정 로드
    const TEST_USER_ID = process.env.ALERT_TEST_USER_ID || process.env.TEST_USER_ID;
    const DRY_RUN = process.env.ALERT_DRY_RUN === 'true';

    console.log("🔔 [알림] 키워드 매칭 및 발송 시작...");
    if (TEST_USER_ID) console.log(`   🚧 TEST MODE: 사용자 ID '${TEST_USER_ID}'에게만 발송합니다.`);
    if (DRY_RUN) console.log(`   🧪 DRY RUN: 실제 발송하지 않고 로그만 출력합니다.`);

    // 1. 최근 24시간 내 등록된 신규 강좌 가져오기
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: newCourses } = await supabase
        .from('courses')
        .select('*')
        .gte('created_at', yesterday.toISOString());

    if (!newCourses || newCourses.length === 0) {
        console.log("   - 오늘 새로 등록된 강좌가 없습니다. 알림 잡을 종료합니다.");
        return;
    }
    console.log(`   - 신규 강좌: ${newCourses.length}개 발견`);

    // 2. 전체 키워드 목록 가져오기
    let query = supabase.from('keywords').select('user_id, word');
    if (TEST_USER_ID) {
        query = query.eq('user_id', TEST_USER_ID);
    }

    const { data: allKeywords } = await query;

    if (!allKeywords || allKeywords.length === 0) {
        console.log("   - 등록된 키워드가 없습니다.");
        return;
    }

    // 3. 사용자별로 키워드 그룹화
    // Map<user_id, keywords[]>
    const userKeywordsMap = new Map<string, string[]>();
    allKeywords.forEach((k: unknown) => {
        const item = k as UserKeyword; // 명시적 타입 단언
        if (!userKeywordsMap.has(item.user_id)) {
            userKeywordsMap.set(item.user_id, []);
        }
        userKeywordsMap.get(item.user_id)?.push(item.word);
    });

    console.log(`   - 알림 대상 사용자: ${userKeywordsMap.size}명`);

    // 4. 각 사용자별 매칭 및 발송
    let emailSentCount = 0;
    let pushSentCount = 0;

    for (const [userId, keywords] of userKeywordsMap.entries()) {
        // (A) 키워드 매칭되는 강좌 찾기
        const matchedCourses = newCourses.filter(course =>
            keywords.some(k => course.title.includes(k) || course.category.includes(k))
        );

        if (matchedCourses.length === 0) continue;

        console.log(`   👤 User(${userId}) 매칭된 강좌: ${matchedCourses.length}개 (키워드: ${keywords.join(', ')})`);

        // (B) 이메일 발송
        try {
            const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

            if (user && user.email) {
                if (DRY_RUN) {
                    console.log(`      [DRY RUN] 이메일 발송 스킵: ${user.email} (제목: '${matchedCourses[0].title}' 외...)`);
                } else {
                    const htmlContent = `
                        <h1>키워드 알림이 도착했어요! 🎉</h1>
                        <p>등록하신 키워드 <strong>[${keywords.join(', ')}]</strong>에 해당하는 새 강좌가 있습니다.</p>
                        <hr />
                        ${matchedCourses.map(c => `
                            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
                                <h3 style="margin: 0 0 5px 0;">${c.title}</h3>
                                <p style="margin: 0; color: #666;">${c.institution} | ${c.status}</p>
                            </div>
                        `).join('')}
                        <p><a href="https://woodongbae.xyz" style="display: inline-block; padding: 10px 20px; background-color: #f97316; color: white; text-decoration: none; border-radius: 5px;">우동배에서 확인하기</a></p>
                    `;

                    await resend.emails.send({
                        from: 'onboarding@resend.dev',
                        to: user.email,
                        subject: `[우동배] '${matchedCourses[0].title}' 외 ${matchedCourses.length - 1}건의 새 강좌 알림`,
                        html: htmlContent
                    });
                    console.log(`      📩 이메일 발송 성공: ${user.email}`);
                    emailSentCount++;
                }
            } else {
                console.log(`      ⚠️ 이메일 정보를 찾을 수 없음 (User ID match fail)`);
            }
        } catch (e) {
            console.error(`      ❌ 이메일 발송 실패:`, e);
        }

        // (C) 푸시 알림 발송 (사용자의 모든 구독 기기에 발송)
        try {
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', userId);

            if (subs && subs.length > 0) {
                const title = `키워드 알림 도착! 🍊`;
                const body = `'${matchedCourses[0].title}' 외 ${matchedCourses.length - 1}건이 등록되었습니다.`;

                for (const sub of subs) {
                    if (DRY_RUN) {
                        console.log(`      [DRY RUN] 푸시 발송 스킵: ${sub.endpoint.slice(0, 30)}...`);
                    } else {
                        const pushConfig = {
                            endpoint: sub.endpoint,
                            keys: sub.keys
                        };
                        const result = await sendPushNotification(pushConfig, title, body, '/');

                        if (result.success) {
                            pushSentCount++;
                        } else if (result.status === 'gone') {
                            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                            console.log(`      🗑️ 만료된 푸시 구독 삭제`);
                        }
                    }
                }
                if (!DRY_RUN) console.log(`      🚀 푸시 발송 시도 완료 (${subs.length}개 기기)`);
            }
        } catch (e) {
            console.error(`      ❌ 푸시 발송 실패:`, e);
        }
    }

    console.log(`✨ [알림 완료] 이메일: ${emailSentCount}명, 푸시: ${pushSentCount}건 성공 ${DRY_RUN ? '(DRY RUN)' : ''}`);
}