FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY frontend/package.json ./frontend/

RUN bun install

COPY frontend/ ./frontend/

WORKDIR /app/frontend

RUN bun run build

EXPOSE 3000

CMD ["./node_modules/.bin/vite", "preview", "--host", "--port", "3000"]
