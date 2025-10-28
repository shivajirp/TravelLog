import redis from '../redis.js';

export const placeResolvers = {
    Query: {
        places: async (_, __, { prisma }) => {
            const cacheStTime = Date.now();
            let dataRetrivalTime;
            const cacheKey = 'all_places';
            const cachedPlaces = await redis.get(cacheKey);
            if(cachedPlaces) {
                const cacheEndTime = Date.now();
                dataRetrivalTime = cacheEndTime - cacheStTime;
                console.log(`cache hit! all_places - Retrived in ${dataRetrivalTime}ms`);
                return JSON.parse(cachedPlaces);
            }

            // cache miss
            console.log('cache miss! all_places');
            const dbStTime = Date.now();
            const places = await prisma.place.findMany();
            const dbEndTime = Date.now();
            dataRetrivalTime = dbEndTime - dbStTime;
            console.log(`Data retrived from DB in ${dataRetrivalTime}ms`);

            await redis.set(cacheKey, JSON.stringify(places), 'EX', 120);
            return places;
        },
        place: async (_, { id }, { prisma }) => await prisma.place.findUnique({ where: { id: parseInt(id) } }),
    },
    Mutation: {
        addPlace: async (_, args, { prisma }) => await prisma.place.create({data: args}),
    },
    Place: {
        reviews: async (place, _, { prisma}) => await prisma.review.findMany({ where: { placeId: place.id } }),
        avgRating: async (place, _, {prisma}) => {
            const reviews = await prisma.review.findMany({where: {placeId: place.id}});
            if(reviews.length === 0) return 0;
            const total = reviews.reduce((sum, review) => sum + review.rating, 0);
            return total / reviews.length;
        },
    },
}