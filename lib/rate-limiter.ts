/**
 * 메모리 기반 간단한 Rate Limiter (단일 프로세스용)
 *
 * 주의: 이 구현은 단일 Node.js 프로세스에서만 동작합니다.
 * 다중 인스턴스/서버리스 환경에서는 Redis 등 외부 저장소가 필요합니다.
 */

const MAX_ENTRIES = 10000; // 최대 추적 항목 수
const requests = new Map<string, { count: number; resetAt: number }>();
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = requests.get(identifier);

    if (!record || now > record.resetAt) {
        // 새 윈도우 시작
        const resetAt = now + windowMs;

        // 메모리 보호: 최대 항목 수 초과 시 만료된 항목 정리
        if (requests.size >= MAX_ENTRIES) {
            cleanExpiredEntries();
        }

        requests.set(identifier, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

function cleanExpiredEntries() {
    const now = Date.now();
    for (const [key, value] of requests.entries()) {
        if (now > value.resetAt) {
            requests.delete(key);
        }
    }
}

// 주기적 정리 시작
function startCleanupInterval() {
    if (typeof setInterval !== "undefined" && !cleanupInterval) {
        cleanupInterval = setInterval(cleanExpiredEntries, 60000);
    }
}

// 정리 인터벌 중지 (테스트용)
export function stopCleanupInterval() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
}

// 초기화
startCleanupInterval();
