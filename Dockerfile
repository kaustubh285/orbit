FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies with workspace awareness
COPY package.json bun.lock ./
COPY packages/orbit-api/package.json ./packages/orbit-api/
RUN bun install --frozen-lockfile

# Copy source
COPY packages/orbit-api ./packages/orbit-api

EXPOSE 3000
CMD ["bun", "packages/orbit-api/src/index.ts"]
