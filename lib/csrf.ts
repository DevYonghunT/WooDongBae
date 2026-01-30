import { cookies } from "next/headers";
import crypto from "crypto";

export function generateCSRFToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export async function setCSRFToken(): Promise<string> {
    const token = generateCSRFToken();
    (await cookies()).set("csrf-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1일
    });
    return token;
}

export async function verifyCSRFToken(token: string): Promise<boolean> {
    const storedToken = (await cookies()).get("csrf-token")?.value;

    // 기본 유효성 검사
    if (!storedToken || !token || token.length !== 64) {
        return false;
    }

    // 타이밍 공격 방지: constant-time comparison
    try {
        const tokenBuffer = Buffer.from(token, "hex");
        const storedBuffer = Buffer.from(storedToken, "hex");

        if (tokenBuffer.length !== storedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(tokenBuffer, storedBuffer);
    } catch {
        return false;
    }
}
