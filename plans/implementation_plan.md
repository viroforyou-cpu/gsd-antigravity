# GeneReason - Implementation Plan

## Project Overview

**Name**: GeneReason  
**Purpose**: AI-powered training application for medical genetics residents to practice complex multiple-choice questions using multiple reasoning strategies  
**Target Users**: Medical genetics residents preparing for board certification

### Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deployment | Web-only initially | Simpler development, desktop not a priority |
| Backend | FastAPI in parallel | Both frontend and backend developed together |
| Databases | Mock initially | Focus on UI and API structure first |
| LLM Integration | Structured but not connected | Prepare interfaces without actual API calls |
| Graph Visualization | Reaflow | Auto-layout for directed graphs, modern look |

---

## Technology Stack

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Build Tool | Vite | Latest |
| UI Framework | React | 18+ |
| Language | TypeScript | 5+ |
| State Management | Zustand | Latest |
| Graph Visualization | Reaflow | Latest |
| Styling | TailwindCSS | 3+ |
| Markdown Rendering | React-Markdown | Latest |
| HTTP Client | Axios or Ky | Latest |
| Routing | React Router | 6+ |

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| API Framework | FastAPI | 0.100+ |
| Language | Python | 3.11+ |
| ASGI Server | Uvicorn | Latest |
| Validation | Pydantic | 2+ |
| HTTP Client | httpx | Latest |
| CORS | fastapi-cors | Built-in |

### Future Integration (Stubbed)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Primary Database | Supabase | Users, questions, sessions, progress |
| Graph Database | FalkorDB | Knowledge graph storage |
| Temporal Graphs | Graphiti | Learning history |
| LLM | GLM-4.7 | Question generation, reasoning |

---

## Project Structure

```
GSD_antigravity/
├── frontend/                    # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── common/          # Button, Card, Modal, etc.
│   │   │   ├── question/        # Question display components
│   │   │   ├── graph/           # Knowledge graph visualization
│   │   │   ├── reasoning/       # Reasoning strategy components
│   │   │   └── layout/          # Layout components
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PracticeSession.tsx
│   │   │   ├── SessionReview.tsx
│   │   │   └── Settings.tsx
│   │   ├── stores/              # Zustand stores
│   │   │   ├── questionStore.ts
│   │   │   ├── sessionStore.ts
│   │   │   └── userStore.ts
│   │   ├── services/            # API services
│   │   │   ├── api.ts
│   │   │   ├── questionService.ts
│   │   │   └── reasoningService.ts
│   │   ├── types/               # TypeScript types
│   │   │   ├── question.ts
│   │   │   ├── session.ts
│   │   │   └── graph.ts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                     # FastAPI Python
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── questions.py
│   │   │   │   ├── sessions.py
│   │   │   │   ├── reasoning.py
│   │   │   │   └── progress.py
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── dependencies.py
│   │   ├── models/              # Pydantic models
│   │   │   ├── question.py
│   │   │   ├── session.py
│   │   │   └── graph.py
│   │   ├── services/            # Business logic
│   │   │   ├── question_service.py
│   │   │   ├── reasoning_service.py
│   │   │   └── llm_service.py   # Stubbed
│   │   ├── mock/                # Mock data
│   │   │   ├── questions.json
│   │   │   └── graphs.json
│   │   └── main.py
│   ├── requirements.txt
│   └── pyproject.toml
│
├── plans/                       # Architecture documents
│   ├── mcq_methodologies_research.md
│   ├── mcq_training_app_architecture.md
│   └── implementation_plan.md
│
└── docker-compose.yml           # For future database services
```

---

## API Contracts

### Base URL
- Frontend dev: `http://localhost:5173`
- Backend dev: `http://localhost:8000`
- API prefix: `/api/v1`

### Endpoints

#### Questions
```
GET    /api/v1/questions                    # List questions (paginated)
GET    /api/v1/questions/{id}               # Get single question
GET    /api/v1/questions/random             # Get random question for practice
POST   /api/v1/questions                    # Create question (admin)
GET    /api/v1/questions/{id}/graph         # Get knowledge graph for question
```

#### Sessions
```
POST   /api/v1/sessions                     # Start new practice session
GET    /api/v1/sessions/{id}                # Get session details
PUT    /api/v1/sessions/{id}/answer         # Submit answer for question
POST   /api/v1/sessions/{id}/complete       # Complete session
GET    /api/v1/sessions/{id}/review         # Get full session review
```

#### Reasoning
```
POST   /api/v1/reasoning/analyze            # Generate all reasoning strategies
POST   /api/v1/reasoning/association        # Association/graph reasoning
POST   /api/v1/reasoning/hypothetico        # Hypothetico-deductive
POST   /api/v1/reasoning/constraints        # Constraint satisfaction
POST   /api/v1/reasoning/arguments          # Argument-based reasoning
```

#### Progress
```
GET    /api/v1/progress/dashboard           # User dashboard data
GET    /api/v1/progress/categories          # Progress by category
GET    /api/v1/progress/history             # Historical performance
```

### Data Models

#### Question
```typescript
interface Question {
  id: string;
  stem: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  source_reference?: string;
  created_at: string;
}
```

#### Session
```typescript
interface Session {
  id: string;
  user_id?: string;
  questions: Question[];
  answers: Record<string, string>;  // question_id -> answer
  started_at: string;
  completed_at?: string;
  current_index: number;
}
```

#### Knowledge Graph
```typescript
interface GraphNode {
  id: string;
  type: 'finding' | 'condition' | 'gene' | 'mechanism' | 'inheritance' | 'treatment';
  name: string;
  properties?: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight?: number;
  properties?: Record<string, any>;
}

interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

#### Reasoning Result
```typescript
interface ReasoningResult {
  strategy: 'association' | 'hypothetico' | 'constraints' | 'arguments';
  question_id: string;
  steps: ReasoningStep[];
  conclusion: string;
  confidence: number;
  graph?: KnowledgeGraph;
}

interface ReasoningStep {
  step_number: number;
  description: string;
  evidence?: string[];
  supports?: string[];  // option IDs supported
  opposes?: string[];   // option IDs opposed
}
```

---

## Implementation Phases

### Phase 1: Project Setup
- [x] Create frontend project with Vite + React + TypeScript
- [x] Install frontend dependencies (TailwindCSS, Zustand, React Router, Reaflow, etc.)
- [x] Configure TailwindCSS
- [x] Set up project structure (folders, base files)
- [x] Create backend directory structure
- [x] Set up FastAPI with basic configuration
- [x] Configure CORS for frontend communication
- [x] Verify both servers run (frontend :5173, backend :8002)

### Phase 2: Core UI Components
- [x] Create layout components (Header, Sidebar, MainContent)
- [x] Build common UI components (Button, Card, Modal, OptionButton)
- [x] Create question display component
- [x] Build option selection component
- [x] Implement basic routing structure

### Phase 3: Mock Data and State
- [x] Create mock question data (5-10 sample medical genetics questions)
- [x] Create mock knowledge graph data
- [x] Create mock reasoning results for each strategy
- [x] Set up Zustand stores (questionStore, sessionStore)
- [x] Implement session state management

### Phase 4: Practice Session Flow
- [x] Build session start page (category selection, settings)
- [x] Implement question display with timer
- [x] Create answer submission flow
- [x] Build session progress indicator
- [x] Implement session completion

### Phase 5: Reasoning Visualization
- [x] Integrate Reaflow for graph visualization
- [x] Build Association/Graph reasoning view
- [x] Create Hypothetico-Deductive view
- [x] Implement Constraint Satisfaction funnel view
- [x] Build Argument-Based comparison view
- [x] Add tab navigation between strategies

### Phase 6: Session Review
- [x] Build session review page
- [x] Show question-by-question review
- [x] Display correct answer and user answer
- [x] Show reasoning for each question
- [x] Add key learning points extraction

### Phase 7: Backend API
- [x] Implement question endpoints with mock data
- [x] Create session management endpoints
- [x] Build reasoning endpoints (return mock reasoning)
- [x] Add progress tracking endpoints
- [x] Connect frontend to backend API

### Phase 8: Polish and Refinement
- [x] Add loading states and error handling
- [x] Implement responsive design
- [x] Add animations and transitions
- [x] Improve accessibility
- [x] Add keyboard navigation

### Phase 9: Database Integration (Supabase)
- [x] Add Supabase dependencies to backend
- [x] Create database configuration module
- [x] Design and document database schema (SQL)
- [x] Implement repository pattern for data access
  - [x] QuestionRepository (mock + Supabase)
  - [x] SessionRepository (mock + Supabase)
  - [x] ProgressRepository (mock + Supabase)
- [x] Update API routes to use repositories
- [x] Add environment configuration (.env.example)
- [x] Update frontend services for new API structure
- [x] Add progress service for dashboard data

### Phase 10: LLM Integration (GLM-4.7)
- [x] Add LLM configuration to backend settings
- [x] Create LLM service interface and stub implementation
- [x] Implement question generation service
  - [x] Generate question stems from medical genetics topics
  - [x] Generate plausible distractors (incorrect options)
  - [x] Generate explanations for correct answers
- [x] Implement reasoning generation service
  - [x] Association/graph-based reasoning
  - [x] Hypothetico-deductive reasoning
  - [x] Constraint satisfaction reasoning
  - [x] Argument-based reasoning
- [x] Create API endpoints for LLM features
  - [x] POST /api/v1/llm/generate-question
  - [x] POST /api/v1/llm/generate-reasoning
  - [x] POST /api/v1/llm/generate-explanation
  - [x] GET /api/v1/llm/strategies
  - [x] GET /api/v1/llm/status
- [x] Add mock LLM responses for development
- [x] Create frontend LLM service
- [x] Test LLM integration

### Phase 11: Graph Database Integration (FalkorDB)
- [x] Add FalkorDB configuration to backend
- [x] Create graph database service (mock + FalkorDB implementations)
- [x] Implement knowledge graph storage (models and API routes)
- [x] Connect reasoning service to graph database
- [x] Create frontend graph service
- [x] Add graph API endpoints
  - [x] GET /api/v1/graph/question/{id}
  - [x] POST /api/v1/graph/associations
  - [x] POST /api/v1/graph/reasoning-path
  - [x] POST /api/v1/graph/nodes
  - [x] POST /api/v1/graph/edges
  - [x] GET /api/v1/graph/nodes/{id}
  - [x] GET /api/v1/graph/nodes/{id}/connected
  - [x] POST /api/v1/graph/query
  - [x] GET /api/v1/graph/status

### Phase 12: Production Preparation
- [x] Add authentication/authorization
- [x] Implement rate limiting
- [x] Add comprehensive error handling
- [x] Set up logging and monitoring
- [x] Create deployment configuration
- [x] Write documentation

### Phase 13: End-to-End Testing
- [x] Set up frontend testing infrastructure
  - [x] Install Vitest and testing dependencies
  - [x] Configure Vitest for React/TypeScript
  - [x] Set up testing-library utilities
  - [x] Configure MSW for API mocking
- [x] Write frontend unit tests
  - [x] Test common components (Button, ProgressBar)
  - [x] Test question components (QuestionDisplay, OptionSelector)
  - [x] Test reasoning components (all strategy views)
  - [x] Test layout components (Header, Sidebar, Layout)
  - [x] Test Zustand stores (questionStore, sessionStore)
  - [x] Test custom hooks (useKeyboard)
- [x] Set up Playwright E2E testing
  - [x] Install Playwright
  - [x] Configure for project
  - [x] Create page object models
  - [x] Set up test fixtures
- [x] Write E2E test suites
  - [x] Dashboard flow tests
  - [x] Practice session flow tests
  - [x] Session review flow tests
  - [x] Keyboard navigation tests
  - [x] Accessibility tests
- [x] Set up backend testing infrastructure
  - [x] Install pytest and dependencies
  - [x] Configure pytest for async tests
  - [x] Create shared fixtures
- [x] Write backend tests
  - [x] API route tests (questions, sessions, graph)
  - [x] Service tests
  - [x] Repository tests
  - [x] Model tests
- [x] CI/CD integration
  - [x] Add test scripts to package.json
  - [x] Configure coverage reporting
  - [x] Set up GitHub Actions workflow

### Phase 14: Real Database Integration
- [x] Set up FalkorDB instance
   - [x] Install falkordb Python package
   - [x] Update graph_service.py to use falkordb library
   - [x] Configure connection settings (localhost:6379)
   - [x] Create knowledge graph seeding script
   - [x] Seed initial medical genetics data (29 nodes, 51 edges)
   - [x] Test graph queries
- [x] Set up PostgreSQL database (local Docker container)
   - [x] Create gsd-postgres Docker container (port 5433)
   - [x] Create standalone database schema (supabase/migrations/standalone_schema.sql)
   - [x] Run schema migrations
   - [x] Seed initial question data (15 medical genetics questions)
- [x] Connect backend to PostgreSQL via SQLAlchemy
   - [x] Update database.py for SQLAlchemy engine support
   - [x] Update question_repository.py for SQLAlchemy
   - [x] Update session_repository.py for SQLAlchemy
   - [x] Configure environment variables (DATABASE_URL)
   - [x] Test database connectivity
   - [x] Verify all API endpoints work with real data
- [x] Migrate from mock to real data
   - [x] Set USE_MOCK_DATA=false in .env
   - [x] Verify questions API returns database data
   - [x] Verify sessions API works with database

### Phase 15: Real LLM Integration
- [x] Configure GLM-4.7 API access
   - [x] Obtain API credentials
   - [x] Set up environment configuration
   - [x] Create API client wrapper
- [x] Implement real question generation
   - [x] Design prompt templates for medical genetics
   - [x] Implement structured output parsing
   - [x] Add validation for generated questions
   - [x] Create fallback mechanisms
- [x] Implement real reasoning generation
   - [x] Design prompts for each reasoning strategy
   - [x] Parse and validate reasoning outputs
   - [x] Handle API errors gracefully
- [x] Add caching and optimization
   - [x] Implement request queuing with retry logic
   - [x] Add rate limiting compliance
   - [x] Add mock fallback for reliability

### Phase 16: User Authentication
- [x] Implement Supabase Auth
  - [x] Set up authentication providers (email/password)
  - [x] Create user registration flow
  - [x] Create login/logout flow
  - [x] Implement password reset
- [x] Update frontend auth state
  - [x] Create auth store (Zustand)
  - [x] Add protected routes
  - [x] Create login/register pages
  - [x] Handle session persistence
- [x] Update backend auth
  - [x] Validate JWT tokens
  - [x] Add user context to requests
  - [x] Implement user-specific data access
- [x] Add user profile features
  - [x] Profile page
  - [x] Settings persistence
  - [x] Learning preferences

### Phase 17: Performance Optimization
- [x] Frontend optimization
  - [x] Code splitting and lazy loading
  - [x] Image optimization
  - [x] Bundle size analysis
  - [x] Service worker for caching
- [x] Backend optimization
  - [x] Database query optimization
  - [x] Add connection pooling
  - [x] Implement caching layer (Redis)
  - [x] API response compression
- [x] Load testing
  - [x] Set up load testing tools
  - [x] Identify bottlenecks
  - [x] Optimize critical paths

### Phase 18: Deployment
- [x] Set up production environment
   - [x] Configure production environment variables
   - [x] Set up SSL certificates
   - [x] Configure domain names
- [x] Deploy backend
   - [x] Choose hosting provider (Railway, Render, etc.)
   - [x] Configure deployment settings
   - [x] Set up monitoring and logging
- [x] Deploy frontend
   - [x] Build production bundle
   - [x] Deploy to CDN (Vercel, Netlify, etc.)
   - [x] Configure environment variables
- [x] Set up CI/CD pipeline
   - [x] Automated testing on PR
   - [x] Automated deployment on merge
   - [x] Environment-specific deployments
- [x] Post-deployment
   - [x] Verify all features work
   - [x] Set up error tracking (Sentry)
   - [x] Configure backups
   - [x] Document runbook

---

## Mock Data Examples

### Sample Question
```json
{
  "id": "q001",
  "stem": "A 4-month-old infant presents with failure to thrive, hepatosplenomegaly, and developmental regression. Physical exam reveals cherry-red spot in the macula. Laboratory studies show normal liver enzymes but absent hexosaminidase A activity in leukocytes.",
  "options": {
    "A": "Niemann-Pick disease type A",
    "B": "Tay-Sachs disease",
    "C": "Gaucher disease type 1",
    "D": "Fabry disease",
    "E": "Krabbe disease"
  },
  "correct_answer": "B",
  "difficulty": "medium",
  "category": "Lysosomal Storage Disorders"
}
```

### Sample Knowledge Graph
```json
{
  "nodes": [
    {"id": "n1", "type": "finding", "name": "4-month-old infant"},
    {"id": "n2", "type": "finding", "name": "hepatosplenomegaly"},
    {"id": "n3", "type": "finding", "name": "cherry-red spot"},
    {"id": "n4", "type": "finding", "name": "absent hex A"},
    {"id": "n5", "type": "condition", "name": "Tay-Sachs disease"},
    {"id": "n6", "type": "condition", "name": "Niemann-Pick type A"},
    {"id": "n7", "type": "gene", "name": "HEXA gene"}
  ],
  "edges": [
    {"source": "n5", "target": "n3", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "n5", "target": "n4", "relationship": "HAS_FINDING", "weight": 1.0},
    {"source": "n5", "target": "n7", "relationship": "CAUSED_BY", "weight": 1.0},
    {"source": "n6", "target": "n2", "relationship": "HAS_FINDING", "weight": 0.9},
    {"source": "n6", "target": "n3", "relationship": "HAS_FINDING", "weight": 0.5}
  ]
}
```

---

## Development Commands

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server on :5173
npm run build        # Production build
npm run preview      # Preview production build
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## Next Steps

**Phases 1-24 Complete!** The application is fully functional with real database, LLM integration, user authentication, advanced learning features, custom study plans, upgraded graph visualization, AI Tutor Mode, comprehensive testing, and Admin Dashboard.

### Implementation Progress:

1. ~~**Phase 14 - Real Database Integration**~~: ✅ Complete - PostgreSQL and FalkorDB connected
2. ~~**Phase 15 - Real LLM Integration**~~: ✅ Complete - GLM-4 API connected with fallback
3. ~~**Phase 16 - User Authentication**~~: ✅ Complete - JWT-based auth with login/register/profile pages
4. ~~**Phase 17 - Performance Optimization**~~: ✅ Complete - Code splitting, caching, load testing
5. ~~**Phase 18 - Deployment**~~: ✅ Complete - Production environment, CI/CD, monitoring
6. ~~**Phase 19 - Advanced Learning Features**~~: ✅ Complete - SRS, Bookmarks, Analytics, Study Plans
7. ~~**Phase 20 - Custom Study Plans UI**~~: ✅ Complete - Full study plan management with tasks and calendar
8. ~~**Phase 21 - Graph Visualization Upgrade**~~: ✅ Complete - React Flow with temporal graph support
9. ~~**Phase 22 - AI Tutor Mode**~~: ✅ Complete - Interactive tutoring with adaptive hints and Socratic questioning
10. ~~**Phase 23 - AI Tutor Mode Testing**~~: ✅ Complete - Comprehensive test coverage for all tutor features
11. ~~**Phase 24 - Admin Dashboard**~~: ✅ Complete - User management, question reports, analytics, settings

### Current Status:
- ✅ Frontend: React + TypeScript + TailwindCSS + Zustand
- ✅ Backend: FastAPI + Pydantic + async support
- ✅ Testing: 233+ frontend tests passing, E2E tests configured
- ✅ API: All endpoints implemented with real database
- ✅ Database: PostgreSQL (questions, sessions) + FalkorDB (knowledge graph)
- ✅ LLM: GLM-4 API connected with rate limit handling and mock fallback
- ✅ Reasoning: 4 strategies visualized (Association, Hypothetico, Constraints, Arguments)
- ✅ Authentication: JWT-based auth with protected routes and user profile
- ✅ Spaced Repetition: SM-2 algorithm with review queue and statistics
- ✅ Bookmarks: Save questions with notes and tags
- ✅ Study Plans: Custom plans with milestones, daily tasks, and calendar view
- ✅ Graph Visualization: React Flow with custom nodes and temporal graph support
- ✅ AI Tutor: Interactive tutoring with hints, explanations, and learning insights
- ✅ Tutor Testing: Full test coverage for backend and frontend tutor features
- ✅ Admin Dashboard: User management, question reports, analytics, system settings

### Phase 19 Features Implemented:

#### 19.1 Spaced Repetition System (SRS)
- SM-2 algorithm implementation for optimal review scheduling
- Review queue with due/overdue tracking
- Quality rating system (0-5) for recall assessment
- SRS statistics dashboard widget
- API endpoints: `/api/v1/review/*`

#### 19.2 Question Bookmarking
- Save questions with personal notes
- Tag-based organization
- Search and filter bookmarks
- API endpoints: `/api/v1/bookmarks/*`

#### 19.3 Enhanced Analytics (Schema Ready)
- Database tables for analytics events and daily stats
- Foundation for velocity charts and heatmaps

#### 19.4 Custom Study Plans (Schema Ready)
- Database tables for study plans, milestones, and daily tasks
- Foundation for personalized learning paths

### Phase 20 Features Implemented:

#### 20.1 Study Plan Management
- Create plans with custom settings (daily goals, categories, study days)
- Multi-step wizard for plan creation
- Plan status management (active, paused, completed)
- API endpoints: `/api/v1/study-plans`

#### 20.2 Milestones
- Add milestones with target dates
- Track milestone completion
- Visual timeline progress view

#### 20.3 Daily Tasks
- Auto-generated tasks based on plan settings
- Task types: practice questions, SRS reviews, bookmark reviews
- Progress tracking with increment functionality
- Task calendar view

#### 20.4 Dashboard Integration
- Today's Tasks widget showing daily progress
- Active Plans summary with quick access
- Practice session integration with task progress
- [x] Backend: Create Pydantic models for study plans
   - [x] StudyPlan, Milestone, DailyTask models
   - [x] Create/Update/Progress request/response models
- [x] Backend: Create study_plan_repository.py
   - [x] CRUD operations for plans, milestones, tasks
   - [x] Task generation logic based on plan settings
   - [x] Progress calculation methods
- [x] Backend: Create study plan API routes
   - [x] GET/POST /api/v1/study-plans
   - [x] GET/PUT/DELETE /api/v1/study-plans/{id}
   - [x] Milestone and task endpoints
   - [x] Progress and calendar endpoints
- [x] Frontend: Create TypeScript types and service
- [x] Frontend: Build study plan components
   - [x] StudyPlanList - List all plans with status
   - [x] StudyPlanCreate - Multi-step wizard for plan creation
   - [x] StudyPlanDetail - Plan overview with progress
   - [x] MilestoneTracker - Visual milestone progress
   - [x] DailyTaskList - Today's tasks view
   - [x] PlanCalendar - Calendar view of tasks
- [x] Frontend: Integrate with Dashboard
   - [x] Today's Tasks widget
   - [x] Active Plans summary
- [x] Connect practice sessions to task progress
- [x] Write tests for study plan features

### Phase 21: Graph Visualization Upgrade
- [x] Research graph visualization libraries
   - [x] Compare React Flow, Cytoscape.js, D3.js, Sigma.js
   - [x] Document findings in plans/graph_visualization_research.md
- [x] Replace Reaflow with React Flow
   - [x] Install reactflow and dagre packages
   - [x] Create custom node components for each entity type
   - [x] Implement automatic layout using dagre
   - [x] Update KnowledgeGraph component
   - [x] Add minimap, controls, and background
- [x] Add temporal knowledge graph support
   - [x] Install zep-python package
   - [x] Create TemporalGraphService with Graphiti-like features
   - [x] Support temporal queries and learning history
   - [x] Integrate with FalkorDB backend

### Phase 22: AI Tutor Mode
- [x] Backend: Create tutor data models
   - [x] TutorSession, TutorMessage, Hint, Explanation models
   - [x] AnswerAnalysis, LearningInsights models
   - [x] Request/Response models for API
- [x] Backend: Create database schema
   - [x] tutor_sessions table
   - [x] tutor_messages table
   - [x] learning_insights table
   - [x] hint_usage table
- [x] Backend: Implement tutor services
   - [x] TutorService - main orchestration
   - [x] tutor_repository.py - data access layer
   - [x] tutor_prompts.py - LLM prompt templates
- [x] Backend: Create tutor API routes
   - [x] POST /api/v1/tutor/sessions
   - [x] GET /api/v1/tutor/sessions/{id}
   - [x] POST /api/v1/tutor/sessions/{id}/hint
   - [x] POST /api/v1/tutor/sessions/{id}/ask
   - [x] POST /api/v1/tutor/sessions/{id}/explain
   - [x] POST /api/v1/tutor/sessions/{id}/analyze
   - [x] POST /api/v1/tutor/sessions/{id}/end
   - [x] GET /api/v1/tutor/history
   - [x] GET /api/v1/tutor/insights
   - [x] GET /api/v1/tutor/dashboard
- [x] Frontend: Create TypeScript types
   - [x] TutorSession, TutorMessage, Hint types
   - [x] Explanation, AnswerAnalysis types
   - [x] API request/response types
- [x] Frontend: Create tutor service
   - [x] API client methods for all endpoints
   - [x] Error handling and retries
- [x] Frontend: Create tutor store (Zustand)
   - [x] Session state management
   - [x] Message history
   - [x] Hint level tracking
- [x] Frontend: Build tutor components
   - [x] TutorPanel - main chat interface
   - [x] TutorMessage - message bubbles
   - [x] HintButton - request hint with level indicator
   - [x] TutorInput - user input field
   - [x] TutorInsightsWidget - learning insights display
- [x] Frontend: Integrate with practice session
   - [x] Add tutor panel to PracticeSession page
   - [x] Connect to question display
- [x] Frontend: Add dashboard widget
   - [x] Learning insights summary
   - [x] Recent tutor sessions

### Phase 23: AI Tutor Mode Testing
- [x] Backend tests for tutor API routes
   - [x] Test session endpoints (start, get, end)
   - [x] Test hint endpoint
   - [x] Test question/ask endpoint
   - [x] Test explanation endpoint
   - [x] Test answer analysis endpoint
   - [x] Test history and insights endpoints
   - [x] Test dashboard stats endpoint
- [x] Backend tests for tutor service
   - [x] Test session management
   - [x] Test hint generation
   - [x] Test question handling
   - [x] Test explanation generation
   - [x] Test answer analysis
   - [x] Test Socratic question generation
   - [x] Test learning insights
- [x] Backend tests for tutor repository
   - [x] Test session CRUD operations
   - [x] Test message operations
   - [x] Test insights operations
   - [x] Test hint usage tracking
   - [x] Test dashboard stats
- [x] Frontend tests for tutor components
   - [x] TutorPanel component tests
   - [x] TutorMessage component tests
   - [x] TutorInput component tests
   - [x] HintButton component tests
   - [x] TutorInsightsWidget component tests
- [x] Frontend tests for tutor store
   - [x] Test session actions
   - [x] Test message actions
   - [x] Test hint actions
   - [x] Test panel actions
   - [x] Test error handling
   - [x] Test insights and history
- [x] Frontend tests for tutor service
   - [x] Test session API calls
   - [x] Test hint API calls
   - [x] Test question API calls
   - [x] Test explanation API calls
   - [x] Test answer analysis API calls
   - [x] Test history and insights API calls
- [x] E2E tests for tutor flow
   - [x] Tutor panel visibility tests
   - [x] Tutor interaction tests
   - [x] Hint functionality tests
   - [x] Keyboard navigation tests
   - [x] Accessibility tests
   - [x] Responsive design tests

### Phase 24: Admin Dashboard
- [x] Backend: Database schema updates
   - [x] Add role column to users table
   - [x] Create admin_logs table for audit trail
   - [x] Create admin_settings table for system config
   - [x] Create question_reports table for user reports
   - [x] Add RLS policies for admin tables
- [x] Backend: Admin models
   - [x] AdminLog, AdminAction models
   - [x] UserAdminView, UserAdminUpdate models
   - [x] QuestionReport models
   - [x] AdminSetting models
   - [x] Analytics models (overview, growth, stats)
- [x] Backend: Admin repository
   - [x] User management queries
   - [x] Admin log CRUD
   - [x] Settings management
   - [x] Reports management
   - [x] Analytics aggregation
- [x] Backend: Admin service
   - [x] User management logic with audit logging
   - [x] Report resolution logic
   - [x] Settings management with audit
   - [x] Analytics methods
- [x] Backend: Admin API routes
   - [x] GET /admin/dashboard
   - [x] GET/PUT /admin/users
   - [x] POST /admin/users/{id}/activate|deactivate
   - [x] GET/PUT /admin/reports
   - [x] GET/PUT /admin/settings
   - [x] GET /admin/analytics/*
   - [x] GET /admin/logs
- [x] Frontend: Admin types
   - [x] TypeScript interfaces for all admin models
- [x] Frontend: Admin service
   - [x] API client methods for all endpoints
- [x] Frontend: Admin store (Zustand)
   - [x] State management for users, reports, settings, analytics
   - [x] Actions for all CRUD operations
- [x] Frontend: Admin pages
   - [x] AdminPanel - dashboard overview
   - [x] AdminUsers - user management table
- [x] Frontend: Admin route protection
   - [x] AdminRoute component with role check
   - [x] Access denied page for non-admins

---

*Implementation Plan v1.6 - GeneReason Medical Genetics MCQ Training App*
