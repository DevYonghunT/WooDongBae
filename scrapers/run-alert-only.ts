import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 환경 변수 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

console.log(`📂 환경변수 로드 경로: ${envPath}`);
const result = dotenv.config({ path: envPath });

// 2. 키 값 상태 점검 (디버깅)
console.log("-----------------------------------------");
console.log("🔑 환경변수 상태 점검:");
console.log("1. VAPID_SUBJECT:", process.env.VAPID_SUBJECT ? `✅ 확인됨 (${process.env.VAPID_SUBJECT})` : "❌ 없음 (비어있음)");
console.log("2. PUBLIC_KEY:", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "✅ 확인됨" : "❌ 없음");
console.log("3. PRIVATE_KEY:", process.env.VAPID_PRIVATE_KEY ? "✅ 확인됨" : "❌ 없음");
console.log("-----------------------------------------");

// 3. 필수 키 누락 시 중단
if (!process.env.VAPID_SUBJECT || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error("🚨 에러: 필수 VAPID 키가 누락되었습니다.");
    console.error("👉 .env.local 파일을 열어서 위 3가지 키가 모두 있는지, 오타는 없는지 확인해주세요.");
    process.exit(1);
}

// 4. 모듈 실행 (키가 있을 때만)
async function main() {
    try {
        console.log("🚀 알림 모듈 불러오는 중...");
        // 환경변수 확인 후 임포트하므로 안전함
        const { runAlertJob } = await import('./alert-job.ts');
        await runAlertJob();
    } catch (error) {
        console.error("❌ 실행 중 오류 발생:", error);
    }
}

main();