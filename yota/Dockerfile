# syntax=docker/dockerfile:1

# 🧩 Start from a lightweight Node image
FROM node:18-slim AS base

# Set working directory inside container
WORKDIR /app

# Copy only dependency files first (for layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Environment defaults (can be overridden by docker-compose)
ENV NODE_ENV=production \
    DB_HOST=db \
    DB_PORT=5432 \
    DB_USER=postgres \
    DB_NAME=app_development

# Your app’s main entrypoint( Not for now )
# CMD ["node", "main.js"]