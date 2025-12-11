import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNotificationEmail(
    toEmail: string,
    keyword: string,
    courses: any[]
) {
    try {
        const { data, error } = await resend.emails.send({
            from: '우동배 <onboarding@resend.dev>', // 도메인 인증 전에는 이 주소만 사용 가능
            to: [toEmail],
            subject: `🔔 [우동배] '${keyword}' 관련 새 강좌가 등록되었습니다!`,
            html: `
                <h1>'${keyword}' 알림 도착! 🍊</h1>
                <p>기다리시던 <strong>${keyword}</strong> 관련 강좌가 새로 등록되었습니다.</p>
                
                <div style="margin-top: 20px;">
                    ${courses.map(c => `
                        <div style="border: 1px solid #eee; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                            <h3 style="margin: 0 0 5px 0;">${c.title}</h3>
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                ${c.institution} | ${c.status}
                            </p>
                            <a href="https://woodongbae.xyz/courses/${c.id}" style="display: inline-block; margin-top: 10px; color: #f97316; text-decoration: none; font-weight: bold;">
                                자세히 보기 &rarr;
                            </a>
                        </div>
                    `).join('')}
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #999; font-size: 12px;">우동배 - 우리 동네 배움터</p>
            `,
        });

        if (error) {
            console.error("이메일 발송 실패:", error);
            return false;
        }

        return true;
    } catch (e) {
        console.error("이메일 발송 중 에러:", e);
        return false;
    }
}