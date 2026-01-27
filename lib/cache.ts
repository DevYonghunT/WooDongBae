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
        return cached.data as T;
    }

    const data = await fetcher();
    cache.set(key, {
        data,
        expiresAt: now + ttlSeconds * 1000,
    });

    return data;
}
