# ============================================
# Multi-stage Dockerfile for Node.js Application
# Optimized for both development and production
# ============================================

# -----------------------------
# Stage 1: Base image
# -----------------------------
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies needed for bcrypt native compilation
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# -----------------------------
# Stage 2: Development
# -----------------------------
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose application port
EXPOSE 3000

# Development command with file watching
CMD ["npm", "run", "dev"]

# -----------------------------
# Stage 3: Production dependencies
# -----------------------------
FROM base AS prod-deps

# Install only production dependencies
RUN npm ci --only=production

# -----------------------------
# Stage 4: Production
# -----------------------------
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Set environment to production
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Production command
CMD ["node", "src/index.js"]
