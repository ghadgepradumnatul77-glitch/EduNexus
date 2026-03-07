# STAGE 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# STAGE 2: Production
FROM node:18-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built code from builder (if there were a build step like TS, it would be here)
# For this JS project, we copy the relevant source files
COPY . .

# Create a non-root user
RUN addgroup -S edunexus && adduser -S edunexus -G edunexus
RUN chown -R edunexus:edunexus /app
USER edunexus

# Expose port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
