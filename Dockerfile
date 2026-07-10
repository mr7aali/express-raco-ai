FROM node:24-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package*.json ./
RUN npm install

FROM deps AS build

ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ecommerce_payment_db?schema=public"

COPY . .
RUN npm run db:generate
RUN npm run build
RUN npm prune --omit=dev

FROM base AS production

ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 5000

CMD ["npm", "start"]
