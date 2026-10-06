import { Router, type Response, type NextFunction } from 'express';
import { db } from '../db/index.ts';
import {
  profiles,
  skills,
  skillCategories,
  userTeachingSkills,
  userLearningSkills,
  learningRequests,
  connections,
  sessions,
  reviews,
  reports,
  skillTests,
} from '../db/schema.ts';
import { eq, desc, asc } from 'drizzle-orm';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { getOrCreateUser } from '../db/users.ts';
import {
  getUserRatingAndSessionStats,
  getUserSkillEntries,
  createNotification,
} from '../db/queries.ts';
import { ensureDefaultCatalogAndDemoPeers } from '../db/seed.ts';
import { issueCertificateIfNotExists } from '../lib/skillTestEngine.ts';

export const adminRouter = Router();

// Database-level Role-Based Access Control (RBAC) Middleware
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const decoded = req.user!;
    const user = await getOrCreateUser(
      decoded.uid,
      decoded.email || `${decoded.uid}@skillbridge.edu`,
      decoded.name,
      decoded.email_verified ?? true,
      decoded.picture
    );

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated.' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden: Administrator privileges required to access this resource.',
      });
    }

    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    res.status(500).json({ error: 'Authorization check failed.' });
  }
};

adminRouter.use(requireAuth, requireAdmin);

// 1. Admin Dashboard Statistics & Analytics
adminRouter.get('/overview', async (_req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const allUsers = await db.select().from(profiles);
    const allSkills = await db.select().from(skills);
    const allCategories = await db.select().from(skillCategories);
    const allConnections = await db.select().from(connections);
    const allSessions = await db.select().from(sessions);
    const allRequests = await db.select().from(learningRequests);
    const allReports = await db.select().from(reports);
    const allTeaching = await db.select().from(userTeachingSkills);
    const allLearning = await db.select().from(userLearningSkills);

    const totalUsers = allUsers.length;
    const verifiedUsers = allUsers.filter((u) => u.emailVerified).length;
    const totalSkills = allSkills.length;
    const totalConnections = allConnections.filter((c) => c.status === 'Active').length;
    const totalSessions = allSessions.length;
    const completedSessions = allSessions.filter((s) => s.status === 'Completed').length;
    const pendingRequests = allRequests.filter((r) => r.status === 'Pending').length;
    const reportedUsers = new Set(allReports.map((r) => r.reportedUserId)).size;

    // Calculate popular skills chart data
    const skillUsageMap = new Map<
      number,
      { name: string; teachingCount: number; learningCount: number; total: number }
    >();
    for (const sk of allSkills) {
      skillUsageMap.set(sk.id, {
        name: sk.name,
        teachingCount: 0,
        learningCount: 0,
        total: 0,
      });
    }
    for (const t of allTeaching) {
      const entry = skillUsageMap.get(t.skillId);
      if (entry) {
        entry.teachingCount += 1;
        entry.total += 1;
      }
    }
    for (const l of allLearning) {
      const entry = skillUsageMap.get(l.skillId);
      if (entry) {
        entry.learningCount += 1;
        entry.total += 1;
      }
    }

    const popularSkills = Array.from(skillUsageMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const sessionBreakdown = {
      Scheduled: allSessions.filter((s) => s.status === 'Scheduled').length,
      Completed: completedSessions,
      Cancelled: allSessions.filter((s) => s.status === 'Cancelled').length,
    };

    const userGrowth = [
      { label: 'Week 1', users: Math.max(2, Math.floor(totalUsers * 0.35)), sessions: Math.max(1, Math.floor(completedSessions * 0.3)) },
      { label: 'Week 2', users: Math.max(3, Math.floor(totalUsers * 0.6)), sessions: Math.max(2, Math.floor(completedSessions * 0.55)) },
      { label: 'Week 3', users: Math.max(4, Math.floor(totalUsers * 0.85)), sessions: Math.max(3, Math.floor(completedSessions * 0.8)) },
      { label: 'Current', users: totalUsers, sessions: completedSessions },
    ];

    res.json({
      stats: {
        totalUsers,
        verifiedUsers,
        totalSkills,
        totalCategories: allCategories.length,
        totalConnections,
        totalSessions,
        completedSessions,
        pendingRequests,
        reportedUsers,
        pendingReports: allReports.filter((r) => r.status === 'Pending').length,
      },
      popularSkills,
      sessionBreakdown,
      userGrowth,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/overview:', error);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

// 2. Admin User Management (Never exposes passwordHash)
adminRouter.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const allUsers = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    const enriched = [];

    for (const u of allUsers) {
      const stats = await getUserRatingAndSessionStats(u.id);
      const { passwordHash, verificationCode, resetCode, ...safeUser } = u;
      enriched.push({
        ...safeUser,
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
        completedSessionsCount: stats.completedSessionsCount,
      });
    }

    res.json({ users: enriched });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load users list.' });
  }
});

// Activate / Deactivate User
adminRouter.put('/users/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const targetId = String(req.params.id);
    const { isActive } = req.body;

    const [me] = await db.select().from(profiles).where(eq(profiles.uid, req.user!.uid));
    if (me && me.id === targetId && isActive === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own admin account.' });
    }

    const [updated] = await db
      .update(profiles)
      .set({ isActive: Boolean(isActive), updatedAt: new Date() })
      .where(eq(profiles.id, targetId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { passwordHash, verificationCode, resetCode, ...safeUser } = updated;
    res.json({
      message: updated.isActive
        ? `User ${updated.fullName} reactivated.`
        : `User ${updated.fullName} deactivated.`,
      user: safeUser,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// 3. Admin Skill Categories Management
adminRouter.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const [created] = await db
      .insert(skillCategories)
      .values({
        name: String(name).trim(),
        description: description ? String(description).trim() : '',
      })
      .returning();

    res.status(201).json({ message: 'Category created successfully.', category: created });
  } catch (error: any) {
    res.status(409).json({ error: 'A category with this name already exists.' });
  }
});

adminRouter.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const catId = Number(req.params.id);
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const [updated] = await db
      .update(skillCategories)
      .set({
        name: String(name).trim(),
        description: description ? String(description).trim() : '',
      })
      .where(eq(skillCategories.id, catId))
      .returning();

    res.json({ message: 'Category updated successfully.', category: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

adminRouter.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const catId = Number(req.params.id);
    const linkedSkills = await db
      .select()
      .from(skills)
      .where(eq(skills.categoryId, catId));

    if (linkedSkills.length > 0) {
      return res.status(400).json({
        error: `Cannot delete category because ${linkedSkills.length} skill(s) belong to it. Reassign or remove those skills first.`,
      });
    }

    await db.delete(skillCategories).where(eq(skillCategories.id, catId));
    res.json({ message: 'Category deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// 4. Admin Skills Management (Safely checks active references before deletion)
adminRouter.post('/skills', async (req: AuthRequest, res: Response) => {
  try {
    const { name, categoryId, description } = req.body;
    if (!name || !String(name).trim() || !categoryId) {
      return res.status(400).json({ error: 'Skill name and category are required.' });
    }

    const [created] = await db
      .insert(skills)
      .values({
        name: String(name).trim(),
        categoryId: Number(categoryId),
        description: description ? String(description).trim() : '',
      })
      .returning();

    res.status(201).json({ message: 'Skill added to catalog.', skill: created });
  } catch (error: any) {
    res.status(409).json({ error: 'A skill with this name already exists.' });
  }
});

adminRouter.put('/skills/:id', async (req: AuthRequest, res: Response) => {
  try {
    const skillId = Number(req.params.id);
    const { name, categoryId, description } = req.body;
    if (!name || !String(name).trim() || !categoryId) {
      return res.status(400).json({ error: 'Skill name and category are required.' });
    }

    const [updated] = await db
      .update(skills)
      .set({
        name: String(name).trim(),
        categoryId: Number(categoryId),
        description: description ? String(description).trim() : '',
      })
      .where(eq(skills.id, skillId))
      .returning();

    res.json({ message: 'Skill updated successfully.', skill: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update skill.' });
  }
});

adminRouter.delete('/skills/:id', async (req: AuthRequest, res: Response) => {
  try {
    const skillId = Number(req.params.id);
    const force = req.query.force === 'true';

    const teachRefs = await db
      .select()
      .from(userTeachingSkills)
      .where(eq(userTeachingSkills.skillId, skillId));
    const learnRefs = await db
      .select()
      .from(userLearningSkills)
      .where(eq(userLearningSkills.skillId, skillId));
    const sessionRefs = await db
      .select()
      .from(sessions)
      .where(eq(sessions.skillId, skillId));

    const totalRefs = teachRefs.length + learnRefs.length + sessionRefs.length;
    if (totalRefs > 0 && !force) {
      return res.status(409).json({
        error: `This skill is actively referenced by ${teachRefs.length} teacher(s), ${learnRefs.length} learner(s), and ${sessionRefs.length} session(s). Confirm cascade removal if you still want to delete it.`,
        requiresConfirmation: true,
        referencesCount: totalRefs,
      });
    }

    await db.delete(skills).where(eq(skills.id, skillId));
    res.json({ message: 'Skill deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete skill.' });
  }
});

// 5. Admin Sessions Monitoring
adminRouter.get('/sessions', async (_req: AuthRequest, res: Response) => {
  try {
    const allSessions = await db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.scheduledDate), desc(sessions.startTime));
    const allSkills = await db.select().from(skills);
    const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));
    const allProfiles = await db.select().from(profiles);
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));
    const allReviews = await db.select().from(reviews);
    const reviewMap = new Map(allReviews.map((r) => [r.sessionId, r]));

    const enriched = allSessions.map((s) => ({
      ...s,
      skillName: skillMap.get(s.skillId) || 'Skill',
      teacherName: profileMap.get(s.teacherId)?.fullName || 'Teacher',
      learnerName: profileMap.get(s.learnerId)?.fullName || 'Learner',
      review: reviewMap.get(s.id) || null,
    }));

    res.json({ sessions: enriched });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load platform sessions.' });
  }
});

// 6. Admin Reports Management
adminRouter.get('/reports', async (_req: AuthRequest, res: Response) => {
  try {
    const allReports = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));
    const allProfiles = await db.select().from(profiles);
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    const enriched = allReports.map((r) => {
      const reporter = profileMap.get(r.reporterId);
      const reported = profileMap.get(r.reportedUserId);
      return {
        ...r,
        reporterName: reporter?.fullName || 'Student',
        reporterEmail: reporter?.email || '',
        reportedName: reported?.fullName || 'User',
        reportedEmail: reported?.email || '',
        reportedIsActive: reported?.isActive ?? true,
      };
    });

    res.json({ reports: enriched });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load reports.' });
  }
});

adminRouter.put('/reports/:id', async (req: AuthRequest, res: Response) => {
  try {
    const reportId = Number(req.params.id);
    const { status, adminNotes, deactivateReportedUser } = req.body;

    const [existing] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId));

    if (!existing) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const [updated] = await db
      .update(reports)
      .set({
        status: status || existing.status,
        adminNotes: adminNotes !== undefined ? String(adminNotes) : existing.adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId))
      .returning();

    if (deactivateReportedUser) {
      await db
        .update(profiles)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(profiles.id, existing.reportedUserId));
    }

    res.json({
      message: deactivateReportedUser
        ? 'Report updated and reported user account deactivated.'
        : 'Report status updated.',
      report: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

// 7. Re-seed Demo Catalog & Peers
adminRouter.post('/seed', async (_req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers(true);
    res.json({ message: 'Demo catalog and sample student peers verified/seeded.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to seed demo data.' });
  }
});

// 8. Admin Mentor Verification & Badge Review
adminRouter.get('/mentor-verifications', async (_req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const allUsers = await db.select().from(profiles).orderBy(desc(profiles.updatedAt));
    const allTests = await db.select().from(skillTests).orderBy(desc(skillTests.createdAt));

    const testsByUser = new Map<string, typeof allTests>();
    for (const t of allTests) {
      const list = testsByUser.get(t.userId) || [];
      list.push(t);
      testsByUser.set(t.userId, list);
    }

    const mentors = [];
    for (const u of allUsers) {
      const userTests = testsByUser.get(u.id) || [];
      const isMentorCandidate =
        u.accountType === 'MENTOR' ||
        userTests.length > 0 ||
        (u.mentorVerificationStatus && u.mentorVerificationStatus !== 'Not Submitted');

      if (!isMentorCandidate) continue;

      const skillsData = await getUserSkillEntries(u.id);
      const { passwordHash, verificationCode, resetCode, ...safeUser } = u;
      mentors.push({
        ...safeUser,
        teachingSkills: skillsData.teaching,
        learningSkills: skillsData.learning,
        testAttempts: userTests,
        latestTest: userTests[0] || null,
      });
    }

    res.json({ mentors });
  } catch (error: any) {
    console.error('Error in GET /api/admin/mentor-verifications:', error);
    res.status(500).json({ error: 'Failed to load mentor verification requests.' });
  }
});

adminRouter.put('/mentor-verifications/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = String(req.params.userId);
    const { status, reviewNote, verifiedSkills } = req.body;

    const allowedStatuses = ['Pending Review', 'Under Review', 'Approved', 'Rejected'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid verification status is required.' });
    }

    const [targetUser] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, targetUserId));

    if (!targetUser) {
      return res.status(404).json({ error: 'Mentor profile not found.' });
    }

    const skillsData = await getUserSkillEntries(targetUserId);
    const userTests = await db
      .select()
      .from(skillTests)
      .where(eq(skillTests.userId, targetUserId))
      .orderBy(desc(skillTests.createdAt));

    const defaultSkillsList = Array.from(
      new Set([
        ...userTests.map((t) => t.skill),
        ...skillsData.teaching.map((s) => s.name),
      ])
    ).join(', ');

    const isApproved = status === 'Approved';
    const finalVerifiedSkills = isApproved
      ? String(verifiedSkills || targetUser.mentorVerifiedSkills || defaultSkillsList || 'General Mentoring').trim()
      : '';

    const [updated] = await db
      .update(profiles)
      .set({
        accountType: 'MENTOR',
        isVerifiedMentor: isApproved,
        mentorVerificationStatus: status,
        mentorVerifiedAt: isApproved ? new Date() : null,
        mentorVerifiedSkills: finalVerifiedSkills,
        mentorReviewNote: reviewNote !== undefined ? String(reviewNote).trim() : targetUser.mentorReviewNote,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, targetUserId))
      .returning();

    if (isApproved) {
      const primarySkill = finalVerifiedSkills.split(',')[0]?.trim() || 'Peer Mentoring';
      await issueCertificateIfNotExists({
        userId: targetUser.id,
        recipientName: targetUser.fullName,
        title: `Verified Peer Mentor – ${primarySkill}`,
        skillName: primarySkill,
        certificateType: 'MENTOR_VERIFICATION',
        score: userTests[0]?.percentage ?? 90,
        issuedBy: 'SkillBridge Academic Verification Board',
      });

      await createNotification(
        targetUser.id,
        'MENTOR_APPROVED',
        'Congratulations! You are now a Verified Mentor',
        `Your mentor profile and skill verification test have been approved by an administrator. The Verified Mentor badge is now active on your profile.${
          reviewNote ? ` Admin Note: "${reviewNote}"` : ''
        }`
      );
    } else if (status === 'Rejected') {
      await createNotification(
        targetUser.id,
        'MENTOR_REJECTED',
        'Mentor Verification Update',
        `Your mentor verification was reviewed and marked as Rejected.${
          reviewNote ? ` Admin Review Note: "${reviewNote}"` : ' Please review feedback and retake the skill test.'
        }`
      );
    } else if (status === 'Under Review') {
      await createNotification(
        targetUser.id,
        'MENTOR_UNDER_REVIEW',
        'Mentor Profile Under Admin Review',
        'An administrator is currently reviewing your mentor profile and skill test results.'
      );
    }

    const { passwordHash, verificationCode, resetCode, ...safeUpdated } = updated;
    res.json({
      message: `Mentor verification status updated to ${status}.`,
      mentor: safeUpdated,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/mentor-verifications/:userId:', error);
    res.status(500).json({ error: 'Failed to update mentor verification status.' });
  }
});
