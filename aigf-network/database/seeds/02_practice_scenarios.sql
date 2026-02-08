-- Practice Scenarios Seed Data
-- This file contains the initial practice scenarios for the platform

-- Insert Practice Scenarios
INSERT INTO practice_scenarios (id, title, category, difficulty, description, objectives, context, setup_prompt, success_criteria, time_limit_minutes, prerequisite_scenarios, tags) VALUES

-- First Date Scenarios
(
  uuid_generate_v4(),
  'Coffee Shop First Date',
  'first_date',
  'beginner',
  'Practice conversation skills during a casual first date at a coffee shop. Learn to ask engaging questions, share about yourself appropriately, and create a comfortable atmosphere.',
  ARRAY['Ask 3 meaningful questions about your date''s interests', 'Share 2 personal stories appropriately', 'Maintain engaging conversation for 15+ minutes', 'Show genuine interest and active listening'],
  '{"location": "cozy coffee shop", "time_of_day": "afternoon", "atmosphere": "relaxed and casual", "your_character": "someone excited but slightly nervous about the date", "scenario_length": "medium"}',
  'You''re meeting someone for a first date at a popular local coffee shop. You''ve been chatting online for a week and finally decided to meet in person. You''re sitting at a corner table with your drinks, and there''s a comfortable energy between you. The conversation is just beginning. How do you break the ice and create an engaging, memorable first date experience?',
  '{"conversation_flow": "maintained natural flow with minimal awkward silences", "question_quality": "asked thoughtful, open-ended questions", "sharing_balance": "balanced talking and listening", "comfort_level": "created a relaxed atmosphere", "interest_shown": "demonstrated genuine curiosity about the other person"}',
  20,
  ARRAY[]::UUID[],
  ARRAY['dating', 'casual', 'getting-to-know-you', 'coffee', 'first-impression']
),

(
  uuid_generate_v4(),
  'Dinner Date Conversation',
  'first_date',
  'intermediate',
  'Navigate the complexities of a dinner date, including ordering, conversation timing, and creating deeper connections over a longer period.',
  ARRAY['Navigate ordering and menu discussion smoothly', 'Maintain conversation throughout multiple courses', 'Handle potential awkward moments gracefully', 'Create opportunities for deeper connection'],
  '{"location": "mid-range restaurant", "time_of_day": "evening", "atmosphere": "romantic but not overly formal", "your_character": "someone looking for a genuine connection", "scenario_length": "long"}',
  'You''re on a dinner date at a nice restaurant. The setting is more formal than a coffee shop, and you have 1-2 hours together. You need to navigate menu choices, longer conversation periods, and the natural lulls that come with eating. How do you keep the conversation engaging while also creating moments for deeper connection?',
  '{"conversation_continuity": "kept dialogue flowing between courses", "depth_achieved": "moved beyond surface-level topics", "comfort_management": "handled eating and talking gracefully", "connection_building": "created opportunities for meaningful sharing"}',
  45,
  ARRAY[]::UUID[],
  ARRAY['dating', 'dinner', 'romantic', 'deeper-connection', 'restaurant-etiquette']
),

-- Social Events Scenarios
(
  uuid_generate_v4(),
  'House Party Introductions',
  'social_events',
  'beginner',
  'Practice introducing yourself to new people at a casual house party where you only know the host.',
  ARRAY['Introduce yourself to 3 new people', 'Find common ground with at least one person', 'Join an ongoing conversation naturally', 'Exchange contact information with someone you connect with'],
  '{"location": "friend''s house party", "time_of_day": "evening", "atmosphere": "casual and friendly", "your_character": "someone who knows only the host", "crowd_size": "15-20 people"}',
  'You''ve arrived at your friend''s house party where you don''t know anyone except the host, who is busy entertaining other guests. The music is playing, people are chatting in small groups, and you want to make some new connections. How do you approach strangers and start meaningful conversations?',
  '{"introductions_made": "successfully introduced yourself multiple times", "conversations_joined": "naturally joined existing conversations", "connections_formed": "found genuine common interests", "follow_up_established": "created opportunity for future contact"}',
  25,
  ARRAY[]::UUID[],
  ARRAY['party', 'introductions', 'new-people', 'casual-social', 'networking']
),

(
  uuid_generate_v4(),
  'Wedding Reception Networking',
  'social_events',
  'advanced',
  'Navigate the social complexities of a wedding reception, talking to people from different generations and backgrounds while maintaining appropriate tone.',
  ARRAY['Engage with people of different age groups appropriately', 'Handle questions about your own relationship status gracefully', 'Contribute to group conversations about the couple', 'Navigate seated dinner conversation with strangers'],
  '{"location": "wedding reception", "time_of_day": "evening", "atmosphere": "celebratory and formal", "your_character": "guest who knows the couple but few other attendees", "crowd_mix": "multi-generational"}',
  'You''re attending a wedding reception where you know the bride and groom but very few other guests. You''re seated at a table with strangers of various ages, and you''ll need to navigate both seated conversation during dinner and mingling during dancing. How do you connect with different types of people while keeping the focus on celebrating the couple?',
  '{"age_appropriate_interaction": "adjusted conversation style for different generations", "graceful_personal_handling": "handled personal questions with poise", "celebration_focus": "kept conversations positive and celebratory", "group_contribution": "added value to group discussions"}',
  60,
  ARRAY[]::UUID[],
  ARRAY['wedding', 'formal-social', 'multi-generational', 'celebration', 'group-dynamics']
),

-- Workplace Scenarios
(
  uuid_generate_v4(),
  'First Day at New Job',
  'workplace',
  'beginner',
  'Make a great first impression on your first day at a new job, meeting team members and establishing yourself as a friendly, competent colleague.',
  ARRAY['Introduce yourself to all team members', 'Ask appropriate questions about work processes', 'Show enthusiasm and eagerness to learn', 'Establish rapport with your immediate colleagues'],
  '{"location": "office environment", "time_of_day": "full workday", "atmosphere": "professional but welcoming", "your_character": "new employee eager to fit in", "team_size": "8-12 people"}',
  'It''s your first day at a new company. You''ll be meeting your team, learning about company culture, and trying to make a good impression. Your manager is giving you a tour and introducing you to colleagues. How do you present yourself professionally while also being personable and memorable?',
  '{"professional_impression": "maintained appropriate professional demeanor", "team_integration": "showed genuine interest in getting to know colleagues", "learning_attitude": "demonstrated eagerness to learn and contribute", "rapport_building": "began building positive relationships"}',
  30,
  ARRAY[]::UUID[],
  ARRAY['workplace', 'first-day', 'professional', 'team-integration', 'first-impressions']
),

(
  uuid_generate_v4(),
  'Difficult Client Meeting',
  'workplace',
  'expert',
  'Handle a challenging client meeting where you need to address concerns, maintain professionalism, and work toward a positive outcome.',
  ARRAY['Listen actively to client concerns', 'Acknowledge problems without being defensive', 'Present solutions clearly and confidently', 'Maintain professional composure throughout'],
  '{"location": "conference room", "time_of_day": "morning", "atmosphere": "tense but professional", "your_character": "account manager trying to resolve issues", "stakes": "high - could lose the account"}',
  'You''re meeting with a client who has several complaints about your company''s recent service. They''re frustrated and considering switching to a competitor. You need to address their concerns, rebuild trust, and potentially save the account. How do you handle this high-pressure conversation professionally?',
  '{"active_listening": "demonstrated genuine understanding of concerns", "professional_composure": "maintained calm under pressure", "solution_focused": "presented clear, actionable solutions", "relationship_repair": "worked to rebuild trust and confidence"}',
  45,
  ARRAY[]::UUID[],
  ARRAY['workplace', 'difficult-conversation', 'client-relations', 'problem-solving', 'high-pressure']
),

-- Cold Approach Scenarios
(
  uuid_generate_v4(),
  'Bookstore Approach',
  'cold_approach',
  'beginner',
  'Practice starting a conversation with someone at a bookstore, using the environment and shared interests as natural conversation starters.',
  ARRAY['Make natural eye contact and smile', 'Use the bookstore setting for conversation starters', 'Ask for a book recommendation appropriately', 'Gauge interest level and respond accordingly'],
  '{"location": "independent bookstore", "time_of_day": "weekend afternoon", "atmosphere": "quiet and intellectual", "your_character": "someone browsing who notices an interesting person", "approach_style": "casual and context-appropriate"}',
  'You''re browsing in a bookstore when you notice someone interesting looking at books in a section you''re also interested in. They seem approachable and you''d like to start a conversation. How do you naturally and respectfully initiate contact using the bookstore environment?',
  '{"natural_opening": "used environment appropriately for conversation starter", "respectful_approach": "read social cues and respected boundaries", "genuine_interest": "showed authentic interest in their reading preferences", "graceful_interaction": "handled the interaction smoothly regardless of outcome"}',
  15,
  ARRAY[]::UUID[],
  ARRAY['cold-approach', 'bookstore', 'shared-interests', 'casual', 'respectful']
),

-- Group Conversations Scenarios
(
  uuid_generate_v4(),
  'Joining a Group Discussion',
  'group_conversations',
  'intermediate',
  'Practice joining an ongoing group conversation at a social gathering without being disruptive while adding value to the discussion.',
  ARRAY['Read the room and identify appropriate moment to join', 'Contribute meaningfully to the existing topic', 'Build on others'' comments positively', 'Help include quieter group members'],
  '{"location": "social gathering", "time_of_day": "evening", "atmosphere": "lively discussion", "your_character": "someone who wants to join an interesting conversation", "group_size": "4-6 people"}',
  'You''re at a social event and notice a group having an animated discussion about a topic you''re knowledgeable about. They seem engaged and you''d like to join the conversation. How do you enter the group naturally and contribute positively to their discussion?',
  '{"seamless_entry": "joined conversation at appropriate moment", "valuable_contribution": "added meaningful insights to discussion", "positive_building": "built on others'' ideas constructively", "inclusive_behavior": "helped create welcoming group dynamic"}',
  20,
  ARRAY[]::UUID[],
  ARRAY['group-conversation', 'social-gathering', 'discussion-joining', 'teamwork', 'inclusive']
),

-- Networking Scenarios
(
  uuid_generate_v4(),
  'Professional Conference Networking',
  'networking',
  'intermediate',
  'Network effectively at a professional conference, making valuable connections while sharing your own expertise and interests.',
  ARRAY['Introduce yourself memorably to 5 new people', 'Exchange business cards or contact information', 'Find mutual professional interests', 'Follow up on at least 2 connections'],
  '{"location": "professional conference", "time_of_day": "networking hour", "atmosphere": "professional but social", "your_character": "professional looking to expand network", "attendees": "industry peers and potential collaborators"}',
  'You''re at a professional conference during the networking hour. There are industry professionals, potential collaborators, and thought leaders all around. You want to make meaningful connections that could benefit your career. How do you approach networking strategically while being authentic?',
  '{"strategic_networking": "targeted appropriate connections for mutual benefit", "memorable_presence": "presented yourself in a memorable way", "mutual_value": "identified shared interests and potential collaborations", "follow_up_planning": "established clear next steps with promising connections"}',
  40,
  ARRAY[]::UUID[],
  ARRAY['networking', 'professional', 'conference', 'business-development', 'career-growth']
),

(
  uuid_generate_v4(),
  'Industry Meetup First Time',
  'networking',
  'beginner',
  'Attend your first industry meetup, overcome initial nerves, and make connections in a more casual professional setting.',
  ARRAY['Introduce yourself to the organizer', 'Participate in at least one group discussion', 'Exchange contact with 2-3 people', 'Ask thoughtful questions about others'' work'],
  '{"location": "casual venue hosting meetup", "time_of_day": "evening after work", "atmosphere": "relaxed professional", "your_character": "newcomer to this type of networking", "group_dynamic": "mix of regulars and newcomers"}',
  'You''re attending your first industry meetup. You''ve heard these events are great for networking, but you''re not sure what to expect. There are about 30 people, some clustering in groups, others mingling individually. How do you navigate this new environment and start building your professional network?',
  '{"initial_connection": "successfully introduced yourself to key people", "group_participation": "contributed to group discussions naturally", "relationship_building": "began building genuine professional relationships", "comfort_development": "became more comfortable with networking environment"}',
  35,
  ARRAY[]::UUID[],
  ARRAY['networking', 'meetup', 'industry', 'first-time', 'professional-growth']
),

-- Advanced scenarios with prerequisites
(
  uuid_generate_v4(),
  'Managing Group Date Dynamics',
  'first_date',
  'advanced',
  'Navigate the complex social dynamics of a group date, balancing attention between your date and the group while ensuring everyone has a good time.',
  ARRAY['Balance one-on-one time with group interaction', 'Include everyone in conversations', 'Navigate potential group dynamics issues', 'Maintain focus on your date while being social'],
  '{"location": "bowling alley and dinner", "time_of_day": "evening", "atmosphere": "fun and energetic", "your_character": "someone on a group date", "group_size": "6-8 people including couples"}',
  'You''re on a group date - it''s you, your date, and 2-3 other couples going bowling and then to dinner. Group dates can be fun but also challenging as you need to connect with your date while also being social with the group. How do you navigate these dynamics successfully?',
  '{"attention_balance": "balanced individual date attention with group participation", "group_harmony": "contributed to positive group dynamics", "inclusive_behavior": "ensured everyone felt included", "date_connection": "maintained special connection with your date"}',
  90,
  ARRAY[]::UUID[],
  ARRAY['group-date', 'dating', 'social-dynamics', 'group-activity', 'advanced']
),

(
  uuid_generate_v4(),
  'Workplace Conflict Resolution',
  'workplace',
  'advanced',
  'Mediate a conflict between two colleagues while maintaining neutrality and working toward a productive resolution.',
  ARRAY['Listen to both perspectives fairly', 'Identify underlying issues', 'Facilitate productive discussion', 'Help find mutually acceptable solutions'],
  '{"location": "conference room", "time_of_day": "afternoon", "atmosphere": "tense but professional", "your_character": "team lead mediating conflict", "situation": "two team members having ongoing disagreements"}',
  'Two of your team members have been having ongoing conflicts that are affecting team morale and productivity. You''ve decided to bring them together to address the issues directly. Both are good employees but have different working styles and communication preferences. How do you facilitate a productive conversation?',
  '{"fair_mediation": "listened to both sides without taking sides", "root_cause_identification": "identified underlying issues beyond surface conflicts", "productive_facilitation": "guided discussion toward solutions", "follow_up_planning": "established plan for ongoing improvement"}',
  50,
  ARRAY[]::UUID[],
  ARRAY['workplace', 'conflict-resolution', 'mediation', 'leadership', 'team-dynamics']
);

-- Update the updated_at timestamp
UPDATE practice_scenarios SET updated_at = CURRENT_TIMESTAMP;