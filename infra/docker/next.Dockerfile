# One Dockerfile for all four Next.js apps: --build-arg APP=pos|parent|kiosk|admin
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
ARG APP
COPY . .
RUN pnpm install --frozen-lockfile
ENV NEXT_OUTPUT=standalone
RUN pnpm turbo run build --filter=@schoolcoin/${APP}...

FROM node:22-alpine AS run
ARG APP
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/${APP}/.next/standalone ./
COPY --from=build /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=build /repo/apps/${APP}/public ./apps/${APP}/public
ENV APP=${APP} PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["sh", "-c", "node apps/${APP}/server.js"]
