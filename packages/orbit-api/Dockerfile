FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src ./src

EXPOSE 3000
CMD ["bun", "src/index.ts"]
