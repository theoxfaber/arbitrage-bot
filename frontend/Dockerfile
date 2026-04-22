FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Since there is pnpm-lock.yaml in the directory:
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
