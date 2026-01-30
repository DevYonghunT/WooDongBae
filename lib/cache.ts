/**
 * 메모리 기반 간단한 캐시 (단일 프로세스용)
 *
 * 특징:
 * - 최대 항목 수 제한 (LRU 방식 정리)
 * - TTL 기반 만료
 */

const MAX_CACHE_SIZE = 1000;

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export async function cachedQuery<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
): Promise<T> {
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now < cached.expiresAt) {
        // 캐시 히트: 항목을 끝으로 이동 (LRU)
        cache.delete(key);
        cache.set(key, cached);
        return cached.data as T;
    }

    const data = await fetcher();

    // 캐시 크기 제한 체크
    if (cache.size >= MAX_CACHE_SIZE) {
        // 가장 오래된 항목(첫 번째) 삭제
        const firstKey = cache.keys().next().value;
        if (firstKey) {
            cache.delete(firstKey);
        }
    }

    cache.set(key, {
        data,
        expiresAt: now + ttlSeconds * 1000,
    });

    return data;
}

// 캐시 수동 삭제 (필요시)
export function invalidateCache(key: string) {
    cache.delete(key);
}

// 캐시 전체 삭제 (필요시)
export function clearCache() {
    cache.clear();
}
