import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Matches Firebase Auth uid or generated UUID
  uid: text('uid').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  verificationCode: text('verification_code'),
  resetCode: text('reset_code'),
  avatarUrl: text('avatar_url').default(''),
  bio: text('bio').default(''),
  college: text('college').default(''),
  course: text('course').default(''),
  year: text('year').default(''),
  location: text('location').default(''),
  availability: text('availability').default('Weekdays & Weekends'),
  role: text('role').default('STUDENT').notNull(), // 'STUDENT' | 'ADMIN'
  isActive: boolean('is_active').default(true).notNull(),
  isDemo: boolean('is_demo').default(false).notNull(),
  notifyRequests: boolean('notify_requests').default(true).notNull(),
  notifyMessages: boolean('notify_messages').default(true).notNull(),
  notifySessions: boolean('notify_sessions').default(true).notNull(),
  notifyReviews: boolean('notify_reviews').default(true).notNull(),
  profileVisibility: text('profile_visibility').default('PUBLIC').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Alias users to profiles for standard Cloud SQL helper compatibility
export const users = profiles;

export const skillCategories = pgTable('skill_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const skills = pgTable('skills', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  categoryId: integer('category_id')
    .references(() => skillCategories.id)
    .notNull(),
  description: text('description').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userTeachingSkills = pgTable('user_teaching_skills', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  level: text('level').notNull(), // 'Beginner' | 'Intermediate' | 'Advanced'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userLearningSkills = pgTable('user_learning_skills', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  level: text('level').notNull(), // 'Beginner' | 'Intermediate' | 'Advanced'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const learningRequests = pgTable('learning_requests', {
  id: serial('id').primaryKey(),
  senderId: text('sender_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  receiverId: text('receiver_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  offeredSkillId: integer('offered_skill_id').references(() => skills.id, {
    onDelete: 'set null',
  }),
  message: text('message').notNull(),
  status: text('status').default('Pending').notNull(), // 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const connections = pgTable('connections', {
  id: serial('id').primaryKey(),
  user1Id: text('user1_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  user2Id: text('user2_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  requestId: integer('request_id').references(() => learningRequests.id, {
    onDelete: 'set null',
  }),
  status: text('status').default('Active').notNull(), // 'Active' | 'Blocked'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  connectionId: integer('connection_id')
    .references(() => connections.id, { onDelete: 'cascade' })
    .notNull(),
  teacherId: text('teacher_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  learnerId: text('learner_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  scheduledDate: text('scheduled_date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:mm
  duration: integer('duration').default(60).notNull(), // minutes
  notes: text('notes').default(''),
  meetingLink: text('meeting_link').default(''),
  status: text('status').default('Scheduled').notNull(), // 'Scheduled' | 'Completed' | 'Cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .references(() => sessions.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  reviewerId: text('reviewer_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  reviewedUserId: text('reviewed_user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  startingLevel: text('starting_level').default('Beginner').notNull(),
  currentLevel: text('current_level').default('Beginner').notNull(),
  progressPercentage: integer('progress_percentage').default(0).notNull(),
  sessionsCompleted: integer('sessions_completed').default(0).notNull(),
  lastSessionDate: text('last_session_date').default(''),
  topicsCompleted: text('topics_completed').default(''),
  notes: text('notes').default(''),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const learningGoals = pgTable('learning_goals', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id').references(() => skills.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description').default(''),
  targetDate: text('target_date').notNull(),
  progressPercentage: integer('progress_percentage').default(0).notNull(),
  status: text('status').default('Not Started').notNull(), // 'Not Started' | 'In Progress' | 'Completed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  connectionId: integer('connection_id')
    .references(() => connections.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  user1Id: text('user1_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  user2Id: text('user2_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .references(() => conversations.id, { onDelete: 'cascade' })
    .notNull(),
  senderId: text('sender_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  relatedId: text('related_id').default(''),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: text('reporter_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  reportedUserId: text('reported_user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  reason: text('reason').notNull(),
  description: text('description').default(''),
  status: text('status').default('Pending').notNull(), // 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected'
  adminNotes: text('admin_notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const blockedUsers = pgTable('blocked_users', {
  id: serial('id').primaryKey(),
  blockerId: text('blocker_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  blockedUserId: text('blocked_user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// 1 VS 1 SKILL BATTLE TABLES
// ============================================================================

export const battles = pgTable('battles', {
  id: text('id').primaryKey(), // e.g., BATTLE-83921
  skill: text('skill').notNull(),
  difficulty: text('difficulty').notNull(), // 'Easy' | 'Medium' | 'Hard' | 'Adaptive'
  questionCount: integer('question_count').default(5).notNull(),
  status: text('status').default('WAITING').notNull(), // WAITING | MATCHED | READY | COUNTDOWN | QUESTION_ACTIVE | QUESTION_COMPLETED | NEXT_QUESTION | FINALIZING | COMPLETED | CANCELLED
  currentQuestionNumber: integer('current_question_number').default(1).notNull(),
  countdownEndsAt: timestamp('countdown_ends_at'),
  questionStartedAt: timestamp('question_started_at'),
  questionEndsAt: timestamp('question_ends_at'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  winnerId: text('winner_id'),
  isDraw: boolean('is_draw').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const battlePlayers = pgTable('battle_players', {
  id: serial('id').primaryKey(),
  battleId: text('battle_id')
    .references(() => battles.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  score: integer('score').default(0).notNull(),
  correctAnswers: integer('correct_answers').default(0).notNull(),
  totalAnswerTime: integer('total_answer_time').default(0).notNull(), // milliseconds
  status: text('status').default('MATCHED').notNull(), // MATCHED | READY | PLAYING | DISCONNECTED | COMPLETED
  isReady: boolean('is_ready').default(false).notNull(),
  ratingBefore: integer('rating_before').default(1200).notNull(),
  ratingAfter: integer('rating_after').default(1200).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const battleQuestions = pgTable('battle_questions', {
  id: serial('id').primaryKey(),
  battleId: text('battle_id')
    .references(() => battles.id, { onDelete: 'cascade' })
    .notNull(),
  uniqueQuestionId: text('unique_question_id').notNull(),
  questionNumber: integer('question_number').notNull(),
  questionText: text('question_text').notNull(),
  options: text('options').notNull(), // JSON string of 4 options
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation').notNull(),
  difficulty: text('difficulty').notNull(),
  skill: text('skill').notNull(),
  topic: text('topic').notNull(),
  startedAt: timestamp('started_at'),
});

export const battleAnswers = pgTable('battle_answers', {
  id: serial('id').primaryKey(),
  battleId: text('battle_id')
    .references(() => battles.id, { onDelete: 'cascade' })
    .notNull(),
  questionId: integer('question_id')
    .references(() => battleQuestions.id, { onDelete: 'cascade' })
    .notNull(),
  questionNumber: integer('question_number').notNull(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  selectedAnswer: text('selected_answer').notNull(),
  isCorrect: boolean('is_correct').default(false).notNull(),
  points: integer('points').default(0).notNull(),
  timeTaken: integer('time_taken').default(30000).notNull(), // milliseconds
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

export const battleEvents = pgTable('battle_events', {
  id: serial('id').primaryKey(),
  battleId: text('battle_id')
    .references(() => battles.id, { onDelete: 'cascade' })
    .notNull(),
  eventType: text('event_type').notNull(),
  payload: text('payload').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const battleStatistics = pgTable('battle_statistics', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  battleRating: integer('battle_rating').default(1200).notNull(),
  battlesPlayed: integer('battles_played').default(0).notNull(),
  battlesWon: integer('battles_won').default(0).notNull(),
  battlesLost: integer('battles_lost').default(0).notNull(),
  draws: integer('draws').default(0).notNull(),
  totalPoints: integer('total_points').default(0).notNull(),
  totalCorrectAnswers: integer('total_correct_answers').default(0).notNull(),
  totalQuestionsAnswered: integer('total_questions_answered').default(0).notNull(),
  totalAnswerTimeMs: integer('total_answer_time_ms').default(0).notNull(),
  favoriteTechnology: text('favorite_technology').default('Python').notNull(),
  bestTechnology: text('best_technology').default('Python').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  teachingSkills: many(userTeachingSkills),
  learningSkills: many(userLearningSkills),
  progressItems: many(progress),
  learningGoals: many(learningGoals),
  notifications: many(notifications),
}));

export const skillCategoriesRelations = relations(skillCategories, ({ many }) => ({
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
}));
