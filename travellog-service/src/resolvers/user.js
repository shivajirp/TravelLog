import bcrypt from 'bcryptjs';
import { cacheGetorSetData } from '../utils/cache.js';

export const userResolvers = {
    Query: {
        user: async (_, {id}, {prisma}) => {
            const user = await cacheGetorSetData(`user:${id}`, 300, async () => {
                return await prisma.user.findUnique({
                    where: { id: parseInt(id) },
                });
            });
            return user;
        },

        users: async (_, __, {prisma}) => {
            return await prisma.user.findMany();
        },
    },

    Mutation: {
        addUser: async (_, {name, email, password}, {prisma}) => {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if(existingUser) {
                throw new Error('User with this email already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                }
            });

            return newUser;
        },
    },

    User: {
        reviews: async (user, __, {prisma}) => {
            return await prisma.review.findMany({
                where: { userId: user.id },
            })
        }
    }
}