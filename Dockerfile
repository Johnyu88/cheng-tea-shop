FROM node:24.19.0-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM base AS builder

ARG NEXT_PUBLIC_DEMO_COMMERCE=disabled
ENV NEXT_PUBLIC_DEMO_COMMERCE=$NEXT_PUBLIC_DEMO_COMMERCE
ARG NEXT_PUBLIC_MERCHANT_MANUAL_ORDER=disabled
ENV NEXT_PUBLIC_MERCHANT_MANUAL_ORDER=$NEXT_PUBLIC_MERCHANT_MANUAL_ORDER

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24.19.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]