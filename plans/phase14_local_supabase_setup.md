# Phase 14: Local Supabase Setup Guide

This guide walks you through setting up a local Supabase instance using Docker for the GeneReason application.

## Overview

Local Supabase provides the full Supabase stack locally:
- **PostgreSQL** database with extensions
- **GoTrue** authentication service
- **PostgREST** auto-generated API
- **Realtime** for subscriptions
- **Storage** for file uploads
- **Edge Functions** runtime

## Architecture

```mermaid
flowchart TB
    subgraph Local Development
        FE[Frontend :5173]
        BE[Backend :8002]
        SB[Supabase Local Stack]
        
        subgraph Supabase Services
            PG[(PostgreSQL :54322)]
            AUTH[GoTrue Auth :54321]
            API[PostgREST :54321]
            RT[Realtime :54321]
        end
        
        SB --> Supabase Services
    end
    
    FE --> BE
    BE --> API
    BE --> PG
    API --> PG
    AUTH --> PG
```

## Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose v2+
- At least 4GB RAM available for Docker
- Supabase CLI (optional but recommended)

## Option 1: Using Supabase CLI (Recommended)

### Step 1: Install Supabase CLI

```bash
# Linux
curl -fsSL https://supabase.com/install.sh | sudo bash

# Or using npm
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Initialize Supabase

```bash
# From project root
supabase init

# This creates:
# - supabase/config.toml
# - supabase/migrations/ (for SQL migrations)
# - supabase/seed.sql (for seed data)
```

### Step 3: Start Local Supabase

```bash
# Start all Supabase services
supabase start

# This will:
# - Pull Docker images
# - Start PostgreSQL, GoTrue, PostgREST, Realtime, etc.
# - Generate local API keys
```

### Step 4: Get Local Credentials

After starting, Supabase will display your local credentials:

```
         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Save these for your `.env` configuration.

### Step 5: Create Database Migration

Copy the schema to a migration file:

```bash
# Create a new migration
supabase migration new initial_schema

# This creates: supabase/migrations/20240101000000_initial_schema.sql
```

Then copy the contents of `backend/app/core/schema.sql` into this file.

### Step 6: Apply Migrations

```bash
# Apply all pending migrations
supabase db push

# Or reset the database and apply all migrations
supabase db reset
```

### Step 7: Seed Data

Create `supabase/seed.sql` with sample questions:

```sql
-- Insert sample questions
INSERT INTO questions (id, stem, options, correct_answer, difficulty, category, explanation, key_concepts) VALUES
(
    '00000000-0000-0000-0000-000000000001'::uuid,
    'A 4-month-old infant presents with failure to thrive, hepatosplenomegaly, and developmental regression. Physical exam reveals cherry-red spot in the macula. Laboratory studies show normal liver enzymes but absent hexosaminidase A activity in leukocytes.',
    '{"A": "Niemann-Pick disease type A", "B": "Tay-Sachs disease", "C": "Gaucher disease type 1", "D": "Fabry disease", "E": "Krabbe disease"}',
    'B',
    'medium',
    'Lysosomal Storage Disorders',
    'Tay-Sachs disease is characterized by absent hexosaminidase A activity, cherry-red spot, and neurodegeneration without hepatosplenomegaly.',
    ARRAY['hexosaminidase A', 'cherry-red spot', 'lysosomal storage disease']
);
```

Apply the seed:

```bash
supabase db seed
```

## Option 2: Using Docker Compose Directly

If you prefer not to use the CLI, you can run Supabase services directly via Docker Compose.

### Create `docker-compose.supabase.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL with Supabase extensions
  supabase-db:
    image: supabase/postgres:15.1.0.147
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
      - ./backend/app/core/schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro
    networks:
      - supabase-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # GoTrue Authentication
  supabase-auth:
    image: supabase/gotrue:v2.151.0
    ports:
      - "54321:9999"
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:postgres@supabase-db:5432/postgres
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_URI_ALLOW_LIST: "*"
      GOTRUE_JWT_SECRET: your-jwt-secret-at-least-32-characters-long
      GOTRUE_JWT_EXP: 3600
      GOTRUE_DISABLE_SIGNUP: false
    depends_on:
      supabase-db:
        condition: service_healthy
    networks:
      - supabase-network

  # PostgREST API
  supabase-rest:
    image: postgrest/postgrest:v12.0.0
    ports:
      - "54321:3000"
    environment:
      PGRST_DB_URI: postgres://postgres:postgres@supabase-db:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: your-jwt-secret-at-least-32-characters-long
    depends_on:
      supabase-db:
        condition: service_healthy
    networks:
      - supabase-network

  # Supabase Studio (Admin UI)
  supabase-studio:
    image: supabase/studio:20240101-abc123
    ports:
      - "54323:3000"
    environment:
      STUDIO_PG_META_URL: http://supabase-meta:8080
      POSTGRES_PASSWORD: postgres
    depends_on:
      - supabase-db
    networks:
      - supabase-network

networks:
  supabase-network:
    driver: bridge

volumes:
  supabase-db-data:
```

### Start Services

```bash
docker-compose -f docker-compose.supabase.yml up -d
```

## Configure Backend

### Update `.env` File

```env
# Local Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Direct PostgreSQL connection (optional)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres

# Feature Flags
USE_MOCK_DATA=false
```

### Generate Local Keys

For local development, you can use these test keys (they work with the default JWT secret):

```bash
# The anon key and service_role key are generated by Supabase CLI
# If using Docker Compose directly, you need to generate them:

# Install jwt-cli or use Python:
python3 -c "
import jwt
import time

secret = 'your-jwt-secret-at-least-32-characters-long'
payload = {'role': 'anon', 'iat': int(time.time())}
anon_key = jwt.encode(payload, secret, algorithm='HS256')
print(f'anon key: {anon_key}')

payload_service = {'role': 'service_role', 'iat': int(time.time())}
service_key = jwt.encode(payload_service, secret, algorithm='HS256')
print(f'service_role key: {service_key}')
"
```

## Verify Setup

### 1. Check Services

```bash
# Check Docker containers
docker ps

# Check Supabase status (CLI)
supabase status
```

### 2. Test Database Connection

```bash
# Using psql
psql -h localhost -p 54322 -U postgres -d postgres

# Or using Supabase CLI
supabase db psql
```

### 3. Test API

```bash
# Test the questions endpoint
curl http://localhost:8002/api/v1/questions

# Test Supabase REST API directly
curl -X GET "http://localhost:54321/rest/v1/questions" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

### 4. Open Supabase Studio

Navigate to http://localhost:54323 to access the Supabase admin UI.

## Common Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Reset database (applies all migrations and seeds)
supabase db reset

# View logs
supabase logs

# Generate types from schema
supabase gen types typescript --local > frontend/src/types/database.ts
```

## Troubleshooting

### Port Conflicts

If ports are already in use:
- 54321: API Gateway
- 54322: PostgreSQL
- 54323: Studio

Stop conflicting services or modify ports in `supabase/config.toml`.

### Docker Memory Issues

Ensure Docker has at least 4GB RAM:
- Docker Desktop → Settings → Resources → Memory

### Migration Errors

```bash
# Reset and start fresh
supabase db reset

# Check migration status
supabase migration list
```

### Connection Refused

Wait for all services to be healthy:
```bash
# Check health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Next Steps

After local Supabase is running:

1. **Verify Backend Connection**: Start the backend and check logs for "✓ Supabase connection established"
2. **Test API Endpoints**: Use curl or Postman to test all endpoints
3. **Seed More Data**: Add more questions via SQL or the API
4. **Set Up Auth**: Configure authentication providers in GoTrue
5. **Deploy to Production**: When ready, use `supabase link` to connect to a cloud project

## Files to Create

1. `supabase/config.toml` - Supabase configuration
2. `supabase/migrations/` - SQL migration files
3. `supabase/seed.sql` - Seed data
4. `docker-compose.supabase.yml` - Alternative Docker setup (optional)
