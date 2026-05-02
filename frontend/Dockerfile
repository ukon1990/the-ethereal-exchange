FROM oven/bun:1.3.3-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY app-dist.tar.gz /tmp/app-dist.tar.gz
RUN mkdir -p dist && tar -xzf /tmp/app-dist.tar.gz -C dist && rm /tmp/app-dist.tar.gz

EXPOSE 4000

CMD ["bun", "dist/The-Ethereal-Exchange/server/server.mjs"]
