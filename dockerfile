# ─── Estágio 1: Build da aplicação (Vite) ─────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# só copia package.json e lockfile e instala dependências
COPY package*.json ./
RUN npm ci

# copia todo o código e gera build Vite (gera /app/dist)
COPY . .
RUN npm run build

# ─── Estágio 2: Servidor de produção com Nginx ────────────────────
FROM nginx:stable-alpine

# se você tiver config customizada, copie-a antes
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copia a pasta dist (e não build) do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
