# base stage
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# RUN npx prisma migrate dev
RUN npx prisma generate


FROM base AS dev
ENV NODE_ENV=development
EXPOSE 5001
CMD ["npm", "start"]


FROM base AS prod
ENV NODE_ENV=production
RUN npm prune --production
EXPOSE 5001
CMD ["node", "src/index.js"]
