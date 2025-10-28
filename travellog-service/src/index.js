import { ApolloServer } from 'apollo-server';
import { initProducer, producer } from './kafka/producer.js';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './gqlschema.js';
import { userResolvers } from './resolvers/user.js';
import { placeResolvers } from './resolvers/place.js';
import { reviewResolvers } from './resolvers/review.js';
import dotenv from 'dotenv';
dotenv.config();


const prisma = new PrismaClient();

const server = new ApolloServer({
    typeDefs,
    resolvers: [
        userResolvers,
        placeResolvers,
        reviewResolvers
    ],
    context: () => ({ prisma }),
})


const start = async () => {
    await initProducer();
    const { url } = await server.listen({ port: process.env.PORT || 4000 });
    console.log(`Server ready at ${url}`);
}


process.on('SIGINT', async () => {
    await prisma.$disconnect();
    await producer.disconnect();
    process.exit(0);
})

start().catch(err => {
    console.log('Failed to start travellog-service:', err);
    process.exit(1);
});