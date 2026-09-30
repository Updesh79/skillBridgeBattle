# Product Requirements Document (PRD)

**Project Title:** SkillBridge – Micro-Skill Exchange & Peer Learning Platform  
**Document Version:** 1.0 (Final Academic Release)  
**Academic Program:** Bachelor of Computer Applications (BCA) – Final Year Project  
**Tagline:** *"Learn Together. Share Skills. Grow Together."*

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
University and college students frequently need practical micro-skills—such as **Python**, **React**, **UI/UX Design**, **SQL**, **Excel**, **Video Editing**, or **Public Speaking**—to complete semester projects, prepare for placements, and build portfolios. However:
1. Commercial courses and private tutors are expensive and lack personalized 1-on-1 interaction.
2. Within the same campus or university network, fellow students already possess expertise in these exact skills and are eager to learn complementary skills in return.
3. No structured platform exists to discover compatible peers, quantify mutual skill compatibility, schedule 1-on-1 study sessions, and track measurable learning progress.

### 1.2 Product Solution
**SkillBridge** is a full-stack peer-to-peer micro-skill exchange platform where students trade knowledge directly. A student who can teach **UI/UX Design** and wants to learn **Python** is matched via a transparent, deterministic **Rule-Based Compatibility Engine** with a peer who teaches **Python** and wants to learn **UI/UX Design**.

---

## 2. Product Objectives & Success Metrics

| Objective | Key Result / Metric | Target |
| :--- | :--- | :--- |
| **Zero-Cost Peer Tutoring** | Enable direct 1-on-1 skill exchange without monetary transactions | 100% free student barter |
| **Accurate Peer Discovery** | Match students using rule-based compatibility scoring (`0–100%`) | `90%+` score on mutual skill pairs |
| **Structured Learning** | Track scheduled vs. completed sessions, topics covered, and skill progression | Real-time progress bar updates |
| **Quality & Trust** | Verified student emails, 1–5 star session reviews, user blocking, and admin moderation | 1 review per completed session |

---

## 3. User Roles & Access Control (RBAC)

SkillBridge enforces strict separation of privileges across two roles stored in PostgreSQL (`profiles.role`):

1. **STUDENT (Default Role)**
   - Assigned automatically upon registration.
   - Cannot self-promote to `ADMIN` from any frontend interface or API payload.
   - Can manage own profile, teaching/learning skills, peer discovery, learning requests, connections, 1-on-1 chat, sessions, reviews, learning progress, goals, and privacy/blocking settings.

2. **ADMIN (Administrator Role)**
   - Controlled strictly at the database level (`profiles.role = 'ADMIN'`).
   - Verified by backend middleware (`requireAdmin`) on every `/api/admin/*` route.
   - Can view platform KPIs & analytics charts, activate/deactivate users, perform CRUD on skill categories and canonical skills (with active-reference protection), audit sessions, and resolve user misconduct reports.

---

## 4. Functional Requirements

### FR-01: Authentication & Email Verification
- **Routes:** `/register`, `/verify-email`, `/login`, `/forgot-password`, `/reset-password`
- **Requirements:**
  - Support Google OAuth Sign-In (`signInWithPopup`) and Email/Password registration.
  - Validate full name, email format, minimum password length (6+ characters), and password confirmation.
  - Require 6-digit email verification before granting student workspace access; provide resend verification option.
  - Support password reset flow via verification code.

### FR-02: Student Skill-Based Profile
- **Route:** `/profile`
- **Requirements:**
  - Store and display Full Name, Profile Photo (with image upload validation), Email, Bio, College/University, Course, Year, Location, and Schedule Availability.
  - Display computed metrics: Average Star Rating, Total Reviews, Completed Sessions, Skills Taught, Skills Learning, and Overall Learning Progress.

### FR-03: Canonical Skills & Categories System
- **Route:** `/my-skills`, `/admin/skills`, `/admin/categories`
- **Requirements:**
  - Relational taxonomy linking `skills` to `skill_categories` (Programming, Web Development, Mobile Development, Database, Design, Video Editing, Communication, Digital Marketing, Data Analytics, Photography, Languages, Other).
  - Students manage **Skills I Can Teach** and **Skills I Want To Learn** with proficiency levels (`Beginner`, `Intermediate`, `Advanced`).
  - Prevent duplicate skill assignments for the same user.

### FR-04: Academic Skill Search & Filter Interface
- **Route:** `/discover`
- **Requirements:**
  - Database-backed search across skill names, categories, student names, and colleges.
  - Quick-select filter chips for popular academic skills.
  - Multi-dimensional filters: **Academic Category**, **Specific Skill Taught**, **Proficiency Level**, **Schedule Availability**, and **Mutual Exchange Only**.
  - Sorting by **Highest Compatibility**, **Highest Rating**, or **Most Sessions Completed** with pagination.

### FR-05: Rule-Based Peer Matching Engine
- **Routes:** `/dashboard`, `/discover`
- **Requirements:**
  - Deterministic compatibility calculation (`0%` to `100%`) without black-box ML:
    - **+50 points:** Peer teaches at least one skill the current student wants to learn.
    - **+30 points:** Current student teaches at least one skill the peer wants to learn (Mutual Exchange).
    - **+10 points:** Both students share skills within the same academic category.
    - **+10 points:** Both students have overlapping schedule availability.
  - Generate human-readable explanations (e.g., *"You can learn Python from Rahul."* and *"Rahul can learn UI/UX from you."*).

### FR-06: Learning Requests & Peer Connections
- **Routes:** `/requests`, `/connections`
- **Requirements:**
  - Students send learning requests specifying the desired skill, optional offered skill, and personal message.
  - Prevent self-requests and duplicate active requests between the same pair of users.
  - Receivers can **Accept** or **Reject**; senders can **Cancel**.
  - Accepting a request automatically creates an active `connection`, initializes a `conversation`, and dispatches notifications.

### FR-07: Real-Time-Ready 1-on-1 Peer Chat
- **Route:** `/messages`
- **Requirements:**
  - Strictly restricted to connected peers who have not blocked each other.
  - Conversation list with unread message counts, active status indicator, message timestamps, and auto-scroll.

### FR-08: Learning Session Scheduling & Completion
- **Route:** `/sessions`
- **Requirements:**
  - Connected peers schedule sessions with Teacher, Learner, Skill, Date, Start Time, Duration, and Notes.
  - Prevent scheduling sessions on past dates or with invalid participants.
  - Support editing, cancelling, and marking sessions **Completed**.
  - Marking a session **Completed** automatically increments the learner's skill progress record.

### FR-09: Ratings & Reviews
- **Routes:** `/sessions`, `/profile`
- **Requirements:**
  - After a session is marked **Completed**, participants can rate the session (`1` to `5` stars) with a text comment.
  - Enforce a unique constraint on `reviews.session_id` to prevent duplicate reviews for the same session.
  - Dynamically recalculate the user's average rating across the platform.

### FR-10: Learning Progress & Learning Goals
- **Routes:** `/progress`, `/goals`
- **Requirements:**
  - Track per-skill progression (`starting_level` → `current_level`, `progress_percentage`, `sessions_completed`, `last_session_date`, `topics_completed`, `notes`).
  - Create and manage learning goals with target dates, progress sliders (`0–100%`), and statuses (`Not Started`, `In Progress`, `Completed`).

### FR-11: Notifications, Reporting & User Blocking
- **Routes:** `/notifications`, `/settings`
- **Requirements:**
  - Top navbar notification bell with unread counter, individual mark-as-read, and mark-all-as-read.
  - Report users for `Spam`, `Harassment`, `Fake profile`, `Inappropriate behavior`, or `Other`.
  - Block/unblock users; blocked users are excluded from recommendations, requests, and chat.

### FR-12: Admin Management Console
- **Routes:** `/admin`, `/admin/users`, `/admin/skills`, `/admin/categories`, `/admin/sessions`, `/admin/reports`, `/admin/settings`
- **Requirements:**
  - Display 8 KPI cards and visual charts for popular skills, session breakdown, and platform growth.
  - Search/filter users and deactivate/reactivate accounts (without exposing password hashes).
  - Manage categories and skills safely, warning administrators if a skill has active student/session references.
  - Review and resolve user misconduct reports with one-click account deactivation.

---

## 5. Database Schema Specification (Normalized PostgreSQL)

SkillBridge uses **16 normalized relational tables** in PostgreSQL managed with **Drizzle ORM** (`src/db/schema.ts`):

1. `profiles` – Student & Admin accounts, academic details, availability, notification preferences, and role.
2. `skill_categories` – Canonical academic skill categories.
3. `skills` – Canonical skills referencing `skill_categories(id)`.
4. `user_teaching_skills` – Skills offered by students with proficiency level.
5. `user_learning_skills` – Skills requested by students with target level.
6. `learning_requests` – Peer exchange invitations (`Pending`, `Accepted`, `Rejected`, `Cancelled`).
7. `connections` – Verified peer relationships created upon request acceptance.
8. `conversations` – 1-on-1 chat threads linked to `connections(id)`.
9. `messages` – Individual chat messages with read status and timestamps.
10. `sessions` – Scheduled, completed, and cancelled study sessions.
11. `reviews` – 1–5 star ratings and feedback linked uniquely to `sessions(id)`.
12. `progress` – Per-skill mastery percentage, level progression, and completed topics.
13. `learning_goals` – Student milestones with target completion dates.
14. `notifications` – System alerts for requests, sessions, messages, and reviews.
15. `reports` – Moderation reports submitted by students.
16. `blocked_users` – User block relationships enforced across discovery, requests, and chat.

---

## 6. Non-Functional Requirements

- **Security & Authorization:** Token-based authentication (`Authorization: Bearer <token>`) verified on all private endpoints; database-level ownership checks and `ADMIN` role verification; zero exposure of password hashes or secrets.
- **Data Integrity:** Foreign-key constraints, unique constraints on email/UID/session reviews, self-request prevention, and past-date session validation.
- **Responsive UI/UX:** Mobile-first and desktop-optimized layout using Tailwind CSS, loading skeletons, empty states, error states, and toast notifications.
