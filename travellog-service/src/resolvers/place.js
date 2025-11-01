import redis from '../redis.js';
import { cacheGetorSetData } from '../utils/cache.js';

export const placeResolvers = {
    Query: {
        places: async (_, __, { prisma }) => {
            const places = await cacheGetorSetData('places:all', 60, async () => {
                return await prisma.place.findMany();
            });
            return places;
        },
        place: async (_, { id }, { prisma }) => {
            const place = await cacheGetorSetData(`place:${id}`, 60, async () => {
                return await prisma.place.findUnique({ where: { id: parseInt(id) } });
            });
            return place;
        }
    },
    Mutation: {
        addPlace: async (_, args, { prisma }) => {
            const place = await prisma.place.create({data: args});
            await redis.del('places:all');
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