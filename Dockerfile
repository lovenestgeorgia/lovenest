FROM docker.io/node:20-bookworm-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}

ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN npm run build

FROM docker.io/node:20-bookworm-slim AS prod

ENV NEXT_TELEMETRY_DISABLED=1

ARG GIT_COMMIT_BRANCH=unknown
ENV GIT_COMMIT_BRANCH=${GIT_COMMIT_BRANCH}
LABEL GIT.COMMIT_BRANCH=${GIT_COMMIT_BRANCH}

ARG GIT_COMMIT_TAG=unknown
ENV GIT_COMMIT_TAG=${GIT_COMMIT_TAG}
LABEL GIT.COMMIT_TAG=${GIT_COMMIT_TAG}

ARG GIT_COMMIT_SHA=unknown
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
LABEL GIT.COMMIT_SHA=${GIT_COMMIT_SHA}

ARG GIT_COMMIT_TIMESTAMP=unknown
ENV GIT_COMMIT_TIMESTAMP=${GIT_COMMIT_TIMESTAMP}
LABEL GIT.COMMIT_TIMESTAMP=${GIT_COMMIT_TIMESTAMP}

RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*
RUN useradd -ms /bin/bash nonroot

WORKDIR /home/nonroot/app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R nonroot:nonroot /home/nonroot/app
USER nonroot

CMD ["npm", "run", "start"]
