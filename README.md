# GeneReason - AI-Powered Medical Genetics MCQ Training App

An AI-powered training application for medical genetics residents to practice complex multiple-choice questions using multiple reasoning strategies.

## 🎯 Overview

GeneReason helps medical genetics residents prepare for board certification by providing:

- **Multiple Reasoning Strategies**: Practice with four different reasoning approaches
  - Association/Graph-based reasoning
  - Hypothetico-deductive reasoning
  - Constraint satisfaction
  - Argument-based reasoning
- **Knowledge Graph Visualization**: Interactive visual representation of medical concepts
- **LLM-Powered Features**: AI-generated questions and explanations
- **Progress Tracking**: Monitor your performance over time

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│   Databases     │
│   (React/Vite)  │     │   (FastAPI)     │     │  (Supabase/     │
│                 │     │                 │     │   FalkorDB)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │                 │
                        │   LLM Service   │
                        │   (GLM-4.7)     │
                        │                 │
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker and Docker Compose (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GSD_antigravity
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Copy environment file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start the server
   uvicorn app.main:app --reload --port 8002
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8002
   - API Documentation: http://localhost:8002/docs

### Docker Deployment

```bash
# Production deployment
docker-compose up -d

# Development with local databases
docker-compose -f docker-compose.dev.yml up -d
```

## 📁 Project Structure

```
GSD_antigravity/
├── frontend/                # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand state management
│   │   ├── types/           # TypeScript types
│   │   └── hooks/           # Custom React hooks
│   └── ...
│
├── backend/                 # FastAPI Python
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── core/            # Configuration
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Business logic
│   │   └── mock/            # Mock data
│   └── ...
│
├── plans/                   # Architecture documents
└── docker-compose.yml       # Docker configuration
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | Environment (development/staging/production) | development |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | *required in production* |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `LLM_API_URL` | LLM API endpoint | - |
| `LLM_API_KEY` | LLM API key | - |
| `FALKORDB_HOST` | FalkorDB host | localhost |
| `REQUIRE_AUTH` | Enable authentication | false |
| `USE_MOCK_DATA` | Use mock data | true |

See [backend/.env.example](backend/.env.example) for all options.

## 📚 API Documentation

### Authentication

```bash
# Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}

# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Response
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Questions

```bash
# List questions
GET /api/v1/questions

# Get random question
GET /api/v1/questions/random

# Get question by ID
GET /api/v1/questions/{id}
```

### Sessions

```bash
# Start new session
POST /api/v1/sessions
{
  "category": "Lysosomal Storage Disorders",
  "question_count": 10
}

# Submit answer
PUT /api/v1/sessions/{id}/answer
{
  "question_id": "q001",
  "answer": "B"
}

# Complete session
POST /api/v1/sessions/{id}/complete
```

### Reasoning

```bash
# Get all reasoning strategies
POST /api/v1/reasoning/analyze
{
  "question_id": "q001"
}

# Get specific strategy
POST /api/v1/reasoning/association
POST /api/v1/reasoning/hypothetico
POST /api/v1/reasoning/constraints
POST /api/v1/reasoning/arguments
```

Full API documentation available at `/docs` when running the backend.

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse (60 req/min default)
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Pydantic models for all inputs
- **Error Handling**: Comprehensive error handling without exposing internals

## 📊 Reasoning Strategies

### 1. Association/Graph-Based
Uses knowledge graph connections to find relationships between findings and conditions.

### 2. Hypothetico-Deductive
Generates hypotheses from findings and tests each against the evidence.

### 3. Constraint Satisfaction
Eliminates options that violate constraints derived from clinical findings.

### 4. Argument-Based
Builds arguments for and against each option using evidence.

## 🚢 Deployment

### Production Checklist

- [ ] Set `APP_ENV=production`
- [ ] Generate secure `JWT_SECRET_KEY`
- [ ] Configure Supabase credentials
- [ ] Set up LLM API access
- [ ] Configure FalkorDB connection
- [ ] Set `REQUIRE_AUTH=true`
- [ ] Set `USE_MOCK_*=false`
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates

### Docker Production

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contributing guidelines here]

## 📞 Support

For issues and feature requests, please use the GitHub issue tracker.
