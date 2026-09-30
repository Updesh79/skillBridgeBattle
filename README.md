# SkillBridge – Micro-Skill Exchange & Peer Learning Platform

> **BCA Final-Year Academic Project**  
> *Learn Together. Share Skills. Grow Together.*

## 1. Project Overview
**SkillBridge** is a full-stack academic web application that enables university students to exchange practical micro-skills with their peers. Instead of paying for external tutoring, a student who knows **UI/UX Design** and wants to learn **Python** is matched with a peer who teaches **Python** and wants to learn **UI/UX Design**.

## 2. Core Features
1. **Complete Authentication & Email Verification**: Registration (`/register`), 6-digit Email Verification (`/verify-email`), Login (`/login`), Google OAuth Sign-In, Forgot/Reset Password (`/forgot-password`, `/reset-password`), and Role-Based Access Control (`STUDENT` and `ADMIN`).
2. **Skill-Based Student Profiles**: Academic profile with bio, college, course, year, availability, avatar upload, average rating, and completed session count.
3. **Relational Skills Portfolio (`/my-skills`)**: Manage *Skills I Can Teach* and *Skills I Want To Learn* linked to canonical `skills` and `skill_categories` tables.
4. **Academic Skill Search & Filter Interface (`/discover`)**: Search students by skill, name, or college; quick-select popular academic skill chips; filter by category, skill taught, proficiency level, schedule availability, or mutual exchange; sort by compatibility score, rating, or completed sessions.
5. **Rule-Based Peer Matching Engine**: Deterministic scoring algorithm calculating compatibility percentages (`90% Skill Match`) and human-readable explanations.
6. **Learning Requests & Connections (`/requests`, `/connections`)**: Send, accept, reject, or cancel learning requests. Accepting a request establishes an active peer connection and conversation.
7. **1-on-1 Peer Chat (`/messages`)**: Direct messaging restricted strictly to connected peers.
8. **Session Scheduling & Reviews (`/sessions`)**: Schedule study sessions (with past-date prevention), mark sessions complete, automatically update learning progress, and submit 1–5 star ratings and reviews.
9. **Learning Progress & Goals (`/progress`, `/goals`)**: Track skill mastery percentages, completed topics, and target dates.
10. **Safety, Reporting & Blocking (`/settings`)**: Report misconduct to administrators and block/unblock users.
11. **Admin Management Console (`/admin/*`)**: Separate administrator dashboard for platform KPIs, charts, user activation/deactivation, skill/category CRUD with active-reference checks, session auditing, and report moderation.

## 3. Rule-Based Matching Algorithm (BCA Viva Explanation)
SkillBridge uses a transparent **Rule-Based Compatibility Algorithm** (`src/db/matching.ts`) rather than black-box machine learning:

| Rule Condition | Points Awarded | Purpose |
| :--- | :---: | :--- |
| Peer teaches a skill the current student wants to learn | **+50 pts** | Primary learning requirement |
| Current student teaches a skill the peer wants to learn | **+30 pts** | Mutual two-way skill exchange |
| Both students share skills in the same academic category | **+10 pts** | Domain affinity bonus |
| Both students have overlapping schedule availability | **+10 pts** | Practical scheduling feasibility |
| **Maximum Normalized Compatibility Score** | **100%** | Displayed as e.g. `90% Skill Match` |

### Classic Mutual Exchange Example:
- **Student A (You)**: Can Teach `UI/UX` (Design) • Wants To Learn `Python` (Programming)
- **Student B (Rahul Sharma)**: Can Teach `Python` (Programming) • Wants To Learn `UI/UX` (Design)
- **Score Calculation**: `+50` (Rahul teaches Python) + `+30` (You teach UI/UX) + `+10` (Overlapping Availability) = **90% Skill Match**
- **Generated Explanation**:
  - *"You can learn Python from Rahul."*
  - *"Rahul can learn UI/UX from you."*

## 4. Database Schema (Normalized PostgreSQL)
Managed via Drizzle ORM (`src/db/schema.ts`) on Cloud SQL for PostgreSQL:
- `profiles` (`id`, `uid`, `full_name`, `email`, `role`, `is_active`, `college`, `course`, `year`, `availability`, ...)
- `skill_categories` & `skills`
- `user_teaching_skills` & `user_learning_skills`
- `learning_requests` & `connections`
- `sessions` & `reviews`
- `progress` & `learning_goals`
- `conversations` & `messages`
- `notifications`, `reports`, & `blocked_users`

## 5. How to Create an Admin Account Securely
All public registrations default to `role = 'STUDENT'`. Students cannot promote themselves to `ADMIN` from the frontend. To promote an account to Administrator in PostgreSQL:
```sql
UPDATE profiles SET role = 'ADMIN' WHERE email = 'your-admin-email@university.edu';
```
