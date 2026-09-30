import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Database,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LiquidBackground,
  GlassCard,
  GlassButton,
} from '../components/ui/CommonUI.tsx';
import { SkillBridgeLogoIcon } from '../components/layout/AppLayout.tsx';

const PRD_MARKDOWN_CONTENT = `# Product Requirements Document (PRD)
Project Title: SkillBridge – Micro-Skill Exchange & Peer Learning Platform
Document Version: 1.0 (BCA Final-Year Academic Project)
Tagline: "Learn Together. Share Skills. Grow Together."

1. EXECUTIVE SUMMARY & PROBLEM STATEMENT
University students need practical micro-skills (Python, React, UI/UX Design, SQL, Excel, Video Editing, Public Speaking) for projects and placements. SkillBridge connects students who want to learn practical skills with peers who can teach them via a deterministic Rule-Based Compatibility Engine (+50/+30/+10/+10).

2. USER ROLES & ACCESS CONTROL (RBAC)
- STUDENT: Default registration role. Can manage profile, teaching/learning skills, discover peers, send/receive learning requests, connect, chat, schedule sessions, rate sessions, and track progress/goals.
- ADMIN: Database-authorized role (profiles.role = 'ADMIN'). Accesses /admin console for KPIs, user management, skill/category CRUD, session auditing, and report moderation.

3. FUNCTIONAL REQUIREMENTS (FR-01 to FR-12)
- FR-01: Authentication & 6-Digit Email Verification (/register, /verify-email, /login, /forgot-password, /reset-password, Google OAuth)
- FR-02: Student Skill-Based Profile (/profile)
- FR-03: Relational Skills & Categories Portfolio (/my-skills)
- FR-04: Academic Skill Search & Multi-Dimensional Filter Interface (/discover)
- FR-05: Rule-Based Peer Matching Engine (+50 Teaches You, +30 Learns From You, +10 Category Match, +10 Availability Overlap = up to 100%)
- FR-06: Learning Requests & Peer Connections (/requests, /connections)
- FR-07: 1-on-1 Connected Peer Chat (/messages)
- FR-08: Session Scheduling, Completion & Auto-Progress Update (/sessions)
- FR-09: 1-to-5 Star Ratings & Session Reviews (/sessions, /profile)
- FR-10: Learning Progress & Learning Goals (/progress, /goals)
- FR-11: Notifications, User Reporting & Blocking (/notifications, /settings)
- FR-12: Admin Management Console & Analytics (/admin/*)

4. NORMALIZED POSTGRESQL DATABASE SCHEMA (16 TABLES)
1. profiles
2. skill_categories
3. skills
4. user_teaching_skills
5. user_learning_skills
6. learning_requests
7. connections
8. conversations
9. messages
10. sessions
11. reviews
12. progress
13. learning_goals
14. notifications
15. reports
16. blocked_users
`;

export const PrdPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { profile, showToast } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'functional' | 'algorithm' | 'schema'>(
    'overview'
  );

  const handleDownloadMarkdown = () => {
    const blob = new Blob([PRD_MARKDOWN_CONTENT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SkillBridge_PRD_v1.0.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded SkillBridge_PRD_v1.0.md', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const functionalModules = [
    {
      id: 'FR-01',
      title: 'Authentication & Email Verification',
      routes: '/login, /register, /verify-email, /forgot-password, /reset-password',
      priority: 'P0 (Critical)',
      specs: [
        'Email/Password registration with form validation & 6-digit email verification gate.',
        'Google OAuth Sign-In via Firebase Auth (signInWithPopup) with automatic token sync.',
        'Forgot password & reset password workflow with verification code.',
        'Default registration role strictly enforced as STUDENT.',
      ],
    },
    {
      id: 'FR-02',
      title: 'Skill-Based Student Profile',
      routes: '/profile',
      priority: 'P0 (Critical)',
      specs: [
        'Fields: Full Name, Profile Photo (upload validation), Email, Bio, College, Course, Year, Location, Availability.',
        'Computed metrics: Average Star Rating, Review Count, Completed Sessions, Overall Learning Progress.',
        'Displays Skills I Can Teach, Skills I Want To Learn, and recent student reviews.',
      ],
    },
    {
      id: 'FR-03',
      title: 'Relational Skills & Categories System',
      routes: '/my-skills, /admin/skills, /admin/categories',
      priority: 'P0 (Critical)',
      specs: [
        'Normalized skill_categories (12 categories) and skills (20+ canonical skills) tables.',
        'Students manage Teaching Skills and Learning Skills with proficiency levels (Beginner, Intermediate, Advanced).',
        'Prevents duplicate skill entries per student and auto-initializes progress tracking for learning skills.',
      ],
    },
    {
      id: 'FR-04',
      title: 'Academic Skill Search & Filter Interface',
      routes: '/discover',
      priority: 'P0 (Critical)',
      specs: [
        'Database-driven search across academic skills, categories, student names, and colleges.',
        'Quick-select popular academic skill chips for one-click filtering.',
        'Multi-dimensional filters: Category, Specific Skill Taught, Proficiency Level, Availability, and Mutual Exchange Only.',
        'Sorting by Highest Compatibility, Highest Rating, or Most Sessions Completed.',
      ],
    },
    {
      id: 'FR-05',
      title: 'Rule-Based Peer Matching Engine',
      routes: '/dashboard, /discover',
      priority: 'P0 (Critical)',
      specs: [
        'Deterministic scoring (0–100%): +50 (Peer teaches what you want to learn), +30 (You teach what peer wants to learn), +10 (Category overlap), +10 (Availability overlap).',
        'Generates human-readable match explanations ("You can learn Python from Rahul." / "Rahul can learn UI/UX from you.").',
      ],
    },
    {
      id: 'FR-06',
      title: 'Learning Requests & Peer Connections',
      routes: '/requests, /connections',
      priority: 'P0 (Critical)',
      specs: [
        'Incoming and Outgoing request queues with Pending, Accepted, Rejected, and Cancelled states.',
        'Prevents self-requests and duplicate active requests between the same pair of students.',
        'Accepting a request automatically creates an active Connection and 1-on-1 Conversation.',
      ],
    },
    {
      id: 'FR-07',
      title: '1-on-1 Connected Peer Chat',
      routes: '/messages',
      priority: 'P1 (High)',
      specs: [
        'Restricted strictly to connected peers; blocked users cannot send or receive messages.',
        'Includes conversation list, unread badges, online indicator, timestamps, and auto-scroll.',
      ],
    },
    {
      id: 'FR-08',
      title: 'Session Scheduling, Completion & Reviews',
      routes: '/sessions',
      priority: 'P0 (Critical)',
      specs: [
        'Schedule sessions with Teacher, Learner, Skill, Date (past-date prevented), Start Time, Duration, and Notes.',
        'Marking a session Completed automatically updates the learner’s skill progress percentage.',
        '1-to-5 star rating and review submission with unique session constraint to prevent duplicate reviews.',
      ],
    },
    {
      id: 'FR-09',
      title: 'Learning Progress & Learning Goals',
      routes: '/progress, /goals',
      priority: 'P1 (High)',
      specs: [
        'Track starting level → current level, progress bar (0–100%), completed sessions, and topics covered.',
        'Create and manage Learning Goals with target dates and statuses (Not Started, In Progress, Completed).',
      ],
    },
    {
      id: 'FR-10',
      title: 'Notifications, Reporting & Blocking',
      routes: '/notifications, /settings',
      priority: 'P1 (High)',
      specs: [
        'Navbar notification bell with unread badge, mark-as-read, and mark-all-as-read.',
        'Report users (Spam, Harassment, Fake profile, Inappropriate behavior, Other) and block/unblock users.',
      ],
    },
    {
      id: 'FR-11',
      title: 'Admin Dashboard & Moderation Console',
      routes: '/admin, /admin/users, /admin/skills, /admin/categories, /admin/sessions, /admin/reports',
      priority: 'P0 (Critical)',
      specs: [
        'Protected by database-level ADMIN role check.',
        '8 KPI cards + charts for Popular Skills, Session Status Breakdown, and Platform Growth.',
        'User activation/deactivation, safe skill/category CRUD with reference checks, and report resolution.',
      ],
    },
  ];

  const schemaTables = [
    { name: 'profiles', pk: 'id (text)', desc: 'Authenticated user accounts, academic metadata, availability, and role (STUDENT | ADMIN).' },
    { name: 'skill_categories', pk: 'id (serial)', desc: '12 canonical academic and practical skill categories.' },
    { name: 'skills', pk: 'id (serial)', desc: 'Canonical skills linked via foreign key to skill_categories(id).' },
    { name: 'user_teaching_skills', pk: 'id (serial)', desc: 'Skills a student can teach with proficiency level (Beginner/Intermediate/Advanced).' },
    { name: 'user_learning_skills', pk: 'id (serial)', desc: 'Skills a student wants to learn with starting level.' },
    { name: 'learning_requests', pk: 'id (serial)', desc: 'Peer skill exchange requests with sender_id, receiver_id, skill_id, message, and status.' },
    { name: 'connections', pk: 'id (serial)', desc: 'Established peer learning connections created when a request is accepted.' },
    { name: 'conversations', pk: 'id (serial)', desc: '1-on-1 chat rooms uniquely linked to an active connection.' },
    { name: 'messages', pk: 'id (serial)', desc: 'Chat messages with sender_id, content, is_read flag, and timestamp.' },
    { name: 'sessions', pk: 'id (serial)', desc: 'Scheduled, completed, and cancelled 1-on-1 learning sessions.' },
    { name: 'reviews', pk: 'id (serial)', desc: '1–5 star ratings and comments uniquely referencing sessions(id).' },
    { name: 'progress', pk: 'id (serial)', desc: 'Skill mastery percentage, level progression, sessions count, and completed topics.' },
    { name: 'learning_goals', pk: 'id (serial)', desc: 'Student learning milestones with target date, progress percentage, and status.' },
    { name: 'notifications', pk: 'id (serial)', desc: 'System alerts for requests, connections, sessions, messages, and reviews.' },
    { name: 'reports', pk: 'id (serial)', desc: 'User misconduct reports reviewed and resolved by administrators.' },
    { name: 'blocked_users', pk: 'id (serial)', desc: 'User block relationships enforced across discovery, requests, and messaging.' },
  ];

  const content = (
    <div className="space-y-8">
      {/* Header Banner */}
      <GlassCard
        level={2}
        className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-indigo-300 text-xs font-mono uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Product Requirements Document · PRD v1.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SkillBridge – Micro-Skill Exchange &amp; Peer Learning Platform
          </h1>
          <p className="text-sm text-white/65 max-w-3xl">
            Complete functional, architectural, algorithmic, and relational database specification
            for the BCA Final-Year Academic Project.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
          <GlassButton variant="secondary" onClick={handleDownloadMarkdown}>
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download PRD.md</span>
          </GlassButton>
          <GlassButton variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {[
          { id: 'overview', label: '1. Executive Summary & Roles', icon: BookOpen },
          { id: 'functional', label: '2. Functional Requirements (FR-01–FR-11)', icon: Layers },
          { id: 'algorithm', label: '3. Rule-Based Matching Spec', icon: Sparkles },
          { id: 'schema', label: '4. Database Schema (16 Tables)', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                active
                  ? 'bg-gradient-to-r from-purple-600/40 via-indigo-600/40 to-blue-600/40 text-white border-white/25 shadow-[0_4px_20px_rgba(79,70,229,0.28)]'
                  : 'bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & RBAC */}
      {(activeTab === 'overview' || typeof window === 'undefined') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard level={2} className="p-6 space-y-3">
              <h2 className="text-base font-extrabold text-white">
                1.1 Problem Statement &amp; Academic Context
              </h2>
              <p className="text-xs text-white/70 leading-relaxed">
                Students pursuing university degrees (such as BCA, B.Tech, B.Sc CS) regularly need
                practical micro-skills like <strong className="text-white">Python</strong>,{' '}
                <strong className="text-white">React</strong>,{' '}
                <strong className="text-white">UI/UX Design</strong>,{' '}
                <strong className="text-white">SQL</strong>, or{' '}
                <strong className="text-white">Video Editing</strong>. While commercial bootcamps
                are costly, fellow students on campus already possess these exact skills and want to
                learn other skills in return.
              </p>
              <p className="text-xs text-white/70 leading-relaxed">
                <strong className="text-white">SkillBridge</strong> solves this by providing a
                structured, verified peer learning platform where students discover compatible
                partners, exchange skills 1-on-1, schedule sessions, and track measurable progress.
              </p>
            </GlassCard>

            <GlassCard level={2} className="p-6 space-y-3">
              <h2 className="text-base font-extrabold text-white">
                1.2 Technology Stack Specification
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="font-mono font-bold text-cyan-300 block mb-1">Frontend</span>
                  <span className="text-white/75">
                    React 19, TypeScript, Tailwind CSS, Liquid Glass UI, Lucide Icons
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="font-mono font-bold text-indigo-300 block mb-1">
                    Backend &amp; API
                  </span>
                  <span className="text-white/75">
                    Node.js, Express, RESTful JSON Endpoints, Role Middleware
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="font-mono font-bold text-purple-300 block mb-1">
                    Database &amp; ORM
                  </span>
                  <span className="text-white/75">
                    Cloud SQL for PostgreSQL, Drizzle ORM, Connection Pooling
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="font-mono font-bold text-emerald-300 block mb-1">
                    Authentication
                  </span>
                  <span className="text-white/75">
                    Firebase Auth (Google OAuth) + Email/Password &amp; 6-Digit Verification
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Role-Based Access Control Matrix */}
          <GlassCard level={2} className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-extrabold text-white">
                1.3 Role-Based Access Control (RBAC) &amp; Security Matrix
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-white/55 font-mono uppercase">
                    <th className="py-3 px-4">Capability / Resource</th>
                    <th className="py-3 px-4">Public (Unauthenticated)</th>
                    <th className="py-3 px-4">STUDENT (Verified)</th>
                    <th className="py-3 px-4">ADMIN (Database Role)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">
                      Landing Page, Auth &amp; PRD
                    </td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">Allowed ✓</td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">Allowed ✓</td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">Allowed ✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">
                      Manage Own Profile, Skills, Progress &amp; Goals
                    </td>
                    <td className="py-3 px-4 text-rose-300">Blocked (401)</td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">Own Records Only ✓</td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">Own Records Only ✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">
                      Discover Peers, Send Requests, Chat &amp; Schedule Sessions
                    </td>
                    <td className="py-3 px-4 text-rose-300">Blocked (401)</td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">Connected Peers ✓</td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">Connected Peers ✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">
                      Manage Canonical Skills, Categories, Users &amp; Reports (/admin/*)
                    </td>
                    <td className="py-3 px-4 text-rose-300">Blocked (401)</td>
                    <td className="py-3 px-4 text-rose-300 font-bold">Forbidden (403)</td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">Full Admin Access ✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: FUNCTIONAL REQUIREMENTS */}
      {activeTab === 'functional' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {functionalModules.map((m) => (
            <GlassCard key={m.id} level={2} interactive className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300 font-extrabold">{m.id}</span>
                <span className="text-emerald-300">{m.priority}</span>
              </div>
              <h3 className="text-base font-extrabold text-white">{m.title}</h3>
              <p className="text-[11px] font-mono text-white/50">Routes: {m.routes}</p>
              <ul className="space-y-1.5 pt-1">
                {m.specs.map((s, idx) => (
                  <li key={idx} className="text-xs text-white/70 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      )}

      {/* TAB 3: RULE-BASED MATCHING SPECIFICATION */}
      {activeTab === 'algorithm' && (
        <GlassCard level={2} className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-white">
              Deterministic Rule-Based Compatibility Scoring Specification
            </h2>
            <p className="text-xs text-white/65 mt-1">
              Implemented in <code className="text-cyan-300">src/db/matching.ts</code> using
              relational set intersection over{' '}
              <code className="text-cyan-300">user_teaching_skills</code> and{' '}
              <code className="text-cyan-300">user_learning_skills</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-xs font-mono font-extrabold text-indigo-300">+50 POINTS</span>
              <h4 className="text-sm font-bold text-white mt-1">Direct Learning Match</h4>
              <p className="text-xs text-white/65 mt-1">
                Peer teaches at least one skill that the current student wants to learn.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-xs font-mono font-extrabold text-emerald-300">+30 POINTS</span>
              <h4 className="text-sm font-bold text-white mt-1">Mutual Exchange Bonus</h4>
              <p className="text-xs text-white/65 mt-1">
                Current student can teach at least one skill that the peer wants to learn.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-xs font-mono font-extrabold text-cyan-300">+10 POINTS</span>
              <h4 className="text-sm font-bold text-white mt-1">Category Affinity</h4>
              <p className="text-xs text-white/65 mt-1">
                Both students share skills belonging to the same academic category.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-xs font-mono font-extrabold text-amber-300">+10 POINTS</span>
              <h4 className="text-sm font-bold text-white mt-1">Schedule Overlap</h4>
              <p className="text-xs text-white/65 mt-1">
                Both students have overlapping study availability windows.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#07070B]/90 border border-white/15 text-white space-y-3 text-xs">
            <p className="font-mono font-bold uppercase tracking-wider text-indigo-300">
              Canonical Viva Test Case (Section 44 Specification)
            </p>
            <p className="text-white/75">
              · <strong className="text-white">User A (Current Student):</strong> Can Teach{' '}
              <code className="text-cyan-300">UI/UX</code> (Design) | Wants To Learn{' '}
              <code className="text-cyan-300">Python</code> (Programming) | Availability:{' '}
              <code className="text-cyan-300">Weekdays &amp; Weekends</code>
            </p>
            <p className="text-white/75">
              · <strong className="text-white">User B (Rahul Sharma):</strong> Can Teach{' '}
              <code className="text-cyan-300">Python</code> (Programming) | Wants To Learn{' '}
              <code className="text-cyan-300">UI/UX</code> (Design) | Availability:{' '}
              <code className="text-cyan-300">Weekdays &amp; Weekends</code>
            </p>
            <p className="text-emerald-300 font-mono font-bold pt-1">
              Compatibility Score = 50 (Teaches Python) + 30 (Wants UI/UX) + 0 (Cross-Category) +
              10 (Availability Overlap) = 90% Skill Match
            </p>
          </div>
        </GlassCard>
      )}

      {/* TAB 4: DATABASE SCHEMA */}
      {activeTab === 'schema' && (
        <GlassCard level={2} className="overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-base font-extrabold text-white">
              Normalized PostgreSQL Schema (16 Relational Tables)
            </h2>
            <p className="text-xs text-white/55 mt-0.5">
              Defined in <code className="text-cyan-300">src/db/schema.ts</code> and deployed to
              Cloud SQL for PostgreSQL.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-white/55 font-mono uppercase">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Table Name</th>
                  <th className="py-3 px-4">Primary Key</th>
                  <th className="py-3 px-4">Description &amp; Relationships</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {schemaTables.map((t, i) => (
                  <tr key={t.name} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-mono text-white/40">{i + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">{t.name}</td>
                    <td className="py-3 px-4 font-mono text-white/65">{t.pk}</td>
                    <td className="py-3 px-4 text-white/75">{t.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F5F5F7] flex flex-col relative overflow-x-hidden">
      <LiquidBackground />

      <header className="sticky top-3 z-30 mx-auto max-w-7xl w-full px-4 sm:px-6 print:hidden">
        <div className="glass-level-2 rounded-2xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <SkillBridgeLogoIcon />
            <span className="text-lg font-extrabold text-white tracking-tight">
              SkillBridge <span className="text-indigo-300 font-mono text-xs ml-1">PRD</span>
            </span>
          </Link>
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => navigate(profile ? '/dashboard' : '/')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{profile ? 'Back to Workspace' : 'Back to Home'}</span>
          </GlassButton>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 mt-2">
        {content}
      </main>
    </div>
  );
};
