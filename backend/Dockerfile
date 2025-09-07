# Multi-stage Dockerfile para o backend Synapse Node.js

# Base image
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage  
FROM base AS dev-dependencies
COPY package*.json ./
RUN npm ci

# Development stage
FROM dev-dependencies AS development
COPY . .
RUN npx prisma generate
EXPOSE 8080
CMD ["npm", "run", "dev"]

# Build stage
FROM dev-dependencies AS build
COPY . .
RUN npm run build
RUN npx prisma generate

# Production stage
FROM dependencies AS production
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./

# Create uploads directory and non-root user
RUN mkdir -p uploads logs && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["npm", "start"]