# Stage 1: build the React frontend
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_URL=
RUN npm run build

# Stage 2: the backend, serving the built frontend
FROM node:22-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./public
EXPOSE 3000
CMD ["node", "server.js"]
