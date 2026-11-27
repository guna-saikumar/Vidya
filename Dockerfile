FROM node:22-slim AS dev

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && corepack enable \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json tsconfig.base.json ./
COPY student ./student
COPY admin ./admin
COPY backend ./backend

RUN pnpm install --frozen-lockfile --network-concurrency=1 --child-concurrency=1

EXPOSE 4000 5173 5175 8081

CMD ["pnpm", "dev:api"]
