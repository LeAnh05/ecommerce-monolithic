
FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --include=dev

COPY prisma ./prisma

RUN npx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
