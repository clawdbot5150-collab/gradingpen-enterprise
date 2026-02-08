-- Badges and Mental Health Resources Seed Data

-- Insert Achievement Badges
INSERT INTO badges (id, name, description, badge_type, icon_url, requirements, points_reward, rarity_level, is_active) VALUES

-- Achievement Badges
(
  uuid_generate_v4(),
  'First Steps',
  'Complete your first practice session',
  'achievement',
  '/badges/first-steps.svg',
  '{"sessions_completed": 1}',
  50,
  1,
  true
),

(
  uuid_generate_v4(),
  'Conversation Starter',
  'Complete 5 practice sessions',
  'achievement',
  '/badges/conversation-starter.svg',
  '{"sessions_completed": 5}',
  100,
  2,
  true
),

(
  uuid_generate_v4(),
  'Social Butterfly',
  'Complete 25 practice sessions',
  'achievement',
  '/badges/social-butterfly.svg',
  '{"sessions_completed": 25}',
  500,
  3,
  true
),

(
  uuid_generate_v4(),
  'Confidence Champion',
  'Reach confidence level 75+',
  'achievement',
  '/badges/confidence-champion.svg',
  '{"confidence_score": 75}',
  750,
  4,
  true
),

(
  uuid_generate_v4(),
  'Master Communicator',
  'Complete 100 practice sessions with high ratings',
  'achievement',
  '/badges/master-communicator.svg',
  '{"sessions_completed": 100, "average_rating": 4.5}',
  1000,
  5,
  true
),

-- Milestone Badges
(
  uuid_generate_v4(),
  'Week Warrior',
  'Practice for 7 consecutive days',
  'milestone',
  '/badges/week-warrior.svg',
  '{"streak_days": 7}',
  200,
  2,
  true
),

(
  uuid_generate_v4(),
  'Monthly Master',
  'Practice for 30 consecutive days',
  'milestone',
  '/badges/monthly-master.svg',
  '{"streak_days": 30}',
  1000,
  4,
  true
),

(
  uuid_generate_v4(),
  'Speed Learner',
  'Complete 10 sessions in one week',
  'milestone',
  '/badges/speed-learner.svg',
  '{"sessions_in_week": 10}',
  300,
  3,
  true
),

(
  uuid_generate_v4(),
  'Deep Diver',
  'Complete a 60-minute practice session',
  'milestone',
  '/badges/deep-diver.svg',
  '{"session_duration_minutes": 60}',
  150,
  2,
  true
),

-- Category-Specific Badges
(
  uuid_generate_v4(),
  'Date Night Expert',
  'Complete 10 first date scenarios',
  'achievement',
  '/badges/date-night-expert.svg',
  '{"category_sessions": {"first_date": 10}}',
  400,
  3,
  true
),

(
  uuid_generate_v4(),
  'Workplace Champion',
  'Complete 10 workplace scenarios',
  'achievement',
  '/badges/workplace-champion.svg',
  '{"category_sessions": {"workplace": 10}}',
  400,
  3,
  true
),

(
  uuid_generate_v4(),
  'Social Expert',
  'Complete 10 social event scenarios',
  'achievement',
  '/badges/social-expert.svg',
  '{"category_sessions": {"social_events": 10}}',
  400,
  3,
  true
),

(
  uuid_generate_v4(),
  'Networking Ninja',
  'Complete 10 networking scenarios',
  'achievement',
  '/badges/networking-ninja.svg',
  '{"category_sessions": {"networking": 10}}',
  400,
  3,
  true
),

-- Personality Badges
(
  uuid_generate_v4(),
  'Confidence Builder',
  'Complete 15 sessions with Alex (Confident)',
  'achievement',
  '/badges/confidence-builder.svg',
  '{"personality_sessions": {"confident": 15}}',
  300,
  3,
  true
),

(
  uuid_generate_v4(),
  'Empathy Expert',
  'Complete 15 sessions with Riley (Empathetic)',
  'achievement',
  '/badges/empathy-expert.svg',
  '{"personality_sessions": {"empathetic": 15}}',
  300,
  3,
  true
),

(
  uuid_generate_v4(),
  'Creative Communicator',
  'Complete 15 sessions with Phoenix (Creative)',
  'achievement',
  '/badges/creative-communicator.svg',
  '{"personality_sessions": {"creative": 15}}',
  300,
  3,
  true
),

-- Special Badges
(
  uuid_generate_v4(),
  'Beta Tester',
  'Joined during beta testing period',
  'special',
  '/badges/beta-tester.svg',
  '{"joined_before": "2024-06-01"}',
  1000,
  5,
  true
),

(
  uuid_generate_v4(),
  'Community Helper',
  'Share 5 success stories in the community',
  'special',
  '/badges/community-helper.svg',
  '{"stories_shared": 5}',
  500,
  4,
  true
),

(
  uuid_generate_v4(),
  'Feedback Champion',
  'Provide detailed feedback on 10 sessions',
  'special',
  '/badges/feedback-champion.svg',
  '{"feedback_sessions": 10}',
  300,
  3,
  true
);

-- Insert Mental Health Resources
INSERT INTO mental_health_resources (id, title, description, resource_type, content, url, contact_info, country_codes, language_codes, tags, is_emergency, is_active) VALUES

-- Emergency Resources
(
  uuid_generate_v4(),
  'National Suicide Prevention Lifeline (US)',
  'Free, confidential support for people in distress and crisis resources for you or your loved ones.',
  'hotline',
  NULL,
  'https://suicidepreventionlifeline.org',
  '{"phone": "988", "text": "text HOME to 741741", "chat": "https://suicidepreventionlifeline.org/chat/"}',
  ARRAY['US'],
  ARRAY['en'],
  ARRAY['suicide-prevention', 'crisis', 'emergency'],
  true,
  true
),

(
  uuid_generate_v4(),
  'Crisis Text Line',
  '24/7 crisis support via text message. Text HOME to 741741 to connect with a crisis counselor.',
  'hotline',
  NULL,
  'https://www.crisistextline.org',
  '{"text": "741741", "keywords": "HOME, HELLO, START"}',
  ARRAY['US', 'CA', 'UK'],
  ARRAY['en'],
  ARRAY['crisis', 'text-support', 'emergency'],
  true,
  true
),

(
  uuid_generate_v4(),
  'International Association for Suicide Prevention',
  'Crisis centers and helplines around the world.',
  'hotline',
  NULL,
  'https://www.iasp.info/resources/Crisis_Centres/',
  '{}',
  ARRAY['GLOBAL'],
  ARRAY['en', 'es', 'fr', 'de'],
  ARRAY['international', 'suicide-prevention', 'crisis'],
  true,
  true
),

-- Professional Help
(
  uuid_generate_v4(),
  'Psychology Today Therapist Directory',
  'Find licensed therapists, psychiatrists, and counselors in your area.',
  'professional',
  NULL,
  'https://www.psychologytoday.com/us/therapists',
  '{}',
  ARRAY['US', 'CA'],
  ARRAY['en'],
  ARRAY['therapy', 'counseling', 'professional-help'],
  false,
  true
),

(
  uuid_generate_v4(),
  'Better Help Online Therapy',
  'Professional, licensed, and vetted therapists who you can talk to about anything.',
  'professional',
  NULL,
  'https://www.betterhelp.com',
  '{}',
  ARRAY['US', 'CA', 'UK', 'AU'],
  ARRAY['en'],
  ARRAY['online-therapy', 'professional-help', 'counseling'],
  false,
  true
),

(
  uuid_generate_v4(),
  'NAMI (National Alliance on Mental Illness)',
  'The largest grassroots mental health organization dedicated to building better lives for Americans affected by mental illness.',
  'professional',
  NULL,
  'https://www.nami.org',
  '{"phone": "1-800-950-NAMI (6264)", "email": "info@nami.org"}',
  ARRAY['US'],
  ARRAY['en', 'es'],
  ARRAY['mental-health', 'support-groups', 'education'],
  false,
  true
),

-- Educational Articles
(
  uuid_generate_v4(),
  'Understanding Social Anxiety',
  'Comprehensive guide to recognizing and managing social anxiety symptoms.',
  'article',
  'Social anxiety is more than just being shy. It\'s a persistent fear of social situations that can significantly impact your daily life. This article covers symptoms, causes, and coping strategies.',
  'https://www.nimh.nih.gov/health/topics/social-anxiety',
  '{}',
  ARRAY['US', 'GLOBAL'],
  ARRAY['en'],
  ARRAY['social-anxiety', 'education', 'self-help'],
  false,
  true
),

(
  uuid_generate_v4(),
  'Building Self-Confidence',
  'Evidence-based strategies for developing genuine self-confidence and overcoming self-doubt.',
  'article',
  'True confidence comes from self-acceptance and skill development, not from putting others down or pretending to be someone you\'re not. Learn practical strategies for building lasting confidence.',
  NULL,
  '{}',
  ARRAY['GLOBAL'],
  ARRAY['en'],
  ARRAY['self-confidence', 'self-improvement', 'personal-growth'],
  false,
  true
),

(
  uuid_generate_v4(),
  'Healthy Relationship Boundaries',
  'Learn how to set and maintain healthy boundaries in all types of relationships.',
  'article',
  'Boundaries are essential for healthy relationships and personal well-being. This guide helps you understand different types of boundaries and how to communicate them effectively.',
  NULL,
  '{}',
  ARRAY['GLOBAL'],
  ARRAY['en'],
  ARRAY['relationships', 'boundaries', 'communication'],
  false,
  true
),

-- Video Resources
(
  uuid_generate_v4(),
  'Overcoming Social Anxiety - TED Talk',
  'A powerful TED talk about understanding and overcoming social anxiety.',
  'video',
  NULL,
  'https://www.ted.com/talks/susan_david_the_gift_and_power_of_emotional_courage',
  '{}',
  ARRAY['GLOBAL'],
  ARRAY['en'],
  ARRAY['social-anxiety', 'motivation', 'inspiration'],
  false,
  true
),

(
  uuid_generate_v4(),
  'Mindfulness for Social Situations',
  'Guided meditation and mindfulness techniques specifically designed for social anxiety.',
  'video',
  NULL,
  'https://www.headspace.com/meditation/social-anxiety',
  '{}',
  ARRAY['GLOBAL'],
  ARRAY['en'],
  ARRAY['mindfulness', 'meditation', 'anxiety-relief'],
  false,
  true
),

-- Support Groups and Communities
(
  uuid_generate_v4(),
  'Social Anxiety Support Groups',
  'Find local and online support groups for people dealing with social anxiety.',
  'professional',
  'Connecting with others who understand your challenges can be incredibly helpful. Support groups provide a safe space to share experiences and learn coping strategies.',
  'https://adaa.org/finding-help/treatment/support-groups',
  '{}',
  ARRAY['US', 'CA'],
  ARRAY['en'],
  ARRAY['support-groups', 'community', 'peer-support'],
  false,
  true
),

-- International Resources
(
  uuid_generate_v4(),
  'Samaritans (UK)',
  'Free support for anyone in emotional distress, struggling to cope, or at risk of suicide.',
  'hotline',
  NULL,
  'https://www.samaritans.org',
  '{"phone": "116 123", "email": "jo@samaritans.org"}',
  ARRAY['UK', 'IE'],
  ARRAY['en'],
  ARRAY['crisis', 'emotional-support', 'suicide-prevention'],
  true,
  true
),

(
  uuid_generate_v4(),
  'Kids Help Phone (Canada)',
  '24/7 support for young people via phone, text, and live chat.',
  'hotline',
  NULL,
  'https://kidshelpphone.ca',
  '{"phone": "1-800-668-6868", "text": "686868"}',
  ARRAY['CA'],
  ARRAY['en', 'fr'],
  ARRAY['youth', 'crisis', 'support'],
  true,
  true
),

(
  uuid_generate_v4(),
  'Lifeline Australia',
  'Crisis support and suicide prevention services.',
  'hotline',
  NULL,
  'https://www.lifeline.org.au',
  '{"phone": "13 11 14", "chat": "https://www.lifeline.org.au/crisis-chat/"}',
  ARRAY['AU'],
  ARRAY['en'],
  ARRAY['crisis', 'suicide-prevention', 'support'],
  true,
  true
);

-- Insert Daily Challenges
INSERT INTO daily_challenges (id, title, description, challenge_type, difficulty, requirements, rewards, start_date, end_date, is_active, participation_count, completion_count) VALUES

(
  uuid_generate_v4(),
  'Start with a Smile',
  'Begin three conversations today with a genuine smile and positive energy.',
  'daily',
  'beginner',
  '{"conversations_started": 3, "positive_energy": true, "genuine_smile": true}',
  '{"experience_points": 25, "confidence_boost": 2}',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 day',
  true,
  0,
  0
),

(
  uuid_generate_v4(),
  'Question Master',
  'Ask at least 5 thoughtful, open-ended questions in your conversations today.',
  'daily',
  'intermediate',
  '{"thoughtful_questions": 5, "open_ended": true}',
  '{"experience_points": 35, "communication_skill_boost": 3}',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 day',
  true,
  0,
  0
),

(
  uuid_generate_v4(),
  'Compliment Challenge',
  'Give three genuine compliments to different people today.',
  'daily',
  'beginner',
  '{"compliments_given": 3, "genuine": true, "different_people": 3}',
  '{"experience_points": 30, "positivity_boost": 5}',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 day',
  true,
  0,
  0
),

(
  uuid_generate_v4(),
  'Active Listener',
  'Practice active listening in all your conversations today - focus fully on the speaker.',
  'daily',
  'intermediate',
  '{"active_listening_sessions": 3, "full_attention": true}',
  '{"experience_points": 40, "empathy_boost": 4}',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 day',
  true,
  0,
  0
),

(
  uuid_generate_v4(),
  'Comfort Zone Breaker',
  'Do one thing that pushes you slightly outside your social comfort zone today.',
  'daily',
  'advanced',
  '{"comfort_zone_push": 1, "reflection_required": true}',
  '{"experience_points": 50, "confidence_boost": 5, "courage_badge_progress": 1}',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 day',
  true,
  0,
  0
);

-- Insert System Settings
INSERT INTO system_settings (id, setting_key, setting_value, description, is_public) VALUES

(
  uuid_generate_v4(),
  'app_version',
  '"1.0.0"',
  'Current application version',
  true
),

(
  uuid_generate_v4(),
  'maintenance_mode',
  'false',
  'Whether the application is in maintenance mode',
  true
),

(
  uuid_generate_v4(),
  'max_session_duration_minutes',
  '120',
  'Maximum duration for a single practice session',
  false
),

(
  uuid_generate_v4(),
  'daily_session_limit_free',
  '3',
  'Maximum number of daily sessions for free users',
  false
),

(
  uuid_generate_v4(),
  'daily_session_limit_premium',
  '10',
  'Maximum number of daily sessions for premium users',
  false
),

(
  uuid_generate_v4(),
  'confidence_score_algorithm_version',
  '"1.2"',
  'Current version of confidence scoring algorithm',
  false
),

(
  uuid_generate_v4(),
  'enable_voice_chat',
  'false',
  'Whether voice chat features are enabled',
  true
),

(
  uuid_generate_v4(),
  'enable_community_features',
  'true',
  'Whether community features are enabled',
  true
),

(
  uuid_generate_v4(),
  'crisis_detection_threshold',
  '0.7',
  'Threshold for triggering crisis detection protocols',
  false
),

(
  uuid_generate_v4(),
  'welcome_message',
  '"Welcome to AIGFNetwork! Start building your social confidence today."',
  'Welcome message shown to new users',
  true
);

-- Update timestamps
UPDATE badges SET created_at = CURRENT_TIMESTAMP;
UPDATE mental_health_resources SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP;
UPDATE daily_challenges SET created_at = CURRENT_TIMESTAMP;
UPDATE system_settings SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP;