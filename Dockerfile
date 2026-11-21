FROM node:22-alpine AS build

WORKDIR /workspace

ARG VITE_AGENTGO_BACKEND_URL
ENV VITE_AGENTGO_BACKEND_URL=$VITE_AGENTGO_BACKEND_URL
# TEST gateway mounts this image at /ui/; local defaults stay '/'.
ARG VITE_BASE=/
ENV VITE_BASE=$VITE_BASE

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY tsconfig.json ./tsconfig.json
COPY app/package.json ./app/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN pnpm install --frozen-lockfile

COPY app ./app
COPY packages ./packages

RUN pnpm build

FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="AgentGo UI"
LABEL org.opencontainers.image.description="AgentGo web interface"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
