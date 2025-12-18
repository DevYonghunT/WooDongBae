import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 환경 변수 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

console.log(`📂 환경변수 로드: ${envPath}`);
dotenv.config({ path: envPath });

// 2. 알림 로직 실행
async function main() {
    try {
        console.log("🚀 찜 알림 테스트 모듈 시작...");
        // 환경변수 로드 후 임포트 (동적 임포트)
        const { runBookmarkAlertJob } = await import('./bookmark-alert-job.ts');
        
        await runBookmarkAlertJob();
        
    } catch (error) {
        console.error("❌ 실행 중 오류 발생:", error);
    }
}

main();