-- AIGFNetwork Database Schema
-- PostgreSQL Database Schema for Social Confidence Training Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_subscription AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE session_type AS ENUM ('practice', 'free_chat', 'assessment', 'challenge');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE personality_type AS ENUM ('confident', 'empathetic', 'playful', 'professional', 'intellectual', 'creative', 'supportive', 'challenging');
CREATE TYPE scenario_category AS ENUM ('first_date', 'social_events', 'workplace', 'cold_approach', 'group_conversations', 'networking');
CREATE TYPE message_type AS ENUM ('user', 'ai', 'system');
CREATE TYPE badge_type AS ENUM ('achievement', 'milestone', 'special');
CREATE TYPE challenge_type AS ENUM ('daily', 'weekly', 'special_event');
CREATE TYPE mental_health_status AS ENUM ('green', 'yellow', 'orange', 'red');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    subscription_type user_subscription DEFAULT 'free',
    status user_status DEFAULT 'active',
    profile_picture_url TEXT,
    bio TEXT,
    goals TEXT[],
    preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    mental_health_status mental_health_status DEFAULT 'green',
    mental_health_last_check TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    crisis_contact_info JSONB DEFAULT '{}',
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- AI Personalities table
CREATE TABLE ai_personalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type personality_type NOT NULL,
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    personality_traits JSONB NOT NULL,
    conversation_style JSONB NOT NULL,
    difficulty_adaptation JSONB NOT NULL,
    voice_settings JSONB,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Practice Scenarios table
CREATE TABLE practice_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    category scenario_category NOT NULL,
    difficulty difficulty_level NOT NULL,
    description TEXT NOT NULL,
    objectives TEXT[] NOT NULL,
    context JSONB NOT NULL,
    setup_prompt TEXT NOT NULL,
    success_criteria JSONB NOT NULL,
    time_limit_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    prerequisite_scenarios UUID[],
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_personality_id UUID NOT NULL REFERENCES ai_personalities(id),
    practice_scenario_id UUID REFERENCES practice_scenarios(id),
    session_type session_type NOT NULL,
    title VARCHAR(200),
    difficulty_level difficulty_level,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    message_count INTEGER DEFAULT 0,
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating >= 1 AND user_satisfaction_rating <= 5),
    ai_difficulty_adjustment JSONB DEFAULT '{}',
    session_metadata JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_type message_type NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID REFERENCES users(id),
    ai_personality_id UUID REFERENCES ai_personalities(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_metadata JSONB DEFAULT '{}',
    response_time_ms INTEGER,
    confidence_score DECIMAL(5,2),
    sentiment_score DECIMAL(5,2),
    engagement_score DECIMAL(5,2),
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reasons TEXT[],
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User Progress table
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_confidence_score DECIMAL(5,2) DEFAULT 0.00,
    category_scores JSONB DEFAULT '{}',
    personality_compatibility JSONB DEFAULT '{}',
    skill_assessments JSONB DEFAULT '{}',
    strengths TEXT[],
    improvement_areas TEXT[],
    milestones_achieved INTEGER DEFAULT 0,
    total_practice_time_minutes INTEGER DEFAULT 0,
    sessions_completed INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Session Analytics table
CREATE TABLE session_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    confidence_metrics JSONB NOT NULL,
    conversation_quality JSONB NOT NULL,
    improvement_suggestions TEXT[],
    strengths_identified TEXT[],
    areas_to_work_on TEXT[],
    ai_performance_metrics JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Badges and Achievements table
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    badge_type badge_type NOT NULL,
    icon_url TEXT,
    requirements JSONB NOT NULL,
    points_reward INTEGER DEFAULT 0,
    rarity_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Badges table
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id UUID REFERENCES chat_sessions(id),
    progress_snapshot JSONB,
    UNIQUE(user_id, badge_id)
);

-- Daily Challenges table
CREATE TABLE daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    challenge_type challenge_type NOT NULL,
    difficulty difficulty_level NOT NULL,
    requirements JSONB NOT NULL,
    rewards JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    participation_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Challenge Progress table
CREATE TABLE user_challenge_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_data JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    points_earned INTEGER DEFAULT 0,
    UNIQUE(user_id, challenge_id)
);

-- Community Stories table (anonymous)
CREATE TABLE community_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category scenario_category,
    confidence_improvement_rating INTEGER CHECK (confidence_improvement_rating >= 1 AND confidence_improvement_rating <= 5),
    practice_duration_weeks INTEGER,
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    moderation_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    featured_at TIMESTAMP WITH TIME ZONE
);

-- Mental Health Resources table
CREATE TABLE mental_health_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'article', 'video', 'hotline', 'professional'
    content TEXT,
    url TEXT,
    contact_info JSONB,
    country_codes TEXT[],
    language_codes TEXT[],
    tags TEXT[],
    is_emergency BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crisis Detection Logs table
CREATE TABLE crisis_detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id),
    message_id UUID REFERENCES chat_messages(id),
    crisis_indicators JSONB NOT NULL,
    confidence_level DECIMAL(5,2) NOT NULL,
    automated_response TEXT,
    human_review_required BOOLEAN DEFAULT FALSE,
    human_reviewer_id UUID REFERENCES users(id),
    resolution_status VARCHAR(50) DEFAULT 'pending',
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- System Settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription ON users(subscription_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_ai_personality ON chat_sessions(ai_personality_id);
CREATE INDEX idx_chat_sessions_type ON chat_sessions(session_type);
CREATE INDEX idx_chat_sessions_started_at ON chat_sessions(started_at);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_chat_messages_type ON chat_messages(message_type);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_updated_at ON user_progress(updated_at);

CREATE INDEX idx_session_analytics_user_id ON session_analytics(user_id);
CREATE INDEX idx_session_analytics_session_id ON session_analytics(session_id);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at);

CREATE INDEX idx_community_stories_approved ON community_stories(is_approved);
CREATE INDEX idx_community_stories_featured ON community_stories(is_featured);
CREATE INDEX idx_community_stories_category ON community_stories(category);

CREATE INDEX idx_crisis_logs_user_id ON crisis_detection_logs(user_id);
CREATE INDEX idx_crisis_logs_created_at ON crisis_detection_logs(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_personalities_updated_at BEFORE UPDATE ON ai_personalities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_scenarios_updated_at BEFORE UPDATE ON practice_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mental_health_resources_updated_at BEFORE UPDATE ON mental_health_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();