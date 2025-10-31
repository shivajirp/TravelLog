import redis from "../redis.js";

export async function cacheGetorSetData(key, ttl, fetchFunction) {
    const cachedData = await redis.get(key);
    if (cachedData) {
        console.log(`cache hit! ${key}`);
        return JSON.parse(cachedData);
    }

    console.log(`cache miss! ${key}`);
    const data = await fetchFunction();
    if(data !== null && data !== undefined) {
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
    }

    return data;
}