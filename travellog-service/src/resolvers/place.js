import redis from '../redis.js';

export const placeResolvers = {
    Query: {
        places: async (_, __, { prisma }) => {
            const cacheStTime = Date.now();
            let dataRetrievalTime;
            const cacheKey = 'all_places';
            const cachedPlaces = await redis.get(cacheKey);
            if(cachedPlaces) {
                const cacheEndTime = Date.now();
                dataRetrievalTime = cacheEndTime - cacheStTime;
                console.log(`cache hit! all_places - Retrived in ${dataRetrievalTime}ms`);
                return JSON.parse(cachedPlaces);
            }

            // cache miss
            console.log('cache miss! all_places');
            const dbStTime = Date.now();
            const places = await prisma.place.findMany();
            const dbEndTime = Date.now();
            dataRetrievalTime = dbEndTime - dbStTime;
            console.log(`Data retrieved from DB in ${dataRetrievalTime}ms`);

            await redis.set(cacheKey, JSON.stringify(places), 'EX', 120);
            return places;
        },
        place: async (_, { id }, { prisma }) => await prisma.place.findUnique({ where: { id: parseInt(id) } }),
    },
    Mutation: {
        addPlace: async (_, args, { prisma }) => {
            const place = await prisma.place.create({data: args});
            await redis.del('all_places');
            return place;
        }
    },
    Place: {
        reviews: async (place, _, { prisma}) => await prisma.review.findMany({ where: { placeId: place.id } }),
        avgRating: async (place, _, {prisma}) => {
            const result = await prisma.review.aggregate({
                where: { placeId: place.id },
                _avg: { rating: true },
            });
            return result._avg.rating ?? 0;
        },
    },
}