import { db } from './index.ts';
import {
  profiles,
  skillCategories,
  skills,
  userTeachingSkills,
  userLearningSkills,
  learningRequests,
  connections,
  sessions,
  reviews,
  progress,
  learningGoals,
  conversations,
  messages,
  notifications,
  reports,
  blockedUsers,
} from './schema.ts';
import { eq, and, or, desc, asc, ne } from 'drizzle-orm';
import { calculateRuleBasedMatch, SkillEntry } from './matching.ts';

export async function getAllCategoriesAndSkills() {
  try {
    const categories = await db.select().from(skillCategories).orderBy(asc(skillCategories.name));
    const allSkills = await db
      .select({
        id: skills.id,
        name: skills.name,
        categoryId: skills.categoryId,
        categoryName: skillCategories.name,
        description: skills.description,
        createdAt: skills.createdAt,
      })
      .from(skills)
      .innerJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
      .orderBy(asc(skills.name));
    return { categories, skills: allSkills };
  } catch (error) {
    console.error('Database query failed in getAllCategoriesAndSkills:', error);
    throw new Error('Failed to load skills catalog. Please try again later.', { cause: error });
  }
}

export async function getUserSkillEntries(userId: string): Promise<{
  teaching: SkillEntry[];
  learning: SkillEntry[];
}> {
  try {
    const teaching = await db
      .select({
        id: userTeachingSkills.id,
        skillId: skills.id,
        name: skills.name,
        categoryId: skillCategories.id,
        categoryName: skillCategories.name,
        level: userTeachingSkills.level,
      })
      .from(userTeachingSkills)
      .innerJoin(skills, eq(userTeachingSkills.skillId, skills.id))
      .innerJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
      .where(eq(userTeachingSkills.userId, userId));

    const learning = await db
      .select({
        id: userLearningSkills.id,
        skillId: skills.id,
        name: skills.name,
        categoryId: skillCategories.id,
        categoryName: skillCategories.name,
        level: userLearningSkills.level,
      })
      .from(userLearningSkills)
      .innerJoin(skills, eq(userLearningSkills.skillId, skills.id))
      .innerJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
      .where(eq(userLearningSkills.userId, userId));

    return { teaching, learning };
  } catch (error) {
    console.error('Database query failed in getUserSkillEntries:', error);
    throw new Error('Failed to fetch user skills.', { cause: error });
  }
}

export async function getUserRatingAndSessionStats(userId: string) {
  try {
    const userReviews = await db
      .select({
        id: reviews.id,
        sessionId: reviews.sessionId,
        reviewerId: reviews.reviewerId,
        reviewerName: profiles.fullName,
        reviewerAvatar: profiles.avatarUrl,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(profiles, eq(reviews.reviewerId, profiles.id))
      .where(eq(reviews.reviewedUserId, userId))
      .orderBy(desc(reviews.createdAt));

    const totalReviews = userReviews.length;
    const avgRating =
      totalReviews > 0
        ? Number((userReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    const userSessions = await db
      .select()
      .from(sessions)
      .where(
        and(
          or(eq(sessions.teacherId, userId), eq(sessions.learnerId, userId)),
          eq(sessions.status, 'Completed')
        )
      );

    return {
      averageRating: avgRating,
      reviewCount: totalReviews,
      completedSessionsCount: userSessions.length,
      recentReviews: userReviews.slice(0, 10),
    };
  } catch (error) {
    console.error('Database query failed in getUserRatingAndSessionStats:', error);
    throw new Error('Failed to load rating statistics.', { cause: error });
  }
}

export async function getFullUserProfile(userId: string) {
  try {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
    if (!profile) return null;

    const { teaching, learning } = await getUserSkillEntries(userId);
    const stats = await getUserRatingAndSessionStats(userId);
    const userProgress = await db
      .select({
        id: progress.id,
        skillId: progress.skillId,
        skillName: skills.name,
        categoryName: skillCategories.name,
        startingLevel: progress.startingLevel,
        currentLevel: progress.currentLevel,
        progressPercentage: progress.progressPercentage,
        sessionsCompleted: progress.sessionsCompleted,
        lastSessionDate: progress.lastSessionDate,
        topicsCompleted: progress.topicsCompleted,
        notes: progress.notes,
        updatedAt: progress.updatedAt,
      })
      .from(progress)
      .innerJoin(skills, eq(progress.skillId, skills.id))
      .innerJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
      .where(eq(progress.userId, userId));

    const overallProgress =
      userProgress.length > 0
        ? Math.round(
            userProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / userProgress.length
          )
        : 0;

    const { passwordHash, verificationCode, resetCode, ...safeProfile } = profile;

    return {
      ...safeProfile,
      teachingSkills: teaching,
      learningSkills: learning,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount,
      completedSessionsCount: stats.completedSessionsCount,
      recentReviews: stats.recentReviews,
      progress: userProgress,
      overallProgress,
    };
  } catch (error) {
    console.error('Database query failed in getFullUserProfile:', error);
    throw new Error('Failed to load user profile.', { cause: error });
  }
}

export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  try {
    const blocks = await db
      .select()
      .from(blockedUsers)
      .where(or(eq(blockedUsers.blockerId, userId), eq(blockedUsers.blockedUserId, userId)));
    const ids = new Set<string>();
    for (const b of blocks) {
      if (b.blockerId === userId) ids.add(b.blockedUserId);
      if (b.blockedUserId === userId) ids.add(b.blockerId);
    }
    return ids;
  } catch (error) {
    console.error('Database query failed in getBlockedUserIds:', error);
    throw new Error('Failed to check blocked users.', { cause: error });
  }
}

export async function discoverPeersForUser(
  currentUserId: string,
  filters?: {
    search?: string;
    skillId?: number;
    categoryId?: number;
    level?: string;
    availability?: string;
  }
) {
  try {
    const [me] = await db.select().from(profiles).where(eq(profiles.id, currentUserId));
    const mySkills = await getUserSkillEntries(currentUserId);
    const blockedIds = await getBlockedUserIds(currentUserId);

    const allPeers = await db
      .select()
      .from(profiles)
      .where(and(ne(profiles.id, currentUserId), eq(profiles.isActive, true)));

    const myConns = await db
      .select()
      .from(connections)
      .where(
        and(
          or(eq(connections.user1Id, currentUserId), eq(connections.user2Id, currentUserId)),
          eq(connections.status, 'Active')
        )
      );
    const connectedPeerIds = new Set(
      myConns.map((c) => (c.user1Id === currentUserId ? c.user2Id : c.user1Id))
    );

    const pendingReqs = await db
      .select()
      .from(learningRequests)
      .where(
        and(
          or(
            eq(learningRequests.senderId, currentUserId),
            eq(learningRequests.receiverId, currentUserId)
          ),
          eq(learningRequests.status, 'Pending')
        )
      );
    const pendingPeerIds = new Set(
      pendingReqs.map((r) => (r.senderId === currentUserId ? r.receiverId : r.senderId))
    );

    const enrichedPeers = [];
    for (const peer of allPeers) {
      if (blockedIds.has(peer.id)) continue;

      const peerSkills = await getUserSkillEntries(peer.id);
      const stats = await getUserRatingAndSessionStats(peer.id);
      const firstName = peer.fullName.split(' ')[0];

      const match = calculateRuleBasedMatch(
        mySkills.teaching,
        mySkills.learning,
        me?.availability,
        firstName,
        peerSkills.teaching,
        peerSkills.learning,
        peer.availability
      );

      // Apply search & filter criteria
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = peer.fullName.toLowerCase().includes(q);
        const matchesCollege = (peer.college || '').toLowerCase().includes(q);
        const matchesCourse = (peer.course || '').toLowerCase().includes(q);
        const matchesTeachSkill = peerSkills.teaching.some(
          (s) => s.name.toLowerCase().includes(q) || s.categoryName.toLowerCase().includes(q)
        );
        const matchesLearnSkill = peerSkills.learning.some((s) =>
          s.name.toLowerCase().includes(q)
        );
        if (
          !matchesName &&
          !matchesCollege &&
          !matchesCourse &&
          !matchesTeachSkill &&
          !matchesLearnSkill
        ) {
          continue;
        }
      }

      if (filters?.skillId) {
        const hasSkill = peerSkills.teaching.some((s) => s.skillId === filters.skillId);
        if (!hasSkill) continue;
      }

      if (filters?.categoryId) {
        const hasCategory = peerSkills.teaching.some((s) => s.categoryId === filters.categoryId);
        if (!hasCategory) continue;
      }

      if (filters?.level) {
        const hasLevel = peerSkills.teaching.some(
          (s) => s.level.toLowerCase() === filters.level!.toLowerCase()
        );
        if (!hasLevel) continue;
      }

      if (filters?.availability) {
        const availMatch = (peer.availability || '')
          .toLowerCase()
          .includes(filters.availability.toLowerCase());
        if (!availMatch) continue;
      }

      const { passwordHash, verificationCode, resetCode, ...safePeer } = peer;

      enrichedPeers.push({
        ...safePeer,
        teachingSkills: peerSkills.teaching,
        learningSkills: peerSkills.learning,
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
        completedSessionsCount: stats.completedSessionsCount,
        recentReviews: stats.recentReviews,
        match,
        isConnected: connectedPeerIds.has(peer.id),
        hasPendingRequest: pendingPeerIds.has(peer.id),
      });
    }

    enrichedPeers.sort((a, b) => b.match.score - a.match.score || b.averageRating - a.averageRating);
    return enrichedPeers;
  } catch (error) {
    console.error('Database query failed in discoverPeersForUser:', error);
    throw new Error('Failed to discover peers. Please try again later.', { cause: error });
  }
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId: string = ''
) {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      relatedId,
      isRead: false,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
