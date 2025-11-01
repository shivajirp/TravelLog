import redis from "../redis.js";

export async function cacheGetorSetData(key, ttl, fetchFunction) {
    try {
        // try reading from cache
        const cachedData = await redis.get(key);
        if (cachedData) {
            console.log(`cache hit! ${key}`);
            return JSON.parse(cachedData);
        }

        console.log(`cache miss! ${key}`);
        const data = await fetchFunction();

        // cache fresh data
        if(data !== null && data !== undefined) {
            try {
                await redis.set(key, JSON.stringify(data), 'EX', ttl);
            } catch (error) {
                console.error(`Error setting cache for key ${key}:`, error);
            }
        }

        return data;

    } catch (error) {
        console.error(`Redis error for key ${key}:`, error);

        // Fallback: directly fetch data if Redis fails 
        try {
            return await fetchFunction();
        } catch (error) {
            console.error(`Error in fetchFunction for key ${key} after Redis failure:`, error);
            throw error;
        }
    }
}