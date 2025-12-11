import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 환경변수 파일 경로 찾기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

console.log(`📂 환경변수 읽는 위치: ${envPath}`);

// 2. 환경변수 로드
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("❌ .env.local 파일을 찾을 수 없습니다! 파일명을 확인해주세요.");
} else {
    console.log("✅ 환경변수 파일 로드 성공");

    // [디버깅] 로드된 키 이름만 출력 (값은 보안상 숨김)
    const keys = Object.keys(process.env).filter(k => k.includes('RESEND'));
    console.log("🔑 'RESEND'가 포함된 키 목록:", keys);
}

// 3. 키 확인
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    console.error("\n🚨 치명적 에러: RESEND_API_KEY가 비어있습니다!");
    console.error("👉 .env.local 파일을 열어서 오타가 없는지 확인해주세요.");
    console.error("   (예시: RESEND_API_KEY=re_1234...)");
    process.exit(1);
}

const resend = new Resend(apiKey);

async function sendTest() {
    console.log("\n📧 테스트 이메일 발송 시도...");

    const MY_EMAIL = "devyongt@gmail.com"; // 본인 이메일

    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: MY_EMAIL,
            subject: '[우동배] 알림 기능 테스트 메일 🍊',
            html: `
                <h1>🎉 메일이 잘 도착했습니다!</h1>
                <p>Resend API 설정이 완벽하네요.</p>
            `
        });

        if (error) {
            console.error("❌ 발송 실패 (Resend 에러):", error);
        } else {
            console.log("✅ 발송 성공! 메일함을 확인해주세요.");
            console.log("   ID:", data?.id);
        }
    } catch (e) {
        console.error("❌ 실행 중 에러 발생:", e);
    }
}

sendTest();