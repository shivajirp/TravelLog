import redis from "../redis.js";

export async function cacheGetorSetData(key, ttl, fetchFunction) {
    let cachedData = null;
    let redisFailed = false;

    // Try to get from cache
    try {
        cachedData = await redis.get(key);
        if (cachedData) {
            console.log(`cache hit! ${key}`);
            return JSON.parse(cachedData);
        }
        console.log(`cache miss! ${key}`);
    } catch (error) {
        console.error(`Redis get error for key ${key}:`, error);
        redisFailed = true;
    }

    const data = await fetchFunction();

    // Try to cache the data if Redis is working and data is valid
    if (!redisFailed && data !== null && data !== undefined) {
        try {
            await redis.set(key, JSON.stringify(data), 'EX', ttl);
        } catch (error) {
            console.error(`Error setting cache for key ${key}:`, error);
        }
    }

    return data;
}