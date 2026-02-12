-- GeneReason Database Schema for Supabase
-- Migration: Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stem TEXT NOT NULL,
    options JSONB NOT NULL,  -- {"A": "text", "B": "text", ...}
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    source_reference TEXT,
    explanation TEXT,
    key_concepts TEXT[],  -- Array of key concept strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0
);

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    settings JSONB DEFAULT '{}'::jsonb,  -- {"category": "...", "difficulty": "...", "question_count": 10}
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0
);

-- Create index for user sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);

-- ============================================
-- SESSION QUESTIONS TABLE (Junction table)
-- ============================================
CREATE TABLE IF NOT EXISTS session_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    user_answer CHAR(1) CHECK (user_answer IN ('A', 'B', 'C', 'D', 'E')),
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE,
    reasoning_viewed BOOLEAN DEFAULT FALSE,
    UNIQUE(session_id, question_order)
);

-- Create index for session questions
CREATE INDEX IF NOT EXISTS idx_session_questions_session ON session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_question ON session_questions(question_id);

-- ============================================
-- USER PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    last_practiced TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, category)
);

-- Create index for user progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_category ON user_progress(category);

-- ============================================
-- KNOWLEDGE GRAPHS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_graphs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    nodes JSONB NOT NULL,  -- Array of graph nodes
    edges JSONB NOT NULL,  -- Array of graph edges
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REASONING RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reasoning_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    strategy VARCHAR(50) NOT NULL CHECK (strategy IN ('association', 'hypothetico', 'constraints', 'arguments')),
    steps JSONB NOT NULL,  -- Array of reasoning steps
    conclusion TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, strategy)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_results ENABLE ROW LEVEL SECURITY;

-- Questions are readable by all authenticated users
CREATE POLICY "Questions are viewable by all" ON questions
    FOR SELECT USING (is_active = TRUE);

-- Sessions are only visible to the user who created them
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Session questions follow session access
CREATE POLICY "Users can view own session questions" ON session_questions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_questions.session_id AND sessions.user_id = auth.uid())
    );

-- User progress is private
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================
-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update question statistics
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_correct IS NOT NULL THEN
        UPDATE questions
        SET times_answered = times_answered + 1,
            times_correct = times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END
        WHERE id = NEW.question_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_question_stats_trigger AFTER INSERT OR UPDATE ON session_questions
    FOR EACH ROW EXECUTE FUNCTION update_question_stats();

-- Function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_category VARCHAR(100);
    v_user_id UUID;
BEGIN
    IF NEW.is_correct IS NOT NULL THEN
        -- Get category and user_id from the question and session
        SELECT q.category, s.user_id INTO v_category, v_user_id
        FROM questions q
        JOIN session_questions sq ON q.id = sq.question_id
        JOIN sessions s ON s.id = sq.session_id
        WHERE sq.id = NEW.id;
        
        IF v_user_id IS NOT NULL THEN
            INSERT INTO user_progress (user_id, category, total_questions, correct_answers, last_practiced)
            VALUES (v_user_id, v_category, 1, CASE WHEN NEW.is_correct THEN 1 ELSE 0 END, NOW())
            ON CONFLICT (user_id, category) DO UPDATE SET
                total_questions = user_progress.total_questions + 1,
                correct_answers = user_progress.correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
                last_practiced = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_progress_trigger AFTER INSERT OR UPDATE ON session_questions
    FOR EACH ROW EXECUTE FUNCTION update_user_progress();
