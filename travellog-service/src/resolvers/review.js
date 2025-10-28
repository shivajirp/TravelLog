import { publishEvent } from "../kafka/producer.js";
import redis from "../redis.js";

export const reviewResolvers = {
    Query: {
        reviews: async (_, __, { prisma }) => {
            return await prisma.review.findMany();
        }
    },

    Mutation: {
        addReview: async (_, args, { prisma }) => {
            const review = await prisma.review.create({
                data: {
                    rating: args.rating,
                    comment: args.comment,
                    userId: parseInt(args.userId),
                    placeId: parseInt(args.placeId),
                },
            });
            
            // invalidate cache
            await redis.del(`reviews_place_${args.placeId}`);
            await redis.del(`all_places`);

            const event = {
                reviewId: review.id,
                rating: review.rating,
                comment: review.comment,
                userId: review.userId,
                placeId: review.placeId,
                createdAt: review.createdAt?.toISOString?.() || new Date().toISOString(),
            };

            // publish kafka event
            try {
                await publishEvent('review.created', event);
                console.log('Published review.created', event)  
            } catch (error) {
                console.error('Failed to publish review.created', error);
            }

            return review;
        },
    },

    Review: {
        user: async (review, _, { prisma}) => await prisma.user.findUnique({ where: { id: review.userId } }),
        place: async (review, _, { prisma}) => await prisma.place.findUnique({ where: { id: review.placeId } }),
    },
}