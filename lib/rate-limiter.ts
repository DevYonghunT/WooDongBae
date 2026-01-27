// 메모리 기반 간단한 Rate Limiter (개발/소규모용)
const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    identifier: string, // IP 주소 또는 user ID
    maxRequests: number, // 허용 횟수
    windowMs: number // 시간 창 (밀리초)
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = requests.get(identifier);

    if (!record || now > record.resetAt) {
        // 새 윈도우 시작
        const resetAt = now + windowMs;
        requests.set(identifier, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (record.count >= maxRequests) {
        // 한도 초과
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    // 카운트 증가
    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// 주기적으로 만료된 항목 정리
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of requests.entries()) {
            if (now > value.resetAt) {
                requests.delete(key);
            }
        }
    }, 60000); // 1분마다
}
