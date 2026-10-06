import { db } from './index.ts';
import {
  profiles,
  skillCategories,
  skills,
  userTeachingSkills,
  userLearningSkills,
  connections,
  sessions,
  reviews,
  skillTests,
  certificates,
} from './schema.ts';
import { eq } from 'drizzle-orm';

const INITIAL_CATEGORIES = [
  { name: 'Programming', description: 'Core software development, algorithms, and object-oriented languages' },
  { name: 'Web Development', description: 'Frontend and backend web technologies, frameworks, and APIs' },
  { name: 'Mobile Development', description: 'Cross-platform and native mobile app engineering' },
  { name: 'Database', description: 'Relational SQL and NoSQL database design and optimization' },
  { name: 'Design', description: 'UI/UX design, wireframing, prototyping, and visual graphics' },
  { name: 'Video Editing', description: 'Video post-production, motion graphics, and storytelling' },
  { name: 'Communication', description: 'Public speaking, presentation, and technical documentation' },
  { name: 'Digital Marketing', description: 'SEO, social media strategy, and content growth' },
  { name: 'Data Analytics', description: 'Spreadsheets, business intelligence, and data visualization' },
  { name: 'Photography', description: 'Digital photography, lighting, and composition' },
  { name: 'Languages', description: 'Spoken and written communication languages' },
  { name: 'Other', description: 'Additional interdisciplinary academic and practical micro-skills' },
];

const INITIAL_SKILLS: { name: string; category: string; description: string }[] = [
  { name: 'Python', category: 'Programming', description: 'General-purpose programming, scripting, automation, and data structures' },
  { name: 'Java', category: 'Programming', description: 'Object-oriented programming, collections, and enterprise application fundamentals' },
  { name: 'C++', category: 'Programming', description: 'Systems programming, STL, and competitive programming algorithms' },
  { name: 'C', category: 'Programming', description: 'Low-level procedural programming, pointers, and memory management' },
  { name: 'JavaScript', category: 'Web Development', description: 'Modern ES6+, asynchronous programming, and DOM manipulation' },
  { name: 'React', category: 'Web Development', description: 'Component-based frontend development with React hooks and state management' },
  { name: 'Node.js', category: 'Web Development', description: 'Event-driven server-side JavaScript runtime and REST APIs' },
  { name: 'HTML/CSS', category: 'Web Development', description: 'Semantic HTML5 markup and modern responsive CSS layouts' },
  { name: 'HTML', category: 'Web Development', description: 'Semantic web markup, accessibility, and document structure' },
  { name: 'CSS', category: 'Web Development', description: 'Responsive layouts, Flexbox, Grid, and modern styling' },
  { name: 'Flutter', category: 'Mobile Development', description: 'Cross-platform mobile apps using Dart and Flutter widgets' },
  { name: 'MongoDB', category: 'Database', description: 'Document-oriented NoSQL database modeling and aggregation pipelines' },
  { name: 'SQL', category: 'Database', description: 'Relational database queries, joins, normalization, and PostgreSQL' },
  { name: 'UI/UX', category: 'Design', description: 'User research, wireframing, interaction design, and usability systems' },
  { name: 'UI/UX Design', category: 'Design', description: 'Complete interface and user experience design for web and mobile apps' },
  { name: 'Graphic Design', category: 'Design', description: 'Visual identity, typography, posters, and digital layout design' },
  { name: 'Photoshop', category: 'Design', description: 'Image manipulation, retouching, and raster graphics composition' },
  { name: 'Figma', category: 'Design', description: 'Collaborative interface design, auto-layout, and interactive prototyping' },
  { name: 'Video Editing', category: 'Video Editing', description: 'Timeline editing, color grading, transitions, and audio syncing' },
  { name: 'Excel', category: 'Data Analytics', description: 'Formulas, pivot tables, VLOOKUP/XLOOKUP, and data modeling' },
  { name: 'Public Speaking', category: 'Communication', description: 'Stage confidence, project viva presentation, and structured pitching' },
  { name: 'Digital Marketing', category: 'Digital Marketing', description: 'Search engine optimization, campaign analytics, and audience reach' },
  { name: 'Photography', category: 'Photography', description: 'Manual camera controls, portrait framing, and natural lighting' },
];

const DEMO_STUDENTS = [
  {
    id: 'demo-rahul-sharma',
    uid: 'demo-rahul-sharma',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@demo.skillbridge.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    bio: 'BCA Final Year student passionate about Python backend architecture and JavaScript. Looking to exchange Python tutoring for UI/UX & Figma mentoring for my capstone project.',
    college: 'Delhi Technological University (DTU)',
    course: 'BCA',
    year: '3rd Year (Final)',
    location: 'New Delhi',
    availability: 'Weekdays & Weekends',
    teaching: [
      { skill: 'Python', level: 'Advanced' },
      { skill: 'JavaScript', level: 'Intermediate' },
      { skill: 'SQL', level: 'Advanced' },
    ],
    learning: [
      { skill: 'UI/UX', level: 'Beginner' },
      { skill: 'UI/UX Design', level: 'Beginner' },
      { skill: 'Figma', level: 'Beginner' },
    ],
  },
  {
    id: 'demo-priya-patel',
    uid: 'demo-priya-patel',
    fullName: 'Priya Patel',
    email: 'priya.patel@demo.skillbridge.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
    bio: 'Design lead for the university coding club. I love teaching UI/UX, Figma prototyping, and responsive HTML/CSS. Currently learning Python and React.',
    college: 'Christ University',
    course: 'BCA',
    year: '3rd Year (Final)',
    location: 'Bengaluru',
    availability: 'Weekdays & Weekends',
    teaching: [
      { skill: 'UI/UX', level: 'Advanced' },
      { skill: 'UI/UX Design', level: 'Advanced' },
      { skill: 'Figma', level: 'Advanced' },
      { skill: 'HTML', level: 'Advanced' },
      { skill: 'CSS', level: 'Advanced' },
    ],
    learning: [
      { skill: 'Python', level: 'Beginner' },
      { skill: 'React', level: 'Intermediate' },
    ],
  },
  {
    id: 'demo-aman-verma',
    uid: 'demo-aman-verma',
    fullName: 'Aman Verma',
    email: 'aman.verma@demo.skillbridge.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
    bio: 'Mobile & frontend developer building cross-platform student utilities with Flutter and React. Happy to mentor peers in Flutter or Java in exchange for SQL and Excel.',
    college: 'Symbiosis Institute of Computer Studies (SICSR)',
    course: 'BCA',
    year: '2nd Year',
    location: 'Pune',
    availability: 'Weekends',
    teaching: [
      { skill: 'Flutter', level: 'Advanced' },
      { skill: 'React', level: 'Intermediate' },
      { skill: 'Java', level: 'Intermediate' },
    ],
    learning: [
      { skill: 'SQL', level: 'Intermediate' },
      { skill: 'Excel', level: 'Beginner' },
      { skill: 'Python', level: 'Beginner' },
    ],
  },
  {
    id: 'demo-neha-gupta',
    uid: 'demo-neha-gupta',
    fullName: 'Neha Gupta',
    email: 'neha.gupta@demo.skillbridge.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
    bio: 'Database & Data Analytics enthusiast. I can help you master SQL joins, normalization, MongoDB, and advanced Excel. Looking to learn Video Editing and Public Speaking.',
    college: 'Loyola College',
    course: 'BCA',
    year: '3rd Year (Final)',
    location: 'Chennai',
    availability: 'Evenings',
    teaching: [
      { skill: 'SQL', level: 'Advanced' },
      { skill: 'Excel', level: 'Advanced' },
      { skill: 'MongoDB', level: 'Intermediate' },
    ],
    learning: [
      { skill: 'Video Editing', level: 'Beginner' },
      { skill: 'Public Speaking', level: 'Intermediate' },
    ],
  },
  {
    id: 'demo-arjun-nair',
    uid: 'demo-arjun-nair',
    fullName: 'Arjun Nair',
    email: 'arjun.nair@demo.skillbridge.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
    bio: 'Creative media producer & college debate team captain. Can teach Video Editing, Graphic Design, Photoshop, and Public Speaking. Eager to learn React and JavaScript.',
    college: "St. Xavier's College",
    course: 'BCA',
    year: '2nd Year',
    location: 'Mumbai',
    availability: 'Weekdays & Weekends',
    teaching: [
      { skill: 'Video Editing', level: 'Advanced' },
      { skill: 'Public Speaking', level: 'Advanced' },
      { skill: 'Graphic Design', level: 'Advanced' },
      { skill: 'Photoshop', level: 'Intermediate' },
    ],
    learning: [
      { skill: 'React', level: 'Beginner' },
      { skill: 'JavaScript', level: 'Beginner' },
      { skill: 'HTML', level: 'Beginner' },
    ],
  },
];

let isSeeded = false;

export async function ensureDefaultCatalogAndDemoPeers(forceReseed = false) {
  if (isSeeded && !forceReseed) return;
  try {
    // 1. Ensure categories exist
    for (const cat of INITIAL_CATEGORIES) {
      await db
        .insert(skillCategories)
        .values(cat)
        .onConflictDoNothing({ target: skillCategories.name });
    }

    const allCats = await db.select().from(skillCategories);
    const catMap = new Map(allCats.map((c) => [c.name, c.id]));

    // 2. Ensure skills exist
    for (const sk of INITIAL_SKILLS) {
      const catId = catMap.get(sk.category) || catMap.get('Other');
      if (catId) {
        await db
          .insert(skills)
          .values({
            name: sk.name,
            categoryId: catId,
            description: sk.description,
          })
          .onConflictDoNothing({ target: skills.name });
      }
    }

    const allSkills = await db.select().from(skills);
    const skillMap = new Map(allSkills.map((s) => [s.name, s.id]));

    // 3. Ensure demo peers exist
    for (const student of DEMO_STUDENTS) {
      await db
        .insert(profiles)
        .values({
          id: student.id,
          uid: student.uid,
          fullName: student.fullName,
          email: student.email,
          emailVerified: true,
          avatarUrl: student.avatarUrl,
          bio: student.bio,
          college: student.college,
          course: student.course,
          year: student.year,
          location: student.location,
          availability: student.availability,
          role: 'STUDENT',
          isActive: true,
          isDemo: true,
        })
        .onConflictDoNothing({ target: profiles.id });

      const existingTeach = await db
        .select()
        .from(userTeachingSkills)
        .where(eq(userTeachingSkills.userId, student.id));

      if (existingTeach.length === 0) {
        for (const t of student.teaching) {
          const sId = skillMap.get(t.skill);
          if (sId) {
            await db.insert(userTeachingSkills).values({
              userId: student.id,
              skillId: sId,
              level: t.level,
            });
          }
        }
      }

      const existingLearn = await db
        .select()
        .from(userLearningSkills)
        .where(eq(userLearningSkills.userId, student.id));

      if (existingLearn.length === 0) {
        for (const l of student.learning) {
          const sId = skillMap.get(l.skill);
          if (sId) {
            await db.insert(userLearningSkills).values({
              userId: student.id,
              skillId: sId,
              level: l.level,
            });
          }
        }
      }
    }

    // 4. Create sample completed sessions and reviews between demo peers if none exist yet
    const existingDemoConns = await db
      .select()
      .from(connections)
      .where(eq(connections.user1Id, 'demo-rahul-sharma'));

    if (existingDemoConns.length === 0) {
      const pythonId = skillMap.get('Python');
      const uiuxId = skillMap.get('UI/UX') || skillMap.get('UI/UX Design');
      const flutterId = skillMap.get('Flutter');
      const sqlId = skillMap.get('SQL');
      const videoId = skillMap.get('Video Editing');

      if (pythonId && uiuxId) {
        const [conn1] = await db
          .insert(connections)
          .values({
            user1Id: 'demo-rahul-sharma',
            user2Id: 'demo-priya-patel',
            status: 'Active',
          })
          .returning();

        const [sess1] = await db
          .insert(sessions)
          .values({
            connectionId: conn1.id,
            teacherId: 'demo-rahul-sharma',
            learnerId: 'demo-priya-patel',
            skillId: pythonId,
            scheduledDate: '2026-09-15',
            startTime: '17:00',
            duration: 60,
            notes: 'Python functions, list comprehensions, and dictionary manipulation for BCA lab.',
            status: 'Completed',
          })
          .returning();

        await db.insert(reviews).values({
          sessionId: sess1.id,
          reviewerId: 'demo-priya-patel',
          reviewedUserId: 'demo-rahul-sharma',
          rating: 5,
          comment: 'Rahul explained Python functions and data structures with crystal clear examples! Super helpful for my semester practicals.',
        });

        const [sess2] = await db
          .insert(sessions)
          .values({
            connectionId: conn1.id,
            teacherId: 'demo-priya-patel',
            learnerId: 'demo-rahul-sharma',
            skillId: uiuxId,
            scheduledDate: '2026-09-18',
            startTime: '18:30',
            duration: 60,
            notes: 'Wireframing, spacing hierarchy, and component auto-layout in Figma.',
            status: 'Completed',
          })
          .returning();

        await db.insert(reviews).values({
          sessionId: sess2.id,
          reviewerId: 'demo-rahul-sharma',
          reviewedUserId: 'demo-priya-patel',
          rating: 5,
          comment: 'Priya completely transformed how I design my project dashboards. Best peer mentor on campus!',
        });
      }

      if (flutterId && sqlId && videoId) {
        const [conn2] = await db
          .insert(connections)
          .values({
            user1Id: 'demo-aman-verma',
            user2Id: 'demo-neha-gupta',
            status: 'Active',
          })
          .returning();

        const [sess3] = await db
          .insert(sessions)
          .values({
            connectionId: conn2.id,
            teacherId: 'demo-neha-gupta',
            learnerId: 'demo-aman-verma',
            skillId: sqlId,
            scheduledDate: '2026-09-20',
            startTime: '16:00',
            duration: 60,
            notes: 'PostgreSQL INNER/LEFT JOINs and indexing strategies.',
            status: 'Completed',
          })
          .returning();

        await db.insert(reviews).values({
          sessionId: sess3.id,
          reviewerId: 'demo-aman-verma',
          reviewedUserId: 'demo-neha-gupta',
          rating: 5,
          comment: 'Neha made complex SQL joins and subqueries feel effortless.',
        });

        const [sess4] = await db
          .insert(sessions)
          .values({
            connectionId: conn2.id,
            teacherId: 'demo-aman-verma',
            learnerId: 'demo-neha-gupta',
            skillId: flutterId,
            scheduledDate: '2026-09-21',
            startTime: '11:00',
            duration: 45,
            notes: 'Stateful widgets and navigation in Flutter.',
            status: 'Completed',
          })
          .returning();

        await db.insert(reviews).values({
          sessionId: sess4.id,
          reviewerId: 'demo-neha-gupta',
          reviewedUserId: 'demo-aman-verma',
          rating: 4,
          comment: 'Great walkthrough of Flutter widget trees and hot reload workflow!',
        });

        const [conn3] = await db
          .insert(connections)
          .values({
            user1Id: 'demo-arjun-nair',
            user2Id: 'demo-neha-gupta',
            status: 'Active',
          })
          .returning();

        const [sess5] = await db
          .insert(sessions)
          .values({
            connectionId: conn3.id,
            teacherId: 'demo-arjun-nair',
            learnerId: 'demo-neha-gupta',
            skillId: videoId,
            scheduledDate: '2026-09-22',
            startTime: '19:00',
            duration: 60,
            notes: 'Cutting project demo videos and clean audio transitions.',
            status: 'Completed',
          })
          .returning();

        await db.insert(reviews).values({
          sessionId: sess5.id,
          reviewerId: 'demo-neha-gupta',
          reviewedUserId: 'demo-arjun-nair',
          rating: 5,
          comment: 'Arjun taught me how to edit a crisp 3-minute project demo reel in one evening!',
        });
      }
    }

    // 5. Enrich demo mentor profiles & sample certificates if not yet set
    await db
      .update(profiles)
      .set({
        accountType: 'MENTOR',
        phoneNumber: '+91 98765 43210',
        qualification: 'Graduation',
        experienceYears: '2 Years',
        experienceDescription: 'Peer mentor for Python data structures, SQL optimization, and backend APIs across 4 semesters.',
        githubUrl: 'https://github.com/rahulsharma-dtu',
        linkedinUrl: 'https://linkedin.com/in/rahulsharma-dtu',
        projectsUrl: 'https://rahulsharma.dev/projects',
        isVerifiedMentor: true,
        mentorVerificationStatus: 'Approved',
        mentorVerifiedAt: new Date('2026-09-20T10:00:00Z'),
        mentorVerifiedSkills: 'Python, JavaScript, SQL',
        mentorReviewNote: 'Strong Python & SQL verification test score (90/100) and active GitHub portfolio.',
      })
      .where(eq(profiles.id, 'demo-rahul-sharma'));

    const [priyaProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, 'demo-priya-patel'));

    if (priyaProfile && priyaProfile.mentorVerificationStatus === 'Not Submitted') {
      await db
        .update(profiles)
        .set({
          accountType: 'MENTOR',
          phoneNumber: '+91 98111 22334',
          qualification: 'Graduation',
          experienceYears: '1.5 Years',
          experienceDescription: 'UI/UX Design Club Lead & Frontend Workshop Facilitator.',
          githubUrl: 'https://github.com/priyapatel-ui',
          linkedinUrl: 'https://linkedin.com/in/priyapatel-design',
          projectsUrl: 'https://dribbble.com/priyapatel',
          isVerifiedMentor: false,
          mentorVerificationStatus: 'Pending Review',
        })
        .where(eq(profiles.id, 'demo-priya-patel'));

      await db
        .insert(skillTests)
        .values({
          id: 'TEST-2026-100201',
          userId: 'demo-priya-patel',
          skill: 'HTML/CSS',
          difficulty: 'Intermediate',
          status: 'SUBMITTED',
          totalQuestions: 20,
          durationSeconds: 900,
          startedAt: new Date('2026-09-25T14:00:00Z'),
          expiresAt: new Date('2026-09-25T14:15:00Z'),
          submittedAt: new Date('2026-09-25T14:11:20Z'),
          timeTakenSeconds: 680,
          score: 85,
          maxScore: 100,
          percentage: 85,
          correctCount: 17,
          incorrectCount: 2,
          unansweredCount: 1,
          passed: true,
          currentQuestionIndex: 19,
        })
        .onConflictDoNothing({ target: skillTests.id });
    }

    await db
      .insert(certificates)
      .values({
        certificateId: 'SB-CERT-2026-000101',
        userId: 'demo-rahul-sharma',
        recipientName: 'Rahul Sharma',
        title: 'Verified Peer Mentor – Python & Backend Architecture',
        skillName: 'Python',
        certificateType: 'MENTOR_VERIFICATION',
        verificationStatus: 'Verified',
        score: 90,
        issuedBy: 'SkillBridge Academic Board',
        issueDate: '2026-09-20',
      })
      .onConflictDoNothing({ target: certificates.certificateId });

    await db
      .insert(certificates)
      .values({
        certificateId: 'SB-CERT-2026-000102',
        userId: 'demo-priya-patel',
        recipientName: 'Priya Patel',
        title: 'Certificate of Skill Mastery – UI/UX Design & Prototyping',
        skillName: 'UI/UX Design',
        certificateType: 'SKILL_COMPLETION',
        verificationStatus: 'Verified',
        score: 95,
        issuedBy: 'SkillBridge Academic Board',
        issueDate: '2026-09-22',
      })
      .onConflictDoNothing({ target: certificates.certificateId });

    isSeeded = true;
  } catch (error) {
    console.error('Error seeding default catalog and demo peers:', error);
  }
}
