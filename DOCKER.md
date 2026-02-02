# Docker Setup Guide

This guide explains how to run the application using Docker in both development and production environments.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- A [Neon](https://neon.tech) account with a project created

## Quick Start

### Development (with Neon Local)

```bash
# 1. Copy and configure environment variables
cp .env.example .env.development

# 2. Edit .env.development with your Neon credentials
# Required: NEON_API_KEY, NEON_PROJECT_ID

# 3. Start the development environment
./scripts/dev.sh

# Or manually:
docker compose -f docker-compose.dev.yml up --build
```

### Production (with Neon Cloud)

```bash
# 1. Copy and configure environment variables
cp .env.example .env.production

# 2. Edit .env.production with your production credentials
# Required: DATABASE_URL, ARCJET_KEY, JWT_SECRET

# 3. Start the production environment
./scripts/prod.sh

# Or manually:
docker compose -f docker-compose.prod.yml up --build -d
```

### Stop All Containers

```bash
./scripts/stop.sh
```

---

## Development Environment

The development setup uses **Neon Local** - a proxy that creates ephemeral database branches for local development.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│  ┌─────────────┐              ┌─────────────────────────┐  │
│  │             │   Port 5432  │                         │  │
│  │  Neon Local │◄─────────────│    Application          │  │
│  │   (Proxy)   │              │    (Node.js)            │  │
│  │             │              │                         │  │
│  └──────┬──────┘              └────────────┬────────────┘  │
│         │                                  │               │
└─────────┼──────────────────────────────────┼───────────────┘
          │                                  │
          ▼                                  ▼
    ┌───────────┐                     ┌───────────┐
    │   Neon    │                     │  Host     │
    │   Cloud   │                     │  :3000    │
    │ (Ephemeral│                     │           │
    │  Branch)  │                     │           │
    └───────────┘                     └───────────┘
```

### Configuration

Edit `.env.development` with your Neon credentials:

```bash
# Required
NEON_API_KEY=your_neon_api_key_here      # From: https://console.neon.tech/app/settings/api-keys
NEON_PROJECT_ID=your_project_id_here      # From your Neon dashboard

# Optional - for ephemeral branches
PARENT_BRANCH_ID=br-xxx-yyy-123456        # Create branches from this parent
DELETE_BRANCH=true                         # Delete branch on container stop
```

### Commands

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up --build

# Start in detached mode
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f app
docker compose -f docker-compose.dev.yml logs -f neon-local

# Stop and remove containers
docker compose -f docker-compose.dev.yml down

# Stop and remove containers + volumes
docker compose -f docker-compose.dev.yml down -v

# Rebuild after dependency changes
docker compose -f docker-compose.dev.yml up --build --force-recreate
```

### Hot Reloading

The development setup mounts your source code as a volume, enabling hot reloading:
- Changes to `src/` are automatically detected
- The app restarts when files change
- No need to rebuild the container for code changes

### Database Migrations

Run migrations inside the development container:

```bash
# Generate new migration
docker compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Ephemeral Branches

Neon Local automatically creates ephemeral branches:

1. **On container start**: A new branch is created from `PARENT_BRANCH_ID` (or default branch)
2. **On container stop**: The branch is deleted (if `DELETE_BRANCH=true`)
3. **Benefits**:
   - Isolated development environment
   - No risk of corrupting production data
   - Fresh database state on each restart

To persist branches across restarts, set `DELETE_BRANCH=false`.

---

## Production Environment

The production setup connects directly to **Neon Cloud** without any local proxy.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              Application (Node.js)                  │   │
│  │                                                     │   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
                              ▼
                        ┌───────────┐
                        │   Neon    │
                        │   Cloud   │
                        │ (Pooler)  │
                        └───────────┘
```

### Configuration

Edit `.env.production` with your production credentials:

```bash
# Database - Get from Neon dashboard
DATABASE_URL=postgres://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Security
ARCJET_KEY=ajkey_xxxxxxxxxxxxx

# JWT - Generate a strong secret!
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_EXPIRES_IN=7d
```

### Commands

```bash
# Build and start production
docker compose -f docker-compose.prod.yml up --build -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check health status
docker compose -f docker-compose.prod.yml ps

# Stop containers
docker compose -f docker-compose.prod.yml down

# Restart with new configuration
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

### Security Features

The production configuration includes:

- **Non-root user**: Application runs as `nodejs` user
- **Read-only filesystem**: Container filesystem is read-only
- **No new privileges**: Prevents privilege escalation
- **Resource limits**: CPU and memory constraints
- **Health checks**: Automatic restart on failure

---

## Environment Variables

### Development vs Production

| Variable | Development | Production |
|----------|------------|------------|
| `NODE_ENV` | `development` | `production` |
| `DATABASE_URL` | `postgres://neon:npg@neon-local:5432/neondb` | `postgres://...neon.tech/...` |
| `NEON_API_KEY` | Required | Not needed |
| `NEON_PROJECT_ID` | Required | Not needed |
| `ARCJET_KEY` | Optional | Required |
| `JWT_SECRET` | Dev default | Strong secret required |
| `LOG_LEVEL` | `debug` | `info` |

### How DATABASE_URL Switches

The application automatically detects the environment:

```javascript
// In src/config/database.js
const isNeonLocal = process.env.DATABASE_URL?.includes('neon-local') ||
                    process.env.DATABASE_URL?.includes('localhost:5432');

if (isNeonLocal) {
  // Configure for Neon Local (HTTP endpoint, self-signed certs)
  neonConfig.fetchEndpoint = ...
  neonConfig.useSecureWebSocket = false;
}
```

---

## Troubleshooting

### Neon Local won't start

1. Check your API key is valid:
   ```bash
   docker compose -f docker-compose.dev.yml logs neon-local
   ```

2. Ensure project ID is correct:
   ```bash
   # Find your project ID at https://console.neon.tech
   echo $NEON_PROJECT_ID
   ```

### Database connection refused

1. Wait for Neon Local to be healthy:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   # neon-local should show "healthy"
   ```

2. Check network connectivity:
   ```bash
   docker compose -f docker-compose.dev.yml exec app ping neon-local
   ```

### Hot reload not working

1. Ensure volumes are mounted correctly:
   ```bash
   docker compose -f docker-compose.dev.yml exec app ls -la /app/src
   ```

2. Check file permissions on Windows/Mac

### Production health check failing

1. Check application logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs app
   ```

2. Verify DATABASE_URL is set correctly:
   ```bash
   docker compose -f docker-compose.prod.yml exec app printenv DATABASE_URL
   ```

### Mac-specific: Git integration issues

If using ephemeral branches with Git integration on Mac:

1. Open Docker Desktop settings
2. Go to "General"
3. Change file sharing from "VirtioFS" to "gRPC FUSE"
4. Restart Docker Desktop

---

## Building for CI/CD

### Build production image

```bash
docker build --target production -t devops-app:latest .
```

### Push to registry

```bash
docker tag devops-app:latest your-registry/devops-app:latest
docker push your-registry/devops-app:latest
```

### Run in CI

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e ARCJET_KEY="$ARCJET_KEY" \
  -e JWT_SECRET="$JWT_SECRET" \
  your-registry/devops-app:latest
```

---

## File Structure

```
├── Dockerfile                 # Multi-stage build (dev + prod)
├── docker-compose.dev.yml     # Development with Neon Local
├── docker-compose.prod.yml    # Production with Neon Cloud
├── .dockerignore              # Files excluded from build
├── .env.example               # Environment template
├── .env.development           # Development config (git-ignored)
├── .env.production            # Production config (git-ignored)
├── DOCKER.md                  # This documentation
└── scripts/
    ├── dev.sh                 # Start development environment
    ├── prod.sh                # Start production environment
    └── stop.sh                # Stop all containers
```
