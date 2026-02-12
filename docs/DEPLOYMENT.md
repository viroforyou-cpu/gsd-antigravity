# GeneReason - Deployment Guide

This guide covers the deployment process for the GeneReason application.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured
- SSL certificates (Let's Encrypt recommended)
- Environment variables configured

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/genereason.git
cd genereason
```

### 2. Configure environment variables

```bash
# Copy example environment files
cp backend/.env.production.example backend/.env.production

# Edit with your values
nano backend/.env.production
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `LLM_API_KEY` - API key for LLM service
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` - If using Supabase

### 3. Generate SSL certificates

```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot
sudo certbot certonly --standalone -d genereason.com -d www.genereason.com

# Copy certificates
sudo cp /etc/letsencrypt/live/genereason.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/genereason.com/privkey.pem nginx/ssl/
```

### 4. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Initialize the database

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.core.database import init_db;
import asyncio
asyncio.run(init_db())
"

# Seed knowledge graph (optional)
docker-compose -f docker-compose.prod.yml exec backend python scripts/seed_knowledge_graph.py
```

## Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

Best for: Single server deployment, full control

Requirements:
- VPS with 4GB+ RAM
- Docker and Docker Compose
- Domain name

Steps:
1. Set up a VPS (DigitalOcean, Linode, Hetzner, etc.)
2. Install Docker and Docker Compose
3. Clone repository and configure environment
4. Run `docker-compose -f docker-compose.prod.yml up -d`

### Option 2: Railway

Best for: Quick deployment, automatic scaling

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy backend
railway link
railway up

# Add PostgreSQL and Redis add-ons
railway add postgresql
railway add redis
```

### Option 3: Render

Best for: Managed deployment with free tier

1. Connect GitHub repository to Render
2. Create a Web Service for backend
3. Create a Static Site for frontend
4. Add PostgreSQL and Redis managed services

### Option 4: Fly.io

Best for: Global deployment with edge computing

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and launch
fly auth login
fly launch

# Set secrets
fly secrets set JWT_SECRET_KEY=your-key
fly secrets set DATABASE_URL=your-url
```

## Frontend Deployment (CDN)

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

## Environment Variables Reference

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_ENV` | Environment (development/staging/production) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET_KEY` | Secret for JWT signing | Yes |
| `LLM_API_URL` | LLM API endpoint | No |
| `LLM_API_KEY` | LLM API key | No |
| `SUPABASE_URL` | Supabase project URL | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No |
| `FALKORDB_HOST` | FalkorDB host | No |
| `FALKORDB_PORT` | FalkorDB port | No |
| `CORS_ORIGINS` | Allowed CORS origins | Yes |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_SUPABASE_URL` | Supabase URL (if using) | No |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | No |

## Monitoring and Logging

### Health Checks

- Backend: `GET /health`
- Frontend: `GET /` (returns 200 if healthy)

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Monitoring Setup (Optional)

1. **Prometheus + Grafana**
   - Add prometheus.yml configuration
   - Import pre-built dashboards

2. **Sentry for Error Tracking**
   ```python
   # Add to backend
   import sentry_sdk
   sentry_sdk.init(dsn="your-sentry-dsn")
   ```

3. **Uptime Monitoring**
   - Use UptimeRobot, Pingdom, or similar
   - Monitor `/health` endpoint

## Backup Strategy

### Database Backups

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U genereason genereason > backup.sql

# Automated backups (add to crontab)
0 2 * * * /path/to/backup-script.sh
```

### Redis Backups

```bash
# Redis automatically saves to disk with the configuration in docker-compose.prod.yml
# Manual backup:
docker-compose -f docker-compose.prod.yml exec redis redis-cli BGSAVE
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check network connectivity

2. **Redis connection failed**
   - Verify Redis is running: `docker-compose ps redis`
   - Check REDIS_URL format

3. **Frontend not loading**
   - Check browser console for errors
   - Verify VITE_API_URL is correct
   - Check CORS configuration

4. **SSL certificate errors**
   - Verify certificates are valid
   - Check certificate paths in nginx config

### Useful Commands

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

## Security Checklist

- [ ] Change default JWT secret key
- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Set up firewall rules
- [ ] Enable authentication (REQUIRE_AUTH=true)
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Error tracking configured
- [ ] Monitoring alerts set up

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/genereason/issues
- Documentation: /docs
