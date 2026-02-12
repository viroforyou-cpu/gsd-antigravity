# Phase 1: Project Setup - Detailed Execution Guide

This document provides step-by-step commands and configurations for setting up the GeneReason project. Execute these in Code mode.

---

## Overview

**Goal**: Get both frontend (localhost:5173) and backend (localhost:8000) running with basic scaffolding.

**Time to complete**: ~10-15 minutes

---

## Part A: Frontend Setup

### Step A1: Create Vite Project

Run this command in the project root (`/home/bono/Desktop/GSD_antigravity`):

```bash
npm create vite@latest frontend -- --template react-ts
```

This creates:
- `frontend/` directory
- Vite + React + TypeScript configuration
- Basic project structure

### Step A2: Install Dependencies

Navigate to frontend and install all required packages:

```bash
cd frontend
npm install
```

Then install additional dependencies:

```bash
# State Management
npm install zustand

# Routing
npm install react-router-dom

# Graph Visualization
npm install reaflow

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Markdown Rendering
npm install react-markdown

# HTTP Client
npm install axios

# UI Utilities
npm install clsx
npm install lucide-react
```

### Step A3: Configure TailwindCSS

Update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
```

Update `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900;
}
```

### Step A4: Create Directory Structure

Create the following directories in `frontend/src/`:

```bash
mkdir -p src/components/common
mkdir -p src/components/question
mkdir -p src/components/graph
mkdir -p src/components/reasoning
mkdir -p src/components/layout
mkdir -p src/pages
mkdir -p src/stores
mkdir -p src/services
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/mock
```

### Step A5: Create TypeScript Types

Create `frontend/src/types/question.ts`:

```typescript
export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
}

export interface Question {
  id: string;
  stem: string;
  options: QuestionOptions;
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  source_reference?: string;
  created_at: string;
}

export interface QuestionWithUserAnswer extends Question {
  user_answer?: 'A' | 'B' | 'C' | 'D' | 'E';
  is_correct?: boolean;
}
```

Create `frontend/src/types/session.ts`:

```typescript
import { Question } from './question';

export interface Session {
  id: string;
  user_id?: string;
  questions: Question[];
  answers: Record<string, string>;
  started_at: string;
  completed_at?: string;
  current_index: number;
}

export interface SessionState {
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
}
```

Create `frontend/src/types/graph.ts`:

```typescript
export type NodeType = 'finding' | 'condition' | 'gene' | 'mechanism' | 'inheritance' | 'treatment';

export type EdgeRelationship = 
  | 'HAS_FINDING' 
  | 'CAUSED_BY' 
  | 'INHERITED_AS' 
  | 'TREATED_WITH'
  | 'DIAGNOSED_BY'
  | 'DIFFERENTIAL_OF'
  | 'CONSTRAINS'
  | 'SUPPORTS'
  | 'OPPOSES';

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: EdgeRelationship;
  weight?: number;
  properties?: Record<string, unknown>;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

Create `frontend/src/types/index.ts`:

```typescript
export * from './question';
export * from './session';
export * from './graph';
```

### Step A6: Create Basic Stores

Create `frontend/src/stores/sessionStore.ts`:

```typescript
import { create } from 'zustand';
import { Session, Question } from '../types';

interface SessionStore {
  currentSession: Session | null;
  isLoading: boolean;
  startSession: (questions: Question[]) => void;
  submitAnswer: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  completeSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentSession: null,
  isLoading: false,
  
  startSession: (questions) => set({
    currentSession: {
      id: crypto.randomUUID(),
      questions,
      answers: {},
      started_at: new Date().toISOString(),
      current_index: 0,
    },
  }),
  
  submitAnswer: (questionId, answer) => set((state) => ({
    currentSession: state.currentSession
      ? {
          ...state.currentSession,
          answers: { ...state.currentSession.answers, [questionId]: answer },
        }
      : null,
  })),
  
  nextQuestion: () => set((state) => ({
    currentSession: state.currentSession
      ? {
          ...state.currentSession,
          current_index: state.currentSession.current_index + 1,
        }
      : null,
  })),
  
  completeSession: () => set((state) => ({
    currentSession: state.currentSession
      ? { ...state.currentSession, completed_at: new Date().toISOString() }
      : null,
  })),
}));
```

### Step A7: Create Mock Data

Create `frontend/src/mock/questions.ts`:

```typescript
import { Question } from '../types';

export const mockQuestions: Question[] = [
  {
    id: 'q001',
    stem: 'A 4-month-old infant presents with failure to thrive, hepatosplenomegaly, and developmental regression. Physical exam reveals cherry-red spot in the macula. Laboratory studies show normal liver enzymes but absent hexosaminidase A activity in leukocytes.',
    options: {
      A: 'Niemann-Pick disease type A',
      B: 'Tay-Sachs disease',
      C: 'Gaucher disease type 1',
      D: 'Fabry disease',
      E: 'Krabbe disease',
    },
    correct_answer: 'B',
    difficulty: 'medium',
    category: 'Lysosomal Storage Disorders',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'q002',
    stem: 'A 6-year-old boy presents with progressive difficulty walking and frequent falls. His mother reports that he was a toe-walker since age 3. Physical examination reveals calf pseudohypertrophy, lumbar lordosis, and proximal muscle weakness. Creatine kinase level is 15,000 U/L.',
    options: {
      A: 'Spinal muscular atrophy type 2',
      B: 'Duchenne muscular dystrophy',
      C: 'Becker muscular dystrophy',
      D: 'Limb-girdle muscular dystrophy',
      E: 'Myotonic dystrophy type 1',
    },
    correct_answer: 'B',
    difficulty: 'easy',
    category: 'Muscular Disorders',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'q003',
    stem: 'A 2-week-old newborn presents with poor feeding, lethargy, and seizures. Laboratory evaluation reveals severe hypoglycemia, hyperammonemia, and metabolic acidosis with elevated anion gap. Urine organic acids show increased methylmalonic acid.',
    options: {
      A: 'Propionic acidemia',
      B: 'Methylmalonic acidemia',
      C: 'Isovaleric acidemia',
      D: 'Maple syrup urine disease',
      E: 'Urea cycle disorder',
    },
    correct_answer: 'B',
    difficulty: 'hard',
    category: 'Organic Acidemias',
    created_at: '2024-01-15T10:00:00Z',
  },
];
```

### Step A8: Update App.tsx

Replace `frontend/src/App.tsx`:

```tsx
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          GeneReason
        </h1>
        <p className="text-gray-600 mb-8">
          Medical Genetics MCQ Training App
        </p>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-green-600 font-medium mb-4">
            ✓ Frontend is running on localhost:5173
          </p>
          <button
            onClick={() => setCount(count + 1)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Test Button (clicked {count} times)
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
```

### Step A9: Verify Frontend

Run the development server:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in browser. You should see the GeneReason welcome page.

---

## Part B: Backend Setup

### Step B1: Create Backend Directory

```bash
mkdir -p backend/app/api/routes
mkdir -p backend/app/core
mkdir -p backend/app/models
mkdir -p backend/app/services
mkdir -p backend/app/mock
```

### Step B2: Create requirements.txt

Create `backend/requirements.txt`:

```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
httpx>=0.24.0
python-multipart>=0.0.6
```

### Step B3: Create Core Configuration

Create `backend/app/core/config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "GeneReason API"
    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:5173"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Step B4: Create Pydantic Models

Create `backend/app/models/question.py`:

```python
from pydantic import BaseModel
from typing import Optional
from enum import Enum

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuestionOptions(BaseModel):
    A: str
    B: str
    C: str
    D: str
    E: str

class Question(BaseModel):
    id: str
    stem: str
    options: QuestionOptions
    correct_answer: str  # 'A', 'B', 'C', 'D', or 'E'
    difficulty: Difficulty
    category: str
    source_reference: Optional[str] = None
    created_at: str
```

Create `backend/app/models/session.py`:

```python
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime
from .question import Question

class Session(BaseModel):
    id: str
    user_id: Optional[str] = None
    questions: List[Question]
    answers: Dict[str, str] = {}
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_index: int = 0

class SessionCreate(BaseModel):
    category: Optional[str] = None
    question_count: int = 10

class AnswerSubmit(BaseModel):
    question_id: str
    answer: str
```

Create `backend/app/models/__init__.py`:

```python
from .question import Question, QuestionOptions, Difficulty
from .session import Session, SessionCreate, AnswerSubmit
```

### Step B5: Create Mock Data

Create `backend/app/mock/questions.py`:

```python
from ..models.question import Question, QuestionOptions, Difficulty

mock_questions = [
    Question(
        id="q001",
        stem="A 4-month-old infant presents with failure to thrive, hepatosplenomegaly, and developmental regression. Physical exam reveals cherry-red spot in the macula. Laboratory studies show normal liver enzymes but absent hexosaminidase A activity in leukocytes.",
        options=QuestionOptions(
            A="Niemann-Pick disease type A",
            B="Tay-Sachs disease",
            C="Gaucher disease type 1",
            D="Fabry disease",
            E="Krabbe disease",
        ),
        correct_answer="B",
        difficulty=Difficulty.MEDIUM,
        category="Lysosomal Storage Disorders",
        created_at="2024-01-15T10:00:00Z",
    ),
    Question(
        id="q002",
        stem="A 6-year-old boy presents with progressive difficulty walking and frequent falls. His mother reports that he was a toe-walker since age 3. Physical examination reveals calf pseudohypertrophy, lumbar lordosis, and proximal muscle weakness. Creatine kinase level is 15,000 U/L.",
        options=QuestionOptions(
            A="Spinal muscular atrophy type 2",
            B="Duchenne muscular dystrophy",
            C="Becker muscular dystrophy",
            D="Limb-girdle muscular dystrophy",
            E="Myotonic dystrophy type 1",
        ),
        correct_answer="B",
        difficulty=Difficulty.EASY,
        category="Muscular Disorders",
        created_at="2024-01-15T10:00:00Z",
    ),
    Question(
        id="q003",
        stem="A 2-week-old newborn presents with poor feeding, lethargy, and seizures. Laboratory evaluation reveals severe hypoglycemia, hyperammonemia, and metabolic acidosis with elevated anion gap. Urine organic acids show increased methylmalonic acid.",
        options=QuestionOptions(
            A="Propionic acidemia",
            B="Methylmalonic acidemia",
            C="Isovaleric acidemia",
            D="Maple syrup urine disease",
            E="Urea cycle disorder",
        ),
        correct_answer="B",
        difficulty=Difficulty.HARD,
        category="Organic Acidemias",
        created_at="2024-01-15T10:00:00Z",
    ),
]
```

### Step B6: Create API Routes

Create `backend/app/api/routes/questions.py`:

```python
from fastapi import APIRouter
from ...models.question import Question
from ...mock.questions import mock_questions
import random

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/", response_model=list[Question])
async def get_questions():
    return mock_questions

@router.get("/{question_id}", response_model=Question)
async def get_question(question_id: str):
    for q in mock_questions:
        if q.id == question_id:
            return q
    return {"error": "Question not found"}

@router.get("/random", response_model=Question)
async def get_random_question():
    return random.choice(mock_questions)
```

Create `backend/app/api/routes/__init__.py`:

```python
from .questions import router as questions_router

__all__ = ["questions_router"]
```

### Step B7: Create Main Application

Create `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.routes import questions_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(questions_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "GeneReason API",
        "version": settings.app_version,
        "docs": "/docs",
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

Create `backend/app/__init__.py`:

```python
# Empty file to make app a package
```

### Step B8: Create Virtual Environment and Install

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step B9: Run Backend Server

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Verify:
- http://localhost:8000 - Should show API info
- http://localhost:8000/docs - Should show Swagger UI
- http://localhost:8000/api/v1/questions - Should return mock questions

---

## Part C: Verification Checklist

After completing all steps, verify:

### Frontend (localhost:5173)
- [ ] Vite dev server starts without errors
- [ ] Page loads with GeneReason title
- [ ] TailwindCSS styles are applied
- [ ] Button click works (state updates)

### Backend (localhost:8000)
- [ ] Uvicorn server starts without errors
- [ ] GET / returns API info
- [ ] GET /health returns {"status": "healthy"}
- [ ] GET /docs shows Swagger UI
- [ ] GET /api/v1/questions returns mock data

### Integration
- [ ] Frontend can fetch from backend (no CORS errors)
- [ ] Both servers can run simultaneously

---

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 5173
   lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
   
   # Kill process on port 8000
   lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
   ```

2. **npm install fails**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Python venv issues**
   ```bash
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **CORS errors in browser**
   - Ensure backend CORS settings include `http://localhost:5173`
   - Check that both servers are running

---

## Next Steps After Phase 1

Once both servers are running:
1. Proceed to Phase 2: Core UI Components
2. Build the question display component
3. Create the practice session flow
4. Implement reasoning visualization

---

*Phase 1 Setup Guide - GeneReason Medical Genetics MCQ Training App*
