import bcrypt from 'bcryptjs';

export const userResolvers = {
    Query: {
        user: async (_, {id}, {prisma}) => {
            return await prisma.user.findUnique({
                where: { id: parseInt(id) },
            })
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
            await prisma.user.findUnique({
                where: { userId: user.id },
            })
        }
    }
}