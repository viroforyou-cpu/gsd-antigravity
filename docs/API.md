# GeneReason API Documentation

## Base URL

- Development: `http://localhost:8002`
- Production: `https://api.genereason.com`
- API Prefix: `/api/v1`

## Authentication

Most endpoints require Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Demo Credentials (Development Only)

- **User**: `demo@genereason.com` / `demo123456`
- **Admin**: `admin@genereason.com` / `admin123456`

---

## Endpoints

### Authentication

#### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "optional_username"
}
```

**Response** `201 Created`
```json
{
  "id": "user_003",
  "email": "user@example.com",
  "username": "optional_username",
  "role": "user",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** `200 OK` - Same as login response

#### Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{
  "id": "user_001",
  "email": "demo@genereason.com",
  "username": "demo_user",
  "role": "user",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Change Password

```http
POST /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "oldpassword",
  "new_password": "newsecurepassword123"
}
```

**Response** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

#### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

---

### Questions

#### List Questions

```http
GET /api/v1/questions?skip=0&limit=10&category=Lysosomal%20Storage%20Disorders
```

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | int | 0 | Number of items to skip |
| limit | int | 10 | Max items to return |
| category | string | - | Filter by category |
| difficulty | string | - | Filter by difficulty (easy/medium/hard) |

**Response** `200 OK`
```json
{
  "items": [
    {
      "id": "q001",
      "stem": "A 4-month-old infant presents with...",
      "options": {
        "A": "Niemann-Pick disease type A",
        "B": "Tay-Sachs disease",
        "C": "Gaucher disease type 1",
        "D": "Fabry disease",
        "E": "Krabbe disease"
      },
      "correct_answer": "B",
      "difficulty": "medium",
      "category": "Lysosomal Storage Disorders",
      "source_reference": "Smith's Recognizable Patterns of Human Malformation",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "skip": 0,
  "limit": 10
}
```

#### Get Random Question

```http
GET /api/v1/questions/random?category=Lysosomal%20Storage%20Disorders
```

**Response** `200 OK` - Single question object

#### Get Question by ID

```http
GET /api/v1/questions/{id}
```

**Response** `200 OK` - Single question object

#### Get Question Graph

```http
GET /api/v1/questions/{id}/graph
```

**Response** `200 OK`
```json
{
  "nodes": [
    {"id": "n1", "type": "finding", "name": "4-month-old infant"},
    {"id": "n2", "type": "condition", "name": "Tay-Sachs disease"}
  ],
  "edges": [
    {"source": "n2", "target": "n1", "relationship": "HAS_FINDING", "weight": 0.9}
  ]
}
```

---

### Sessions

#### Start New Session

```http
POST /api/v1/sessions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "category": "Lysosomal Storage Disorders",
  "question_count": 10,
  "difficulty": "medium"
}
```

**Response** `201 Created`
```json
{
  "id": "sess_001",
  "user_id": "user_001",
  "questions": [...],
  "answers": {},
  "started_at": "2024-01-15T10:30:00Z",
  "current_index": 0,
  "status": "active"
}
```

#### Get Session

```http
GET /api/v1/sessions/{id}
Authorization: Bearer <access_token>
```

**Response** `200 OK` - Session object

#### Submit Answer

```http
PUT /api/v1/sessions/{id}/answer
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "question_id": "q001",
  "answer": "B",
  "time_spent_seconds": 45
}
```

**Response** `200 OK`
```json
{
  "correct": true,
  "correct_answer": "B",
  "explanation": "Tay-Sachs disease is characterized by..."
}
```

#### Complete Session

```http
POST /api/v1/sessions/{id}/complete
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{
  "id": "sess_001",
  "status": "completed",
  "completed_at": "2024-01-15T11:00:00Z",
  "score": {
    "correct": 8,
    "total": 10,
    "percentage": 80
  }
}
```

#### Get Session Review

```http
GET /api/v1/sessions/{id}/review
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{
  "session": {...},
  "questions": [
    {
      "question": {...},
      "user_answer": "B",
      "correct_answer": "B",
      "is_correct": true,
      "time_spent_seconds": 45,
      "reasoning": {...}
    }
  ],
  "summary": {
    "total_questions": 10,
    "correct_answers": 8,
    "score_percentage": 80,
    "total_time_seconds": 450,
    "categories": {
      "Lysosomal Storage Disorders": {"correct": 4, "total": 5}
    }
  }
}
```

---

### Reasoning

#### Analyze Question (All Strategies)

```http
POST /api/v1/reasoning/analyze
Content-Type: application/json

{
  "question_id": "q001"
}
```

**Response** `200 OK`
```json
{
  "question_id": "q001",
  "strategies": {
    "association": {...},
    "hypothetico": {...},
    "constraints": {...},
    "arguments": {...}
  }
}
```

#### Association Reasoning

```http
POST /api/v1/reasoning/association
Content-Type: application/json

{
  "question_id": "q001"
}
```

**Response** `200 OK`
```json
{
  "strategy": "association",
  "question_id": "q001",
  "steps": [
    {
      "step_number": 1,
      "description": "Identify key clinical findings",
      "evidence": ["cherry-red spot", "absent hex A", "developmental regression"]
    }
  ],
  "conclusion": "Tay-Sachs disease is the most likely diagnosis",
  "confidence": 0.95,
  "graph": {...}
}
```

#### Hypothetico-Deductive Reasoning

```http
POST /api/v1/reasoning/hypothetico
Content-Type: application/json

{
  "question_id": "q001"
}
```

**Response** `200 OK`
```json
{
  "strategy": "hypothetico",
  "question_id": "q001",
  "hypotheses": [
    {
      "option": "A",
      "condition": "Niemann-Pick type A",
      "predictions": ["hepatosplenomegaly", "cherry-red spot"],
      "verified": ["cherry-red spot"],
      "falsified": [],
      "score": 0.5
    }
  ],
  "conclusion": "Option B (Tay-Sachs) has highest verification score",
  "confidence": 0.9
}
```

#### Constraint Satisfaction

```http
POST /api/v1/reasoning/constraints
Content-Type: application/json

{
  "question_id": "q001"
}
```

**Response** `200 OK`
```json
{
  "strategy": "constraints",
  "question_id": "q001",
  "constraints": [
    {
      "finding": "absent hexosaminidase A",
      "eliminates": ["A", "C", "D", "E"],
      "reasoning": "Only Tay-Sachs has absent hex A with these findings"
    }
  ],
  "remaining_options": ["B"],
  "conclusion": "Option B is the only option satisfying all constraints",
  "confidence": 1.0
}
```

#### Argument-Based Reasoning

```http
POST /api/v1/reasoning/arguments
Content-Type: application/json

{
  "question_id": "q001"
}
```

**Response** `200 OK`
```json
{
  "strategy": "arguments",
  "question_id": "q001",
  "arguments": [
    {
      "option": "B",
      "condition": "Tay-Sachs disease",
      "supporting": [
        {"evidence": "cherry-red spot", "strength": "strong"},
        {"evidence": "absent hex A", "strength": "definitive"}
      ],
      "opposing": [
        {"evidence": "no hepatosplenomegaly mentioned", "strength": "weak"}
      ],
      "net_score": 0.9
    }
  ],
  "conclusion": "Strongest argument supports option B",
  "confidence": 0.9
}
```

---

### Progress

#### Get Dashboard Data

```http
GET /api/v1/progress/dashboard
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{
  "total_sessions": 25,
  "total_questions": 250,
  "overall_accuracy": 0.78,
  "recent_sessions": [...],
  "improvement_trend": "improving",
  "weak_categories": ["Mitochondrial Disorders"],
  "strong_categories": ["Lysosomal Storage Disorders"]
}
```

#### Get Progress by Category

```http
GET /api/v1/progress/categories
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{
  "categories": [
    {
      "name": "Lysosomal Storage Disorders",
      "total_questions": 50,
      "correct": 42,
      "accuracy": 0.84,
      "avg_time_seconds": 45,
      "trend": "improving"
    }
  ]
}
```

#### Get History

```http
GET /api/v1/progress/history?days=30
Authorization: Bearer <access_token>
```

**Response** `200 OK`
```json
{
  "history": [
    {
      "date": "2024-01-15",
      "sessions": 2,
      "questions": 20,
      "correct": 16,
      "accuracy": 0.80
    }
  ]
}
```

---

### LLM

#### Get LLM Status

```http
GET /api/v1/llm/status
```

**Response** `200 OK`
```json
{
  "available": true,
  "model": "glm-4-plus",
  "mock_mode": false
}
```

#### Get Available Strategies

```http
GET /api/v1/llm/strategies
```

**Response** `200 OK`
```json
{
  "strategies": [
    {
      "id": "association",
      "name": "Association/Graph-Based",
      "description": "Uses knowledge graph connections"
    }
  ]
}
```

#### Generate Question

```http
POST /api/v1/llm/generate-question
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "category": "Lysosomal Storage Disorders",
  "difficulty": "medium"
}
```

**Response** `201 Created` - Question object

---

### Graph

#### Get Graph Status

```http
GET /api/v1/graph/status
```

**Response** `200 OK`
```json
{
  "available": true,
  "connected": true,
  "node_count": 1500,
  "edge_count": 5000,
  "mock_mode": false
}
```

#### Get Question Graph

```http
GET /api/v1/graph/question/{question_id}
```

**Response** `200 OK` - Knowledge graph object

#### Find Associations

```http
POST /api/v1/graph/associations
Content-Type: application/json

{
  "findings": ["cherry-red spot", "hepatosplenomegaly"],
  "max_results": 10
}
```

**Response** `200 OK`
```json
{
  "associations": [
    {
      "condition": "Niemann-Pick type A",
      "score": 0.85,
      "matching_findings": 2,
      "path": ["cherry-red spot", "n1", "n2", "Niemann-Pick"]
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message",
  "errors": [
    {
      "loc": ["body", "email"],
      "msg": "Invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Default**: 60 requests per minute
- **Hourly limit**: 1000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642234567
```
