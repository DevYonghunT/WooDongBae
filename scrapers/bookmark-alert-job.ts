import { createClient } from '@supabase/supabase-js';
// [수정 1] 파일 확장자 .ts를 명시적으로 붙여줌
import { sendPushNotification } from '../lib/send-push.ts';
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

export async function runBookmarkAlertJob() {
    console.log("❤️ [찜 알림] 찜한 강좌 일정 체크 중...");

    // 1. 찜 목록 조회
    const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select(`
            user_id,
            courses (
                id, title, apply_date, status
            )
        `);

    if (error || !bookmarks) {
        console.error("   ❌ 찜 목록 조회 실패:", error);
        return;
    }

    const getDates = (dateStr: string) => {
        if (!dateStr || !dateStr.includes('~')) return null;
        const [start, end] = dateStr.split('~').map(s => s.trim().replace(/\./g, '-'));
        return { start: new Date(start), end: new Date(end) };
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let sentCount = 0;

    for (const item of bookmarks) {
        // [수정 2] Supabase가 배열로 반환한 데이터를 단일 객체로 꺼냄
        // item.courses가 배열일 수도 있고 객체일 수도 있으므로 안전하게 처리
        const courseData = item.courses;
        // @ts-ignore (타입 추론 에러 방지용 강제 캐스팅)
        const course = Array.isArray(courseData) ? courseData[0] : courseData;

        if (!course || !course.apply_date) continue;

        const dates = getDates(course.apply_date);
        if (!dates) continue;

        let title = "";
        let body = "";
        let shouldSend = false;

        // [Case A] 접수 시작 하루 전
        if (dates.start.getTime() === tomorrow.getTime()) {
            title = "⏰ 내일 접수 시작! 놓치지 마세요";
            body = `'${course.title}' 접수가 내일 시작됩니다.`;
            shouldSend = true;
        }
        // [Case B] 접수 시작 당일
        else if (dates.start.getTime() === today.getTime()) {
            title = "🚀 오늘 접수 시작! 지금 신청하세요";
            body = `'${course.title}' 접수가 시작되었습니다!`;
            shouldSend = true;
        }
        // [Case C] 접수 마감 당일
        else if (dates.end.getTime() === today.getTime()) {
            title = "⏳ 오늘 마감! 마지막 기회예요";
            body = `'${course.title}' 접수가 오늘 마감됩니다.`;
            shouldSend = true;
        }

        if (shouldSend) {
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', item.user_id);

            if (subs && subs.length > 0) {
                for (const sub of subs) {
                    const pushConfig = { endpoint: sub.endpoint, keys: sub.keys };
                    const url = `https://woodongbae.xyz/courses/${course.id}`;

                    const result = await sendPushNotification(pushConfig, title, body, url);
                    if (result.success) sentCount++;
                }
            }
        }
    }

    console.log(`✨ [찜 알림] 총 ${sentCount}건의 리마인더를 발송했습니다.`);
}