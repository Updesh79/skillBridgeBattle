export interface SkillEntry {
  id: number;
  skillId: number;
  name: string;
  categoryId: number;
  categoryName: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | string;
}

export interface CategoryItem {
  id: number;
  name: string;
  description: string;
}

export interface CatalogSkill {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  description: string;
}

export interface ReviewItem {
  id: number;
  sessionId: number;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProgressItem {
  id: number;
  skillId: number;
  skillName: string;
  categoryName: string;
  startingLevel: string;
  currentLevel: string;
  progressPercentage: number;
  sessionsCompleted: number;
  lastSessionDate: string;
  topicsCompleted: string;
  notes: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  avatarUrl: string;
  bio: string;
  college: string;
  course: string;
  year: string;
  location: string;
  availability: string;
  role: 'STUDENT' | 'ADMIN';
  isActive: boolean;
  isDemo: boolean;
  notifyRequests: boolean;
  notifyMessages: boolean;
  notifySessions: boolean;
  notifyReviews: boolean;
  profileVisibility: string;
  accountType?: 'LEARNER' | 'MENTOR' | string;
  phoneNumber?: string;
  qualification?: string;
  careerGoal?: string;
  experienceYears?: string;
  experienceDescription?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  projectsUrl?: string;
  projectsText?: string;
  isVerifiedMentor?: boolean;
  mentorVerificationStatus?: 'Not Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | string;
  mentorVerifiedAt?: string | null;
  verifiedAt?: string | null;
  mentorVerifiedSkills?: string;
  verifiedSkills?: string;
  mentorReviewNote?: string;
  createdAt: string;
  teachingSkills: SkillEntry[];
  learningSkills: SkillEntry[];
  averageRating: number;
  reviewCount: number;
  completedSessionsCount: number;
  recentReviews: ReviewItem[];
  progress: ProgressItem[];
  goals?: LearningGoalItem[];
  overallProgress: number;
}

export interface SkillTestQuestionItem {
  id: number;
  testId: string;
  questionNumber: number;
  questionType: 'MCQ' | 'CODE';
  questionText: string;
  options: string[];
  starterCode: string;
  correctAnswer?: string;
  explanation?: string;
  points: number;
  userAnswer: string;
  isAnswered: boolean;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface SkillTestAttempt {
  id: string;
  userId: string;
  skill: string;
  difficulty: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';
  totalQuestions: number;
  durationSeconds: number;
  remainingSeconds?: number;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  timeTakenSeconds: number;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  passed: boolean;
  currentQuestionIndex: number;
  createdAt: string;
}

export interface CertificateItem {
  id: number;
  certificateId: string;
  userId: string;
  recipientName: string;
  title: string;
  skillName: string;
  certificateType: string;
  verificationStatus: string;
  score?: number | null;
  issuedBy: string;
  issueDate: string;
  createdAt: string;
}

export interface PeerMatchBreakdown {
  score: number;
  isMutualExchange: boolean;
  peerCanTeachMe: SkillEntry[];
  iCanTeachPeer: SkillEntry[];
  categoryOverlap: boolean;
  availabilityOverlap: boolean;
  summaryLines: string[];
  breakdown: {
    teachesMePoints: number;
    learnsFromMePoints: number;
    categoryPoints: number;
    availabilityPoints: number;
  };
}

export interface PeerProfile extends UserProfile {
  match: PeerMatchBreakdown;
  isConnected: boolean;
  hasPendingRequest: boolean;
}

export interface LearningRequestItem {
  id: number;
  senderId: string;
  receiverId: string;
  skillId: number;
  skillName: string;
  offeredSkillId?: number | null;
  offeredSkillName?: string | null;
  message: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';
  senderName: string;
  senderAvatar: string;
  senderCollege: string;
  receiverName: string;
  receiverAvatar: string;
  receiverCollege: string;
  createdAt: string;
}

export interface ConnectionItem {
  connectionId: number;
  connectedAt: string;
  conversationId: number | null;
  peer: UserProfile;
  sharedSessionsCount: number;
  completedSessionsCount: number;
}

export interface SessionItem {
  id: number;
  connectionId: number;
  teacherId: string;
  learnerId: string;
  skillId: number;
  skillName: string;
  teacherName: string;
  teacherAvatar: string;
  learnerName: string;
  learnerAvatar: string;
  scheduledDate: string;
  startTime: string;
  duration: number;
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  review: {
    id: number;
    rating: number;
    comment: string;
  } | null;
  createdAt: string;
}

export interface LearningGoalItem {
  id: number;
  userId: string;
  skillId: number | null;
  skillName: string | null;
  title: string;
  description: string;
  targetDate: string;
  progressPercentage: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  createdAt: string;
}

export interface ConversationItem {
  id: number;
  connectionId: number;
  peer: {
    id: string;
    fullName: string;
    avatarUrl: string;
    college: string;
    course: string;
    isDemo: boolean;
    teachingSkills: SkillEntry[];
  };
  lastMessage: {
    id: number;
    senderId: string;
    content: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessageItem {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationItemData {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}
