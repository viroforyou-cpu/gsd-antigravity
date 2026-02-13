# Phase 22: AI Tutor Mode - Architecture Design

## Overview

Phase 22 introduces an intelligent AI Tutor that provides interactive, personalized learning experiences. The tutor acts as a virtual mentor, guiding users through questions using Socratic questioning, adaptive hints, and personalized explanations.

## Goals

1. **Interactive Tutoring Sessions**: Real-time conversational AI tutor
2. **Adaptive Hints**: Context-aware hints that adjust to user proficiency
3. **Personalized Explanations**: Tailored to learning style and knowledge gaps
4. **Socratic Questioning**: Guide users to discover answers independently
5. **Learning Path Adaptation**: Dynamic difficulty and topic adjustment

---

## Architecture Components

### 1. Backend - Tutor Service

```
backend/app/services/
├── tutor_service.py          # Main tutor orchestration
├── hint_service.py           # Adaptive hint generation
├── socratic_service.py       # Socratic questioning engine
├── explanation_service.py    # Personalized explanations
└── learning_analyzer.py      # User learning pattern analysis
```

#### Tutor Service Interface

```python
class TutorServiceInterface:
    async def start_session(self, question_id: str, user_id: str) -> TutorSession
    async def get_hint(self, session_id: str, hint_level: int) -> Hint
    async def ask_question(self, session_id: str, user_question: str) -> TutorResponse
    async def explain_concept(self, session_id: str, concept: str) -> Explanation
    async def analyze_answer(self, session_id: str, answer: str) -> AnswerAnalysis
    async def end_session(self, session_id: str) -> SessionSummary
```

### 2. Backend - API Routes

```
backend/app/api/routes/
└── tutor.py                  # Tutor API endpoints
```

#### API Endpoints

```
POST   /api/v1/tutor/sessions              # Start tutor session
GET    /api/v1/tutor/sessions/{id}         # Get session state
POST   /api/v1/tutor/sessions/{id}/hint    # Request hint
POST   /api/v1/tutor/sessions/{id}/ask     # Ask tutor question
POST   /api/v1/tutor/sessions/{id}/explain # Request explanation
POST   /api/v1/tutor/sessions/{id}/analyze # Analyze user answer
POST   /api/v1/tutor/sessions/{id}/end     # End session
GET    /api/v1/tutor/history               # Get tutor session history
```

### 3. Backend - Data Models

```python
# backend/app/models/tutor.py

class TutorSession(BaseModel):
    id: str
    question_id: str
    user_id: str
    started_at: datetime
    status: Literal['active', 'completed', 'abandoned']
    hint_count: int
    messages: List[TutorMessage]
    learning_insights: Optional[LearningInsights]

class TutorMessage(BaseModel):
    id: str
    role: Literal['tutor', 'user']
    content: str
    message_type: Literal['question', 'hint', 'explanation', 'guidance', 'feedback']
    created_at: datetime

class Hint(BaseModel):
    id: str
    level: int  # 1-3, where 1 is subtle, 3 is explicit
    content: str
    focuses_on: List[str]  # Key concepts highlighted
    related_options: Optional[List[str]]

class Explanation(BaseModel):
    concept: str
    content: str
    difficulty: Literal['basic', 'intermediate', 'advanced']
    related_questions: List[str]
    visual_aids: Optional[List[VisualAid]]

class AnswerAnalysis(BaseModel):
    is_correct: bool
    reasoning_gaps: List[str]
    misconceptions: List[str]
    suggested_review: List[str]
    encouraging_feedback: str
```

### 4. Frontend - Components

```
frontend/src/components/tutor/
├── TutorPanel.tsx            # Main tutor chat interface
├── TutorMessage.tsx          # Individual message component
├── HintButton.tsx            # Request hint button with level indicator
├── TutorInput.tsx            # User input for asking questions
├── ExplanationModal.tsx      # Detailed explanation overlay
├── TutorInsights.tsx         # Learning insights display
└── index.ts                  # Exports
```

### 5. Frontend - Service

```typescript
// frontend/src/services/tutorService.ts

interface TutorService {
  startSession(questionId: string): Promise<TutorSession>;
  getSession(sessionId: string): Promise<TutorSession>;
  requestHint(sessionId: string, level?: number): Promise<Hint>;
  askQuestion(sessionId: string, question: string): Promise<TutorResponse>;
  requestExplanation(sessionId: string, concept: string): Promise<Explanation>;
  analyzeAnswer(sessionId: string, answer: string): Promise<AnswerAnalysis>;
  endSession(sessionId: string): Promise<SessionSummary>;
  getHistory(): Promise<TutorSession[]>;
}
```

### 6. Frontend - Store

```typescript
// frontend/src/stores/tutorStore.ts

interface TutorState {
  activeSession: TutorSession | null;
  messages: TutorMessage[];
  isLoading: boolean;
  hintLevel: number;
  
  startSession: (questionId: string) => Promise<void>;
  addMessage: (message: TutorMessage) => void;
  requestHint: () => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
  endSession: () => Promise<void>;
  reset: () => void;
}
```

---

## Feature Specifications

### Feature 22.1: Interactive Tutor Chat

**Description**: A chat-like interface where users can interact with the AI tutor during practice sessions.

**User Flow**:
1. User starts a practice question
2. Tutor panel appears on the right side
3. Tutor greets user and offers help
4. User can type questions or click hint button
5. Tutor responds with guidance, hints, or explanations
6. Conversation history is preserved during the session

**UI Components**:
- Collapsible side panel
- Message bubbles with role indicators
- Typing indicator for tutor responses
- Quick action buttons for common requests

### Feature 22.2: Adaptive Hint System

**Description**: Multi-level hint system that provides progressively more explicit guidance.

**Hint Levels**:
1. **Level 1 - Socratic**: Asks a guiding question to prompt thinking
2. **Level 2 - Directional**: Points to relevant concepts or findings
3. **Level 3 - Explicit**: Directly explains the reasoning step

**Adaptation Logic**:
- Track user's historical performance
- Adjust starting hint level based on difficulty
- Consider time spent on question
- Factor in previous hint requests

**Example**:
```
Question: 6-month-old with cherry-red spot, developmental regression

Level 1 Hint: "What findings in the question stem might help you 
distinguish between lysosomal storage disorders?"

Level 2 Hint: "The cherry-red spot is a key finding. Which 
lysosomal storage disorders commonly present with this finding?"

Level 3 Hint: "Tay-Sachs disease presents with cherry-red spot, 
developmental regression, and exaggerated startle response. 
The Ashkenazi Jewish heritage is a risk factor."
```

### Feature 22.3: Socratic Questioning Engine

**Description**: AI tutor asks probing questions to guide learning rather than giving answers.

**Question Types**:
1. **Clarifying**: "What do you understand by...?"
2. **Probing**: "What evidence supports your thinking?"
3. **Challenging**: "How would you explain the contradiction?"
4. **Connecting**: "How does this relate to what you know about...?"

**Implementation**:
- LLM prompt templates for each question type
- Context injection from question stem and knowledge graph
- Response analysis to determine follow-up questions

### Feature 22.4: Personalized Explanations

**Description**: Explanations tailored to user's learning style and knowledge gaps.

**Personalization Factors**:
- Historical performance on related topics
- Preferred explanation style (visual, textual, analogical)
- Identified knowledge gaps from previous sessions
- Current learning objectives from study plans

**Explanation Types**:
1. **Mechanism-based**: Explains underlying pathophysiology
2. **Comparison**: Contrasts with similar conditions
3. **Visual**: Includes diagram references
4. **Clinical**: Focuses on practical application

### Feature 22.5: Learning Insights

**Description**: Real-time analysis and feedback on learning patterns.

**Insights Tracked**:
- Common misconceptions identified
- Knowledge gaps discovered
- Reasoning patterns (strengths/weaknesses)
- Topics needing review
- Progress over time

**Display**:
- End-of-session summary
- Dashboard widget
- Weekly learning report

---

## Database Schema Additions

```sql
-- Tutor sessions table
CREATE TABLE tutor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    hint_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    learning_insights JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutor messages table
CREATE TABLE tutor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES tutor_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL, -- 'tutor' or 'user'
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning insights table
CREATE TABLE learning_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    topic VARCHAR(255),
    description TEXT NOT NULL,
    severity VARCHAR(20), -- 'low', 'medium', 'high'
    first_identified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    resolved BOOLEAN DEFAULT FALSE
);

-- Hint usage tracking
CREATE TABLE hint_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    session_id UUID REFERENCES tutor_sessions(id) ON DELETE CASCADE,
    hint_level INTEGER NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    was_helpful BOOLEAN,
    time_to_answer INTEGER -- seconds after hint
);
```

---

## LLM Prompt Templates

### Tutor Persona Prompt

```
You are an expert medical genetics tutor helping a resident prepare for 
board certification. Your role is to guide learning through Socratic 
questioning and supportive feedback.

Guidelines:
- Never give direct answers; guide thinking
- Adapt explanations to the learner's level
- Use clinical reasoning frameworks
- Connect concepts to build understanding
- Encourage and support the learner
- Identify and address misconceptions gently

Current context:
- Question: {question_stem}
- Options: {options}
- User's current selection: {user_selection}
- Conversation history: {history}
- User's learning profile: {learning_profile}
```

### Hint Generation Prompt

```
Generate a level {level} hint for this medical genetics question.

Question: {question_stem}
Options: {options}
Correct answer: {correct_answer}

Level 1: Ask a guiding question that prompts thinking
Level 2: Point to relevant concepts without revealing the answer
Level 3: Provide explicit guidance toward the correct reasoning

Format your response as:
{
  "content": "The hint text",
  "focuses_on": ["concept1", "concept2"],
  "related_options": ["A", "B"]
}
```

### Socratic Question Prompt

```
Based on the user's response, generate a Socratic follow-up question.

User's response: {user_response}
Correct reasoning: {correct_reasoning}
Key concepts to cover: {key_concepts}

Choose the appropriate question type:
- Clarifying: If the user seems confused
- Probing: If the user is on the right track
- Challenging: If the user has a misconception
- Connecting: If the user understands but could deepen knowledge

Response format:
{
  "question_type": "probing",
  "content": "The question text",
  "rationale": "Why this question type was chosen"
}
```

---

## Implementation Order

### Sprint 1: Foundation
1. Create database schema for tutor sessions
2. Implement TutorService interface with mock responses
3. Create basic API routes
4. Build TutorPanel component with chat interface
5. Integrate with practice session page

### Sprint 2: Core Features
1. Implement hint generation with LLM
2. Build adaptive hint level logic
3. Create Socratic questioning engine
4. Add message persistence
5. Build hint usage tracking

### Sprint 3: Personalization
1. Implement learning analyzer service
2. Create personalized explanation generator
3. Build learning insights tracking
4. Add user learning profile
5. Create insights dashboard widget

### Sprint 4: Polish
1. Add typing indicators and animations
2. Implement session summaries
3. Add quick action buttons
4. Create help documentation
5. Write comprehensive tests

---

## Success Metrics

1. **Engagement**: Average tutor interactions per question
2. **Learning**: Improvement in answer accuracy after tutor sessions
3. **Satisfaction**: User ratings of tutor helpfulness
4. **Retention**: Return usage of tutor feature
5. **Efficiency**: Time to correct answer with vs without tutor

---

## Technical Considerations

### Performance
- Cache common hint responses
- Stream tutor responses for better UX
- Lazy load tutor panel
- Debounce user input

### Error Handling
- Graceful fallback when LLM unavailable
- Retry logic for failed API calls
- User-friendly error messages
- Session recovery on page refresh

### Security
- Validate all user input
- Rate limit tutor requests
- Sanitize LLM responses
- Protect against prompt injection

### Accessibility
- Keyboard navigation for chat
- Screen reader support
- High contrast mode
- Reduced motion option

---

## Dependencies

- Existing LLM service (GLM-4)
- Knowledge graph service (FalkorDB)
- Session management
- User authentication
- Progress tracking

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| LLM gives incorrect guidance | Implement validation layer; use structured outputs |
| High API costs | Cache responses; implement smart rate limiting |
| Users become dependent | Encourage independent thinking; limit hints per question |
| Slow response times | Stream responses; pre-generate common hints |
| Inconsistent tutor persona | Use consistent prompt templates; persona validation |

---

*Phase 22 Architecture Design v1.0*
