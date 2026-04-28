FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatapp?schema=public
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/prisma.config.js ./prisma.config.js
COPY --from=build /app/prisma.config.js.map ./prisma.config.js.map
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/uploads ./uploads
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 5000
CMD ["npm", "run", "start"]
