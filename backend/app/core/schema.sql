-- GeneReason Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up the database

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

-- ============================================
-- SAMPLE DATA INSERTION (Optional)
-- ============================================
-- Uncomment and modify to insert sample data

/*
-- Insert a sample user
INSERT INTO users (email, display_name) VALUES 
    ('demo@geneason.com', 'Demo User');

-- Insert sample questions
INSERT INTO questions (stem, options, correct_answer, difficulty, category, explanation) VALUES
(
    'A 4-month-old infant presents with failure to thrive, hepatosplenomegaly, and developmental regression. Physical exam reveals cherry-red spot in the macula. Laboratory studies show normal liver enzymes but absent hexosaminidase A activity in leukocytes.',
    '{"A": "Niemann-Pick disease type A", "B": "Tay-Sachs disease", "C": "Gaucher disease type 1", "D": "Fabry disease", "E": "Krabbe disease"}',
    'B',
    'medium',
    'Lysosomal Storage Disorders',
    'Tay-Sachs disease is characterized by absent hexosaminidase A activity, cherry-red spot, and neurodegeneration without hepatosplenomegaly (which would suggest Niemann-Pick).'
);
*/

-- ============================================
-- PHASE 19: SPACED REPETITION SYSTEM
-- ============================================
-- Spaced repetition data for each user-question pair
CREATE TABLE IF NOT EXISTS spaced_repetition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    -- SM-2 Algorithm fields
    ease_factor DECIMAL(3,2) DEFAULT 2.50,  -- Difficulty multiplier
    interval_days INTEGER DEFAULT 0,         -- Days until next review
    repetitions INTEGER DEFAULT 0,           -- Consecutive correct recalls
    next_review_date DATE NOT NULL,          -- Scheduled review date
    last_review_date DATE,                   -- Last time reviewed
    -- Performance tracking
    total_reviews INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_spaced_repetition_user ON spaced_repetition(user_id);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_next_review ON spaced_repetition(next_review_date);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_user_next ON spaced_repetition(user_id, next_review_date);

-- ============================================
-- PHASE 19: QUESTION BOOKMARKS
-- ============================================
-- User bookmarks for questions
CREATE TABLE IF NOT EXISTS question_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    note TEXT,                              -- User's personal note
    tags TEXT[],                            -- User-defined tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON question_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON question_bookmarks USING GIN(tags);

-- ============================================
-- PHASE 19: ANALYTICS
-- ============================================
-- Detailed analytics events for rich insights
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,        -- question_answered, session_completed, etc.
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

-- Pre-computed daily stats for fast dashboard loading
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    categories_practiced TEXT[],
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);

-- ============================================
-- PHASE 19: STUDY PLANS
-- ============================================
-- Study plans
CREATE TABLE IF NOT EXISTS study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,                       -- Goal completion date
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    settings JSONB DEFAULT '{}'::jsonb,     -- Daily goals, category focus, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan milestones
CREATE TABLE IF NOT EXISTS plan_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily plan tasks
CREATE TABLE IF NOT EXISTS plan_daily_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    task_type VARCHAR(50) NOT NULL,         -- practice_questions, review_bookmarks, etc.
    target_count INTEGER,                    -- Number of questions, etc.
    completed_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, date, task_type)
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_plan ON plan_milestones(plan_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_plan_date ON plan_daily_tasks(plan_id, date);

-- ============================================
-- PHASE 22: AI TUTOR MODE
-- ============================================
-- Tutor sessions for interactive learning
CREATE TABLE IF NOT EXISTS tutor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    hint_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    learning_insights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user ON tutor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_question ON tutor_sessions(question_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_status ON tutor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_started ON tutor_sessions(started_at DESC);

-- Tutor messages (chat history)
CREATE TABLE IF NOT EXISTS tutor_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('tutor', 'user')),
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('question', 'hint', 'explanation', 'guidance', 'feedback', 'greeting', 'summary')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_messages_session ON tutor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_created ON tutor_messages(created_at);

-- Learning insights tracked over time
CREATE TABLE IF NOT EXISTS learning_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('misconception', 'knowledge_gap', 'strength', 'weakness', 'recommendation')),
    topic VARCHAR(255),
    description TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
    first_identified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_learning_insights_user ON learning_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_resolved ON learning_insights(resolved);

-- Hint usage tracking for analytics
CREATE TABLE IF NOT EXISTS hint_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    session_id UUID REFERENCES tutor_sessions(id) ON DELETE SET NULL,
    hint_level INTEGER NOT NULL CHECK (hint_level BETWEEN 1 AND 3),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    was_helpful BOOLEAN,
    time_to_answer INTEGER,  -- seconds after hint until answer
    led_to_correct BOOLEAN   -- did the hint lead to correct answer
);

CREATE INDEX IF NOT EXISTS idx_hint_usage_user ON hint_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_hint_usage_question ON hint_usage(question_id);
CREATE INDEX IF NOT EXISTS idx_hint_usage_session ON hint_usage(session_id);

-- RLS policies for tutor tables
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE hint_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tutor sessions" ON tutor_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutor sessions" ON tutor_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutor sessions" ON tutor_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tutor messages" ON tutor_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM tutor_sessions WHERE tutor_sessions.id = tutor_messages.session_id AND tutor_sessions.user_id = auth.uid())
    );

CREATE POLICY "Users can insert own tutor messages" ON tutor_messages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM tutor_sessions WHERE tutor_sessions.id = tutor_messages.session_id AND tutor_sessions.user_id = auth.uid())
    );

CREATE POLICY "Users can view own learning insights" ON learning_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning insights" ON learning_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning insights" ON learning_insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own hint usage" ON hint_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hint usage" ON hint_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update message count on tutor_sessions
CREATE OR REPLACE FUNCTION update_tutor_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tutor_sessions
    SET message_count = message_count + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tutor_session_message_count_trigger AFTER INSERT ON tutor_messages
    FOR EACH ROW EXECUTE FUNCTION update_tutor_session_message_count();

-- Trigger to update hint count on tutor_sessions
CREATE OR REPLACE FUNCTION update_tutor_session_hint_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tutor_sessions
    SET hint_count = hint_count + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tutor_session_hint_count_trigger AFTER INSERT ON hint_usage
    FOR EACH ROW EXECUTE FUNCTION update_tutor_session_hint_count();

-- ============================================
-- PHASE 24: ADMIN DASHBOARD
-- ============================================
-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' 
    CHECK (role IN ('admin', 'user', 'guest'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have default role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Admin action audit log
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,           -- user_ban, question_delete, etc.
    target_type VARCHAR(50),                -- user, question, session
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,      -- Additional context
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- System-wide admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO admin_settings (key, value, description) VALUES
    ('maintenance_mode', '{"enabled": false}', 'Enable maintenance mode'),
    ('registration_enabled', '{"enabled": true}', 'Allow new user registration'),
    ('max_questions_per_session', '{"value": 20}', 'Maximum questions per practice session'),
    ('rate_limit_requests', '{"value": 60}', 'Rate limit requests per minute')
ON CONFLICT (key) DO NOTHING;

-- User reports for questions
CREATE TABLE IF NOT EXISTS question_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(50) NOT NULL,            -- incorrect, unclear, offensive, duplicate, other
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_reports_question ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_created ON question_reports(created_at DESC);

-- RLS policies for admin tables
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- Admins can view all admin logs
CREATE POLICY "Admins can view admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Admins can insert admin logs
CREATE POLICY "Admins can insert admin logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Admins can view and manage settings
CREATE POLICY "Admins can view settings" ON admin_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Admins can insert settings" ON admin_settings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Admins can update settings" ON admin_settings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Admins can manage question reports
CREATE POLICY "Admins can view reports" ON question_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Admins can update reports" ON question_reports
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Users can create reports
CREATE POLICY "Users can create reports" ON question_reports
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON question_reports
    FOR SELECT USING (auth.uid() = reported_by);
