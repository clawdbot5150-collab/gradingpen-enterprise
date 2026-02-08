-- Initial database schema for GradingPen
-- This migration creates the core tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('school', 'district', 'institution', 'individual')),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'individual' CHECK (subscription_tier IN ('individual', 'school', 'district', 'enterprise')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'admin', 'student', 'super_admin')),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);

-- Subjects table
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    grade_levels INTEGER[] DEFAULT '{}',
    standards JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO subjects (name, code, description, grade_levels) VALUES
('English Language Arts', 'ELA', 'Reading, writing, speaking, and listening skills', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('Mathematics', 'MATH', 'Mathematical concepts and problem solving', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('Science', 'SCI', 'Physical, life, and earth sciences', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('History', 'HIST', 'Historical analysis and social studies', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('Art', 'ART', 'Visual and creative arts', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('Physical Education', 'PE', 'Physical fitness and health', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    grade_level INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_subject ON courses(subject_id);

-- Students table (for tracking student enrollments)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    student_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    grade_level INTEGER,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    additional_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_students_organization ON students(organization_id);
CREATE INDEX idx_students_grade_level ON students(grade_level);

-- Course enrollments
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn')),
    UNIQUE(course_id, student_id)
);

-- Rubrics table
CREATE TABLE rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL, -- JSON structure defining rubric criteria and scoring
    scale VARCHAR(50) NOT NULL DEFAULT 'points' CHECK (scale IN ('points', 'percentage', 'letter')),
    max_score INTEGER DEFAULT 100,
    is_template BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rubrics_creator ON rubrics(creator_id);
CREATE INDEX idx_rubrics_subject ON rubrics(subject_id);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    rubric_id UUID REFERENCES rubrics(id),
    due_date TIMESTAMP WITH TIME ZONE,
    points_possible INTEGER DEFAULT 100,
    submission_types VARCHAR(100)[] DEFAULT ARRAY['text'], -- text, file, both
    ai_grading_enabled BOOLEAN DEFAULT TRUE,
    ai_model VARCHAR(100),
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- Submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    content TEXT,
    file_urls TEXT[], -- URLs to uploaded files
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    late BOOLEAN DEFAULT FALSE,
    attempt_number INTEGER DEFAULT 1,
    word_count INTEGER,
    reading_level VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    UNIQUE(assignment_id, student_id, attempt_number)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

-- Grades table
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    grader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    score NUMERIC(5,2),
    letter_grade VARCHAR(5),
    percentage NUMERIC(5,2),
    rubric_scores JSONB, -- JSON object with criterion scores
    feedback TEXT,
    private_notes TEXT,
    ai_confidence NUMERIC(3,2), -- AI confidence level (0.00 to 1.00)
    ai_model VARCHAR(100),
    grading_time_seconds INTEGER,
    grader_type VARCHAR(20) DEFAULT 'ai' CHECK (grader_type IN ('ai', 'human', 'hybrid')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'needs_review')),
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grades_submission ON grades(submission_id);
CREATE INDEX idx_grades_grader ON grades(grader_id);
CREATE INDEX idx_grades_status ON grades(status);

-- Plagiarism reports table
CREATE TABLE plagiarism_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    similarity_percentage NUMERIC(5,2) NOT NULL,
    ai_generated_probability NUMERIC(5,2),
    sources JSONB, -- Array of matched sources with details
    report_data JSONB, -- Full report data
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plagiarism_submission ON plagiarism_reports(submission_id);

-- AI models table for tracking model performance
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    version VARCHAR(50) NOT NULL,
    subject_id UUID REFERENCES subjects(id),
    model_config JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grading sessions for batch processing tracking
CREATE TABLE grading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    batch_size INTEGER NOT NULL,
    completed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_processing_time INTEGER, -- in seconds
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grading_sessions_teacher ON grading_sessions(teacher_id);
CREATE INDEX idx_grading_sessions_status ON grading_sessions(status);

-- Analytics data table for storing aggregated metrics
CREATE TABLE analytics_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- user, course, assignment, organization
    entity_id UUID NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_data JSONB,
    time_period VARCHAR(20), -- daily, weekly, monthly
    date_key DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_entity ON analytics_data(entity_type, entity_id);
CREATE INDEX idx_analytics_metric ON analytics_data(metric_name);
CREATE INDEX idx_analytics_date ON analytics_data(date_key);

-- Feedback templates
CREATE TABLE feedback_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags VARCHAR(50)[],
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('grading_complete', 'assignment_due', 'system_update', 'general')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Integration settings for LMS connections
CREATE TABLE integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- canvas, blackboard, google_classroom, etc.
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rubrics_updated_at BEFORE UPDATE ON rubrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_templates_updated_at BEFORE UPDATE ON feedback_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_settings_updated_at BEFORE UPDATE ON integration_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();