import { Router, type Response } from 'express';
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
  progress,
  learningGoals,
  conversations,
  messages,
  notifications,
  reports,
  blockedUsers,
  skillTests,
  skillTestQuestions,
  certificates,
} from '../db/schema.ts';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import {
  getAllCategoriesAndSkills,
  getFullUserProfile,
  discoverPeersForUser,
  createNotification,
  getBlockedUserIds,
  getUserSkillEntries,
} from '../db/queries.ts';
import { ensureDefaultCatalogAndDemoPeers } from '../db/seed.ts';
import { getOrCreateUser } from '../db/users.ts';
import {
  generateSkillTestQuestions,
  finalizeSkillTestAttempt,
  issueCertificateIfNotExists,
} from '../lib/skillTestEngine.ts';

export const studentRouter = Router();

async function resolveCurrentProfile(req: AuthRequest) {
  const decoded = req.user!;
  return getOrCreateUser(
    decoded.uid,
    decoded.email || `${decoded.uid}@skillbridge.edu`,
    decoded.name,
    decoded.email_verified ?? true,
    decoded.picture
  );
}

// Public / Authenticated Skills & Categories Catalog
studentRouter.get('/catalog', async (_req, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const data = await getAllCategoriesAndSkills();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load catalog.' });
  }
});

// Update Student Profile (Role cannot be modified here)
studentRouter.put('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const {
      fullName,
      bio,
      college,
      course,
      year,
      location,
      availability,
      avatarUrl,
      notifyRequests,
      notifyMessages,
      notifySessions,
      notifyReviews,
      profileVisibility,
      accountType,
      phoneNumber,
      qualification,
      careerGoal,
      experienceYears,
      experienceDescription,
      githubUrl,
      linkedinUrl,
      projectsUrl,
    } = req.body;

    if (fullName !== undefined && !String(fullName).trim()) {
      return res.status(400).json({ error: 'Full name cannot be empty.' });
    }

    await db
      .update(profiles)
      .set({
        fullName: fullName !== undefined ? String(fullName).trim() : me.fullName,
        bio: bio !== undefined ? String(bio) : me.bio,
        college: college !== undefined ? String(college) : me.college,
        course: course !== undefined ? String(course) : me.course,
        year: year !== undefined ? String(year) : me.year,
        location: location !== undefined ? String(location) : me.location,
        availability: availability !== undefined ? String(availability) : me.availability,
        avatarUrl: avatarUrl !== undefined ? String(avatarUrl) : me.avatarUrl,
        notifyRequests:
          notifyRequests !== undefined ? Boolean(notifyRequests) : me.notifyRequests,
        notifyMessages:
          notifyMessages !== undefined ? Boolean(notifyMessages) : me.notifyMessages,
        notifySessions:
          notifySessions !== undefined ? Boolean(notifySessions) : me.notifySessions,
        notifyReviews: notifyReviews !== undefined ? Boolean(notifyReviews) : me.notifyReviews,
        profileVisibility:
          profileVisibility !== undefined ? String(profileVisibility) : me.profileVisibility,
        accountType: accountType !== undefined ? String(accountType) : me.accountType,
        phoneNumber: phoneNumber !== undefined ? String(phoneNumber).trim() : me.phoneNumber,
        qualification:
          qualification !== undefined ? String(qualification).trim() : me.qualification,
        careerGoal: careerGoal !== undefined ? String(careerGoal).trim() : me.careerGoal,
        experienceYears:
          experienceYears !== undefined ? String(experienceYears).trim() : me.experienceYears,
        experienceDescription:
          experienceDescription !== undefined
            ? String(experienceDescription).trim()
            : me.experienceDescription,
        githubUrl: githubUrl !== undefined ? String(githubUrl).trim() : me.githubUrl,
        linkedinUrl: linkedinUrl !== undefined ? String(linkedinUrl).trim() : me.linkedinUrl,
        projectsUrl: projectsUrl !== undefined ? String(projectsUrl).trim() : me.projectsUrl,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, me.id));

    const updated = await getFullUserProfile(me.id);
    res.json({ message: 'Profile updated successfully.', profile: updated });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Add Teaching Skill
studentRouter.post('/my-skills/teach', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { skillId, level } = req.body;
    if (!skillId || !level) {
      return res.status(400).json({ error: 'Skill and proficiency level are required.' });
    }

    const existing = await db
      .select()
      .from(userTeachingSkills)
      .where(
        and(
          eq(userTeachingSkills.userId, me.id),
          eq(userTeachingSkills.skillId, Number(skillId))
        )
      );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already added this skill to your teaching list.' });
    }

    await db.insert(userTeachingSkills).values({
      userId: me.id,
      skillId: Number(skillId),
      level: String(level),
    });

    const updated = await getFullUserProfile(me.id);
    res.status(201).json({ message: 'Teaching skill added successfully.', profile: updated });
  } catch (error: any) {
    console.error('Error adding teaching skill:', error);
    res.status(500).json({ error: 'Failed to add teaching skill.' });
  }
});

// Edit Teaching Skill Level
studentRouter.put('/my-skills/teach/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const entryId = Number(req.params.id);
    const { level } = req.body;
    if (!level) return res.status(400).json({ error: 'Skill level is required.' });

    await db
      .update(userTeachingSkills)
      .set({ level: String(level) })
      .where(and(eq(userTeachingSkills.id, entryId), eq(userTeachingSkills.userId, me.id)));

    const updated = await getFullUserProfile(me.id);
    res.json({ message: 'Teaching skill updated.', profile: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update teaching skill.' });
  }
});

// Delete Teaching Skill
studentRouter.delete('/my-skills/teach/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const entryId = Number(req.params.id);
    await db
      .delete(userTeachingSkills)
      .where(and(eq(userTeachingSkills.id, entryId), eq(userTeachingSkills.userId, me.id)));

    const updated = await getFullUserProfile(me.id);
    res.json({ message: 'Teaching skill removed.', profile: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove teaching skill.' });
  }
});

// Add Learning Skill + Auto-create Progress Tracker
studentRouter.post('/my-skills/learn', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { skillId, level } = req.body;
    if (!skillId || !level) {
      return res.status(400).json({ error: 'Skill and starting level are required.' });
    }

    const existing = await db
      .select()
      .from(userLearningSkills)
      .where(
        and(
          eq(userLearningSkills.userId, me.id),
          eq(userLearningSkills.skillId, Number(skillId))
        )
      );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already added this skill to your learning list.' });
    }

    await db.insert(userLearningSkills).values({
      userId: me.id,
      skillId: Number(skillId),
      level: String(level),
    });

    // Ensure progress record exists for this learning skill
    const existingProg = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, me.id), eq(progress.skillId, Number(skillId))));

    if (existingProg.length === 0) {
      await db.insert(progress).values({
        userId: me.id,
        skillId: Number(skillId),
        startingLevel: String(level),
        currentLevel: String(level),
        progressPercentage: 10,
        sessionsCompleted: 0,
        topicsCompleted: 'Fundamentals & Setup',
        notes: 'Started learning via SkillBridge peer exchange.',
      });
    }

    const updated = await getFullUserProfile(me.id);
    res.status(201).json({ message: 'Learning skill added successfully.', profile: updated });
  } catch (error: any) {
    console.error('Error adding learning skill:', error);
    res.status(500).json({ error: 'Failed to add learning skill.' });
  }
});

// Edit Learning Skill Level
studentRouter.put('/my-skills/learn/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const entryId = Number(req.params.id);
    const { level } = req.body;
    if (!level) return res.status(400).json({ error: 'Skill level is required.' });

    await db
      .update(userLearningSkills)
      .set({ level: String(level) })
      .where(and(eq(userLearningSkills.id, entryId), eq(userLearningSkills.userId, me.id)));

    const updated = await getFullUserProfile(me.id);
    res.json({ message: 'Learning skill updated.', profile: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update learning skill.' });
  }
});

// Delete Learning Skill
studentRouter.delete('/my-skills/learn/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const entryId = Number(req.params.id);
    await db
      .delete(userLearningSkills)
      .where(and(eq(userLearningSkills.id, entryId), eq(userLearningSkills.userId, me.id)));

    const updated = await getFullUserProfile(me.id);
    res.json({ message: 'Learning skill removed.', profile: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove learning skill.' });
  }
});

// Quick Viva Preset: Set Teaching = UI/UX (Intermediate) & Learning = Python (Beginner)
studentRouter.post('/my-skills/viva-preset', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const me = await resolveCurrentProfile(req);
    const allSkills = await db.select().from(skills);
    const skillMap = new Map(allSkills.map((s) => [s.name, s.id]));

    const uiuxId = skillMap.get('UI/UX') || skillMap.get('UI/UX Design');
    const htmlId = skillMap.get('HTML');
    const pythonId = skillMap.get('Python');
    const reactId = skillMap.get('React');

    if (uiuxId) {
      const ex = await db
        .select()
        .from(userTeachingSkills)
        .where(and(eq(userTeachingSkills.userId, me.id), eq(userTeachingSkills.skillId, uiuxId)));
      if (ex.length === 0) {
        await db.insert(userTeachingSkills).values({
          userId: me.id,
          skillId: uiuxId,
          level: 'Advanced',
        });
      }
    }
    if (htmlId) {
      const ex = await db
        .select()
        .from(userTeachingSkills)
        .where(and(eq(userTeachingSkills.userId, me.id), eq(userTeachingSkills.skillId, htmlId)));
      if (ex.length === 0) {
        await db.insert(userTeachingSkills).values({
          userId: me.id,
          skillId: htmlId,
          level: 'Intermediate',
        });
      }
    }
    if (pythonId) {
      const ex = await db
        .select()
        .from(userLearningSkills)
        .where(and(eq(userLearningSkills.userId, me.id), eq(userLearningSkills.skillId, pythonId)));
      if (ex.length === 0) {
        await db.insert(userLearningSkills).values({
          userId: me.id,
          skillId: pythonId,
          level: 'Beginner',
        });
        await db.insert(progress).values({
          userId: me.id,
          skillId: pythonId,
          startingLevel: 'Beginner',
          currentLevel: 'Intermediate',
          progressPercentage: 70,
          sessionsCompleted: 6,
          lastSessionDate: '2026-09-25',
          topicsCompleted: 'Variables, Functions, Loops, OOP',
          notes: 'Working on Python data structures and OOP modules with peer mentor.',
        });
      }
    }
    if (reactId) {
      const ex = await db
        .select()
        .from(userLearningSkills)
        .where(and(eq(userLearningSkills.userId, me.id), eq(userLearningSkills.skillId, reactId)));
      if (ex.length === 0) {
        await db.insert(userLearningSkills).values({
          userId: me.id,
          skillId: reactId,
          level: 'Beginner',
        });
        await db.insert(progress).values({
          userId: me.id,
          skillId: reactId,
          startingLevel: 'Beginner',
          currentLevel: 'Beginner',
          progressPercentage: 40,
          sessionsCompleted: 3,
          lastSessionDate: '2026-09-22',
          topicsCompleted: 'JSX, Props, useState Hook',
          notes: 'Building reusable components.',
        });
      }
    }

    const updated = await getFullUserProfile(me.id);
    res.json({
      message: 'Skills configured! Check Discover Peers or Dashboard for your 90% Skill Match with Rahul Sharma.',
      profile: updated,
    });
  } catch (error: any) {
    console.error('Error applying viva preset:', error);
    res.status(500).json({ error: 'Failed to apply preset.' });
  }
});

// Discover Peers & Rule-Based Matching
studentRouter.get('/discover', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const me = await resolveCurrentProfile(req);
    const { search, skillId, categoryId, level, availability } = req.query;

    const peers = await discoverPeersForUser(me.id, {
      search: search ? String(search) : undefined,
      skillId: skillId ? Number(skillId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      level: level ? String(level) : undefined,
      availability: availability ? String(availability) : undefined,
    });

    res.json({ peers });
  } catch (error: any) {
    console.error('Error in /api/discover:', error);
    res.status(500).json({ error: error.message || 'Failed to discover peers.' });
  }
});

// Get Single Peer Profile
studentRouter.get('/peers/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const peerId = String(req.params.id);
    const peers = await discoverPeersForUser(me.id);
    const found = peers.find((p) => p.id === peerId);
    if (found) {
      return res.json({ peer: found });
    }
    const fallback = await getFullUserProfile(peerId);
    if (!fallback) return res.status(404).json({ error: 'Peer profile not found.' });
    res.json({ peer: fallback });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load peer profile.' });
  }
});

// Get Learning Requests (Incoming & Outgoing)
studentRouter.get('/requests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const allReqs = await db
      .select()
      .from(learningRequests)
      .where(
        or(eq(learningRequests.senderId, me.id), eq(learningRequests.receiverId, me.id))
      )
      .orderBy(desc(learningRequests.createdAt));

    const allSkills = await db.select().from(skills);
    const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));

    const allProfiles = await db.select().from(profiles);
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    const enriched = allReqs.map((r) => {
      const sender = profileMap.get(r.senderId);
      const receiver = profileMap.get(r.receiverId);
      return {
        ...r,
        skillName: skillMap.get(r.skillId) || 'Skill Exchange',
        offeredSkillName: r.offeredSkillId ? skillMap.get(r.offeredSkillId) : null,
        senderName: sender?.fullName || 'Student',
        senderAvatar: sender?.avatarUrl || '',
        senderCollege: sender?.college || '',
        receiverName: receiver?.fullName || 'Student',
        receiverAvatar: receiver?.avatarUrl || '',
        receiverCollege: receiver?.college || '',
      };
    });

    res.json({
      incoming: enriched.filter((r) => r.receiverId === me.id),
      outgoing: enriched.filter((r) => r.senderId === me.id),
    });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to load learning requests.' });
  }
});

// Send Learning Request
studentRouter.post('/requests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { receiverId, skillId, offeredSkillId, message, autoAcceptDemo } = req.body;

    if (!receiverId || !skillId || !message || !String(message).trim()) {
      return res.status(400).json({ error: 'Receiver, skill, and message are required.' });
    }

    if (receiverId === me.id) {
      return res.status(400).json({ error: 'You cannot send a learning request to yourself.' });
    }

    const blockedIds = await getBlockedUserIds(me.id);
    if (blockedIds.has(receiverId)) {
      return res.status(403).json({ error: 'Cannot send a learning request to this user.' });
    }

    // Prevent duplicate pending requests between the same users
    const existingPending = await db
      .select()
      .from(learningRequests)
      .where(
        and(
          or(
            and(
              eq(learningRequests.senderId, me.id),
              eq(learningRequests.receiverId, receiverId)
            ),
            and(
              eq(learningRequests.senderId, receiverId),
              eq(learningRequests.receiverId, me.id)
            )
          ),
          eq(learningRequests.status, 'Pending')
        )
      );

    if (existingPending.length > 0) {
      return res.status(409).json({
        error: 'An active learning request already exists between you and this peer.',
      });
    }

    const [created] = await db
      .insert(learningRequests)
      .values({
        senderId: me.id,
        receiverId: String(receiverId),
        skillId: Number(skillId),
        offeredSkillId: offeredSkillId ? Number(offeredSkillId) : null,
        message: String(message).trim(),
        status: 'Pending',
      })
      .returning();

    const [skillRow] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, Number(skillId)));

    await createNotification(
      String(receiverId),
      'REQUEST_RECEIVED',
      'New Learning Request',
      `${me.fullName} wants to learn ${skillRow?.name || 'a skill'} from you.`,
      String(created.id)
    );

    // If the user opted to simulate instant peer acceptance for a demo student (or via button)
    if (autoAcceptDemo) {
      // Check if receiver is a demo user
      const [receiverProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, String(receiverId)));
      if (receiverProfile?.isDemo) {
        await acceptRequestInternal(created.id, me.id, String(receiverId), skillRow?.name || 'Skill');
      }
    }

    res.status(201).json({
      message: 'Learning request sent.',
      request: created,
    });
  } catch (error: any) {
    console.error('Error sending learning request:', error);
    res.status(500).json({ error: 'Failed to send request. Please try again.' });
  }
});

async function acceptRequestInternal(
  requestId: number,
  senderId: string,
  receiverId: string,
  skillName: string
) {
  await db
    .update(learningRequests)
    .set({ status: 'Accepted', updatedAt: new Date() })
    .where(eq(learningRequests.id, requestId));

  // Check if connection already exists
  const existingConn = await db
    .select()
    .from(connections)
    .where(
      or(
        and(eq(connections.user1Id, senderId), eq(connections.user2Id, receiverId)),
        and(eq(connections.user1Id, receiverId), eq(connections.user2Id, senderId))
      )
    );

  let connId: number;
  if (existingConn.length > 0) {
    connId = existingConn[0].id;
    await db
      .update(connections)
      .set({ status: 'Active' })
      .where(eq(connections.id, connId));
  } else {
    const [newConn] = await db
      .insert(connections)
      .values({
        user1Id: senderId,
        user2Id: receiverId,
        requestId,
        status: 'Active',
      })
      .returning();
    connId = newConn.id;
  }

  // Ensure conversation exists for this connection
  const existingConv = await db
    .select()
    .from(conversations)
    .where(eq(conversations.connectionId, connId));

  let convId: number;
  if (existingConv.length === 0) {
    const [newConv] = await db
      .insert(conversations)
      .values({
        connectionId: connId,
        user1Id: senderId,
        user2Id: receiverId,
      })
      .returning();
    convId = newConv.id;

    const [receiverProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, receiverId));

    if (receiverProfile?.isDemo) {
      await db.insert(messages).values({
        conversationId: convId,
        senderId: receiverId,
        content: `Hi! Excited to connect and exchange skills on ${skillName}. Let's schedule our first learning session whenever you're free!`,
        isRead: false,
      });
    }
  }

  const [receiverProfile] = await db.select().from(profiles).where(eq(profiles.id, receiverId));
  const [senderProfile] = await db.select().from(profiles).where(eq(profiles.id, senderId));

  await createNotification(
    senderId,
    'REQUEST_ACCEPTED',
    'Request Accepted!',
    `${receiverProfile?.fullName || 'Your peer'} accepted your learning request for ${skillName}. You are now connected!`,
    String(connId)
  );

  await createNotification(
    receiverId,
    'CONNECTION_CREATED',
    'New Peer Connection',
    `You are now connected with ${senderProfile?.fullName || 'a student'} for ${skillName}.`,
    String(connId)
  );

  return connId;
}

// Update Request Status (Accept / Reject / Cancel) + Simulate Demo Peer Acceptance
studentRouter.put('/requests/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const reqId = Number(req.params.id);
    const { status } = req.body; // 'Accepted' | 'Rejected' | 'Cancelled'

    const [existing] = await db
      .select()
      .from(learningRequests)
      .where(eq(learningRequests.id, reqId));

    if (!existing) {
      return res.status(404).json({ error: 'Learning request not found.' });
    }

    const [receiverProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, existing.receiverId));

    // Allow receiver to Accept/Reject, OR allow sender to simulate acceptance when receiver is a Demo student
    const isReceiver = existing.receiverId === me.id;
    const isSender = existing.senderId === me.id;
    const isDemoReceiver = Boolean(receiverProfile?.isDemo && isSender);

    if (status === 'Cancelled') {
      if (!isSender) {
        return res.status(403).json({ error: 'Only the sender can cancel this request.' });
      }
      await db
        .update(learningRequests)
        .set({ status: 'Cancelled', updatedAt: new Date() })
        .where(eq(learningRequests.id, reqId));
      return res.json({ message: 'Learning request cancelled.' });
    }

    if (!isReceiver && !isDemoReceiver) {
      return res.status(403).json({ error: 'Unauthorized to update this learning request.' });
    }

    const [skillRow] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, existing.skillId));

    if (status === 'Accepted') {
      await acceptRequestInternal(
        reqId,
        existing.senderId,
        existing.receiverId,
        skillRow?.name || 'Skill Exchange'
      );
      return res.json({ message: 'Request accepted. Connection created!' });
    }

    if (status === 'Rejected') {
      await db
        .update(learningRequests)
        .set({ status: 'Rejected', updatedAt: new Date() })
        .where(eq(learningRequests.id, reqId));

      await createNotification(
        existing.senderId,
        'REQUEST_REJECTED',
        'Learning Request Update',
        `${receiverProfile?.fullName || 'Peer'} was unable to accept your request for ${skillRow?.name || 'skill'} at this time.`,
        String(reqId)
      );
      return res.json({ message: 'Request rejected.' });
    }

    res.status(400).json({ error: 'Invalid status value.' });
  } catch (error: any) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update learning request.' });
  }
});

// Get Connected Peers
studentRouter.get('/connections', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const myConns = await db
      .select()
      .from(connections)
      .where(
        and(
          or(eq(connections.user1Id, me.id), eq(connections.user2Id, me.id)),
          eq(connections.status, 'Active')
        )
      )
      .orderBy(desc(connections.createdAt));

    const blockedIds = await getBlockedUserIds(me.id);
    const result = [];

    for (const c of myConns) {
      const peerId = c.user1Id === me.id ? c.user2Id : c.user1Id;
      if (blockedIds.has(peerId)) continue;

      const peerProfile = await getFullUserProfile(peerId);
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.connectionId, c.id));

      const sharedSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.connectionId, c.id))
        .orderBy(desc(sessions.scheduledDate));

      if (peerProfile) {
        result.push({
          connectionId: c.id,
          connectedAt: c.createdAt,
          conversationId: conv?.id || null,
          peer: peerProfile,
          sharedSessionsCount: sharedSessions.length,
          completedSessionsCount: sharedSessions.filter((s) => s.status === 'Completed').length,
        });
      }
    }

    res.json({ connections: result });
  } catch (error: any) {
    console.error('Error loading connections:', error);
    res.status(500).json({ error: 'Failed to load connections.' });
  }
});

// Get Conversations List
studentRouter.get('/conversations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const myConvs = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.user1Id, me.id), eq(conversations.user2Id, me.id)))
      .orderBy(desc(conversations.updatedAt));

    const blockedIds = await getBlockedUserIds(me.id);
    const items = [];

    for (const conv of myConvs) {
      const peerId = conv.user1Id === me.id ? conv.user2Id : conv.user1Id;
      if (blockedIds.has(peerId)) continue;

      const [peer] = await db.select().from(profiles).where(eq(profiles.id, peerId));
      if (!peer) continue;

      const convMsgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(asc(messages.createdAt));

      const lastMsg = convMsgs.length > 0 ? convMsgs[convMsgs.length - 1] : null;
      const unreadCount = convMsgs.filter((m) => m.senderId !== me.id && !m.isRead).length;
      const peerSkills = await getUserSkillEntries(peer.id);

      items.push({
        id: conv.id,
        connectionId: conv.connectionId,
        peer: {
          id: peer.id,
          fullName: peer.fullName,
          avatarUrl: peer.avatarUrl,
          college: peer.college,
          course: peer.course,
          isDemo: peer.isDemo,
          teachingSkills: peerSkills.teaching,
        },
        lastMessage: lastMsg,
        unreadCount,
        updatedAt: conv.updatedAt,
      });
    }

    res.json({ conversations: items });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to load conversations.' });
  }
});

// Get Messages for a Conversation (Only Connected Participants Allowed)
studentRouter.get(
  '/conversations/:id/messages',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const me = await resolveCurrentProfile(req);
      const convId = Number(req.params.id);

      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, convId));

      if (!conv || (conv.user1Id !== me.id && conv.user2Id !== me.id)) {
        return res.status(403).json({ error: 'You are not authorized to view this conversation.' });
      }

      // Mark incoming messages as read
      const peerId = conv.user1Id === me.id ? conv.user2Id : conv.user1Id;
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(eq(messages.conversationId, convId), eq(messages.senderId, peerId))
        );

      const list = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convId))
        .orderBy(asc(messages.createdAt));

      res.json({ messages: list });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load messages.' });
    }
  }
);

// Send Message in Conversation
studentRouter.post(
  '/conversations/:id/messages',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const me = await resolveCurrentProfile(req);
      const convId = Number(req.params.id);
      const { content } = req.body;

      if (!content || !String(content).trim()) {
        return res.status(400).json({ error: 'Message content cannot be empty.' });
      }

      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, convId));

      if (!conv || (conv.user1Id !== me.id && conv.user2Id !== me.id)) {
        return res.status(403).json({ error: 'Only connected peers can message each other.' });
      }

      const peerId = conv.user1Id === me.id ? conv.user2Id : conv.user1Id;
      const blockedIds = await getBlockedUserIds(me.id);
      if (blockedIds.has(peerId)) {
        return res.status(403).json({ error: 'Cannot send messages to a blocked user.' });
      }

      const [newMsg] = await db
        .insert(messages)
        .values({
          conversationId: convId,
          senderId: me.id,
          content: String(content).trim(),
          isRead: false,
        })
        .returning();

      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, convId));

      await createNotification(
        peerId,
        'NEW_MESSAGE',
        `New message from ${me.fullName}`,
        String(content).trim().slice(0, 80),
        String(convId)
      );

      // If recipient is a Demo Student, provide a realistic peer response for interactive demo testing
      const [peerProfile] = await db.select().from(profiles).where(eq(profiles.id, peerId));
      if (peerProfile?.isDemo) {
        const peerSkills = await getUserSkillEntries(peerProfile.id);
        const topSkill = peerSkills.teaching[0]?.name || 'our skill exchange';
        const lower = String(content).toLowerCase();
        let replyText = `Sounds great! I have my notes ready for ${topSkill}. Feel free to schedule a session in the Sessions tab whenever works best for you!`;
        if (lower.includes('time') || lower.includes('when') || lower.includes('schedule')) {
          replyText = `I'm free this week according to my availability (${peerProfile.availability}). Let's book a 60-minute slot on the Sessions page!`;
        } else if (lower.includes('python') || lower.includes('code')) {
          replyText = `Awesome! For Python, we can cover functions, OOP, and practical problem-solving step by step.`;
        } else if (lower.includes('ui') || lower.includes('figma') || lower.includes('design')) {
          replyText = `I'd love to learn UI/UX & Figma layout best practices from you in exchange!`;
        }

        await db.insert(messages).values({
          conversationId: convId,
          senderId: peerId,
          content: replyText,
          isRead: false,
        });
      }

      const updatedList = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convId))
        .orderBy(asc(messages.createdAt));

      res.status(201).json({ message: newMsg, messages: updatedList });
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message.' });
    }
  }
);

// Get Sessions for Current Student
studentRouter.get('/sessions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const mySessions = await db
      .select()
      .from(sessions)
      .where(or(eq(sessions.teacherId, me.id), eq(sessions.learnerId, me.id)))
      .orderBy(desc(sessions.scheduledDate), desc(sessions.startTime));

    const allSkills = await db.select().from(skills);
    const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));

    const allProfiles = await db.select().from(profiles);
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    const allReviews = await db.select().from(reviews);
    const reviewMap = new Map(allReviews.map((r) => [r.sessionId, r]));

    const enriched = mySessions.map((s) => {
      const teacher = profileMap.get(s.teacherId);
      const learner = profileMap.get(s.learnerId);
      const existingReview = reviewMap.get(s.id) || null;
      return {
        ...s,
        skillName: skillMap.get(s.skillId) || 'Skill Session',
        teacherName: teacher?.fullName || 'Teacher',
        teacherAvatar: teacher?.avatarUrl || '',
        learnerName: learner?.fullName || 'Learner',
        learnerAvatar: learner?.avatarUrl || '',
        review: existingReview,
      };
    });

    res.json({ sessions: enriched });
  } catch (error: any) {
    console.error('Error loading sessions:', error);
    res.status(500).json({ error: 'Failed to load learning sessions.' });
  }
});

// Schedule a New Session
studentRouter.post('/sessions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const {
      connectionId,
      teacherId,
      learnerId,
      skillId,
      scheduledDate,
      startTime,
      duration,
      notes,
    } = req.body;

    if (!connectionId || !teacherId || !learnerId || !skillId || !scheduledDate || !startTime) {
      return res.status(400).json({ error: 'All session scheduling fields are required.' });
    }

    if (teacherId === learnerId) {
      return res.status(400).json({ error: 'Teacher and learner must be different participants.' });
    }

    if (teacherId !== me.id && learnerId !== me.id) {
      return res.status(403).json({ error: 'You must be a participant in the session.' });
    }

    // Prevent invalid past-date scheduling
    const todayStr = new Date().toISOString().split('T')[0];
    if (String(scheduledDate) < todayStr) {
      return res.status(400).json({
        error: 'Cannot schedule a learning session in the past. Please choose today or a future date.',
      });
    }

    const [conn] = await db
      .select()
      .from(connections)
      .where(and(eq(connections.id, Number(connectionId)), eq(connections.status, 'Active')));

    if (!conn) {
      return res.status(400).json({ error: 'An active peer connection is required to schedule a session.' });
    }

    const [created] = await db
      .insert(sessions)
      .values({
        connectionId: Number(connectionId),
        teacherId: String(teacherId),
        learnerId: String(learnerId),
        skillId: Number(skillId),
        scheduledDate: String(scheduledDate),
        startTime: String(startTime),
        duration: Number(duration) || 60,
        notes: notes ? String(notes).trim() : '',
        status: 'Scheduled',
      })
      .returning();

    const [skillRow] = await db.select().from(skills).where(eq(skills.id, Number(skillId)));
    const otherUserId = teacherId === me.id ? learnerId : teacherId;

    await createNotification(
      String(otherUserId),
      'SESSION_SCHEDULED',
      'New Learning Session Scheduled',
      `${me.fullName} scheduled a ${skillRow?.name || 'skill'} session for ${scheduledDate} at ${startTime}.`,
      String(created.id)
    );

    res.status(201).json({
      message: 'Session scheduled successfully.',
      session: created,
    });
  } catch (error: any) {
    console.error('Error scheduling session:', error);
    res.status(500).json({ error: 'Failed to schedule session.' });
  }
});

// Update Session (Edit / Cancel / Mark Completed)
studentRouter.put('/sessions/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const sessionId = Number(req.params.id);
    const { scheduledDate, startTime, duration, notes, status } = req.body;

    const [existing] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!existing) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (existing.teacherId !== me.id && existing.learnerId !== me.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this session.' });
    }

    if (scheduledDate && scheduledDate !== existing.scheduledDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (String(scheduledDate) < todayStr) {
        return res.status(400).json({ error: 'Cannot reschedule a session to a past date.' });
      }
    }

    const newStatus = status ? String(status) : existing.status;

    const [updated] = await db
      .update(sessions)
      .set({
        scheduledDate: scheduledDate ? String(scheduledDate) : existing.scheduledDate,
        startTime: startTime ? String(startTime) : existing.startTime,
        duration: duration ? Number(duration) : existing.duration,
        notes: notes !== undefined ? String(notes) : existing.notes,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    const [skillRow] = await db.select().from(skills).where(eq(skills.id, existing.skillId));
    const otherUserId = existing.teacherId === me.id ? existing.learnerId : existing.teacherId;

    if (status === 'Cancelled' && existing.status !== 'Cancelled') {
      await createNotification(
        otherUserId,
        'SESSION_CANCELLED',
        'Session Cancelled',
        `${me.fullName} cancelled the ${skillRow?.name || 'skill'} session on ${existing.scheduledDate}.`,
        String(sessionId)
      );
    }

    if (status === 'Completed' && existing.status !== 'Completed') {
      // Automatically update learner's progress record
      const [learnerProg] = await db
        .select()
        .from(progress)
        .where(
          and(
            eq(progress.userId, existing.learnerId),
            eq(progress.skillId, existing.skillId)
          )
        );

      const todayStr = new Date().toISOString().split('T')[0];
      if (learnerProg) {
        const nextPct = Math.min(100, learnerProg.progressPercentage + 15);
        const nextLevel =
          nextPct >= 80
            ? 'Advanced'
            : nextPct >= 45
            ? 'Intermediate'
            : learnerProg.currentLevel;
        await db
          .update(progress)
          .set({
            sessionsCompleted: learnerProg.sessionsCompleted + 1,
            progressPercentage: nextPct,
            currentLevel: nextLevel,
            lastSessionDate: todayStr,
            updatedAt: new Date(),
          })
          .where(eq(progress.id, learnerProg.id));
      } else {
        await db.insert(progress).values({
          userId: existing.learnerId,
          skillId: existing.skillId,
          startingLevel: 'Beginner',
          currentLevel: 'Beginner',
          progressPercentage: 25,
          sessionsCompleted: 1,
          lastSessionDate: todayStr,
          topicsCompleted: existing.notes || 'Session 1 completed',
          notes: `Completed session on ${todayStr}`,
        });
      }

      await createNotification(
        otherUserId,
        'SESSION_COMPLETED',
        'Session Marked Completed',
        `${me.fullName} marked the ${skillRow?.name || 'skill'} session as completed. Don't forget to leave a review!`,
        String(sessionId)
      );
    }

    res.json({
      message:
        status === 'Completed'
          ? 'Session marked as completed! Learning progress updated.'
          : status === 'Cancelled'
          ? 'Session cancelled.'
          : 'Session updated successfully.',
      session: updated,
    });
  } catch (error: any) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session.' });
  }
});

// GET /api/sessions/:id/room-access - Security validation for Teaching Room entry
studentRouter.get('/sessions/:id/room-access', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const sessionId = Number(req.params.id);

    if (!sessionId || isNaN(sessionId)) {
      return res.status(400).json({ error: 'Valid session ID is required.' });
    }

    const [sessionRow] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!sessionRow) {
      return res.status(404).json({ error: 'Teaching Room session was not found.' });
    }

    // SECTION 17: SECURITY CHECK
    // Only the Mentor (Teacher) and Learner assigned to the scheduled session can join
    const isTeacher = sessionRow.teacherId === me.id;
    const isLearner = sessionRow.learnerId === me.id;

    if (!isTeacher && !isLearner) {
      return res.status(403).json({
        error: 'Access Denied: You are not an authorized participant (Mentor or Learner) of this private Teaching Room.',
      });
    }

    // Fetch Teacher Profile
    const [teacherProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, sessionRow.teacherId))
      .limit(1);

    // Fetch Learner Profile
    const [learnerProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, sessionRow.learnerId))
      .limit(1);

    // Fetch Skill
    const [skillRow] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, sessionRow.skillId))
      .limit(1);

    const myRole: 'mentor' | 'learner' = isTeacher ? 'mentor' : 'learner';
    const peerRole: 'mentor' | 'learner' = isTeacher ? 'learner' : 'mentor';
    const peerProfile = isTeacher ? learnerProfile : teacherProfile;

    res.json({
      authorized: true,
      myRole,
      peerRole,
      me: {
        id: me.id,
        fullName: me.fullName,
        email: me.email,
        avatarUrl: me.avatarUrl,
        isVerifiedMentor: me.isVerifiedMentor,
      },
      peer: {
        id: peerProfile?.id || '',
        fullName: peerProfile?.fullName || (isTeacher ? 'Learner' : 'Mentor'),
        email: peerProfile?.email || '',
        avatarUrl: peerProfile?.avatarUrl || '',
        isVerifiedMentor: peerProfile?.isVerifiedMentor,
      },
      session: {
        id: sessionRow.id,
        scheduledDate: sessionRow.scheduledDate,
        startTime: sessionRow.startTime,
        duration: sessionRow.duration,
        notes: sessionRow.notes,
        status: sessionRow.status,
        skillName: skillRow?.name || 'Skill Exchange',
        skillCategory: 'Technical',
        teacher: {
          id: teacherProfile?.id || '',
          fullName: teacherProfile?.fullName || 'Mentor',
          avatarUrl: teacherProfile?.avatarUrl || '',
          isVerifiedMentor: teacherProfile?.isVerifiedMentor,
        },
        learner: {
          id: learnerProfile?.id || '',
          fullName: learnerProfile?.fullName || 'Learner',
          avatarUrl: learnerProfile?.avatarUrl || '',
        },
      },
    });
  } catch (error: any) {
    console.error('Error verifying teaching room access:', error);
    res.status(500).json({ error: 'Failed to authorize teaching room access.' });
  }
});

// Submit Rating & Review for a Completed Session
studentRouter.post('/reviews', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { sessionId, rating, comment } = req.body;

    if (!sessionId || !rating || !comment || !String(comment).trim()) {
      return res.status(400).json({ error: 'Session, star rating (1-5), and review comment are required.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    const [sess] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, Number(sessionId)));

    if (!sess) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (sess.status !== 'Completed') {
      return res.status(400).json({ error: 'You can only rate a session after it is marked Completed.' });
    }

    if (sess.learnerId !== me.id && sess.teacherId !== me.id) {
      return res.status(403).json({ error: 'You were not a participant in this session.' });
    }

    const existingRev = await db
      .select()
      .from(reviews)
      .where(eq(reviews.sessionId, sess.id));

    if (existingRev.length > 0) {
      return res.status(409).json({ error: 'A review has already been submitted for this session.' });
    }

    const reviewedUserId = sess.teacherId === me.id ? sess.learnerId : sess.teacherId;

    const [created] = await db
      .insert(reviews)
      .values({
        sessionId: sess.id,
        reviewerId: me.id,
        reviewedUserId,
        rating: numRating,
        comment: String(comment).trim(),
      })
      .returning();

    await createNotification(
      reviewedUserId,
      'NEW_REVIEW',
      `New ${numRating}⭐ Review Received!`,
      `${me.fullName} rated your session ${numRating}/5 stars: "${String(comment).trim().slice(0, 60)}"`,
      String(sess.id)
    );

    res.status(201).json({
      message: 'Thank you! Your rating and review have been saved.',
      review: created,
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// Get & Update Learning Progress
studentRouter.get('/progress', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const full = await getFullUserProfile(me.id);
    res.json({
      progress: full?.progress || [],
      overallProgress: full?.overallProgress || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load learning progress.' });
  }
});

studentRouter.post('/progress', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const {
      skillId,
      startingLevel,
      currentLevel,
      progressPercentage,
      sessionsCompleted,
      topicsCompleted,
      notes,
    } = req.body;

    if (!skillId) {
      return res.status(400).json({ error: 'Skill is required.' });
    }

    const existing = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, me.id), eq(progress.skillId, Number(skillId))));

    if (existing.length > 0) {
      const [updated] = await db
        .update(progress)
        .set({
          startingLevel: startingLevel || existing[0].startingLevel,
          currentLevel: currentLevel || existing[0].currentLevel,
          progressPercentage:
            progressPercentage !== undefined
              ? Math.max(0, Math.min(100, Number(progressPercentage)))
              : existing[0].progressPercentage,
          sessionsCompleted:
            sessionsCompleted !== undefined
              ? Number(sessionsCompleted)
              : existing[0].sessionsCompleted,
          topicsCompleted:
            topicsCompleted !== undefined ? String(topicsCompleted) : existing[0].topicsCompleted,
          notes: notes !== undefined ? String(notes) : existing[0].notes,
          updatedAt: new Date(),
        })
        .where(eq(progress.id, existing[0].id))
        .returning();
      return res.json({ message: 'Learning progress updated.', item: updated });
    }

    const [created] = await db
      .insert(progress)
      .values({
        userId: me.id,
        skillId: Number(skillId),
        startingLevel: startingLevel || 'Beginner',
        currentLevel: currentLevel || 'Beginner',
        progressPercentage: Math.max(0, Math.min(100, Number(progressPercentage) || 0)),
        sessionsCompleted: Number(sessionsCompleted) || 0,
        lastSessionDate: new Date().toISOString().split('T')[0],
        topicsCompleted: topicsCompleted ? String(topicsCompleted) : '',
        notes: notes ? String(notes) : '',
      })
      .returning();

    res.status(201).json({ message: 'Progress tracker created.', item: created });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save progress.' });
  }
});

studentRouter.put('/progress/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const progId = Number(req.params.id);
    const {
      startingLevel,
      currentLevel,
      progressPercentage,
      sessionsCompleted,
      lastSessionDate,
      topicsCompleted,
      notes,
    } = req.body;

    const [existing] = await db
      .select()
      .from(progress)
      .where(and(eq(progress.id, progId), eq(progress.userId, me.id)));

    if (!existing) {
      return res.status(404).json({ error: 'Progress record not found.' });
    }

    await db
      .update(progress)
      .set({
        startingLevel: startingLevel ?? existing.startingLevel,
        currentLevel: currentLevel ?? existing.currentLevel,
        progressPercentage:
          progressPercentage !== undefined
            ? Math.max(0, Math.min(100, Number(progressPercentage)))
            : existing.progressPercentage,
        sessionsCompleted:
          sessionsCompleted !== undefined
            ? Number(sessionsCompleted)
            : existing.sessionsCompleted,
        lastSessionDate: lastSessionDate ?? existing.lastSessionDate,
        topicsCompleted: topicsCompleted ?? existing.topicsCompleted,
        notes: notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(progress.id, progId));

    const full = await getFullUserProfile(me.id);
    res.json({
      message: 'Learning progress updated successfully.',
      progress: full?.progress || [],
      overallProgress: full?.overallProgress || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update learning progress.' });
  }
});

// Learning Goals CRUD
studentRouter.get('/goals', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const goals = await db
      .select()
      .from(learningGoals)
      .where(eq(learningGoals.userId, me.id))
      .orderBy(asc(learningGoals.targetDate));

    const allSkills = await db.select().from(skills);
    const skillMap = new Map(allSkills.map((s) => [s.id, s.name]));

    res.json({
      goals: goals.map((g) => ({
        ...g,
        skillName: g.skillId ? skillMap.get(g.skillId) || null : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load learning goals.' });
  }
});

studentRouter.post('/goals', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { title, description, skillId, targetDate, progressPercentage, status } = req.body;

    if (!title || !String(title).trim() || !targetDate) {
      return res.status(400).json({ error: 'Goal title and target date are required.' });
    }

    const pct = Math.max(0, Math.min(100, Number(progressPercentage) || 0));
    const derivedStatus = status || (pct === 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started');

    const [created] = await db
      .insert(learningGoals)
      .values({
        userId: me.id,
        skillId: skillId ? Number(skillId) : null,
        title: String(title).trim(),
        description: description ? String(description).trim() : '',
        targetDate: String(targetDate),
        progressPercentage: pct,
        status: derivedStatus,
      })
      .returning();

    res.status(201).json({ message: 'Learning goal created.', goal: created });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create learning goal.' });
  }
});

studentRouter.put('/goals/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const goalId = Number(req.params.id);
    const { title, description, targetDate, progressPercentage, status } = req.body;

    const [existing] = await db
      .select()
      .from(learningGoals)
      .where(and(eq(learningGoals.id, goalId), eq(learningGoals.userId, me.id)));

    if (!existing) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const nextPct =
      progressPercentage !== undefined
        ? Math.max(0, Math.min(100, Number(progressPercentage)))
        : existing.progressPercentage;

    const nextStatus =
      status !== undefined
        ? String(status)
        : nextPct === 100
        ? 'Completed'
        : nextPct > 0
        ? 'In Progress'
        : 'Not Started';

    const [updated] = await db
      .update(learningGoals)
      .set({
        title: title !== undefined ? String(title).trim() : existing.title,
        description: description !== undefined ? String(description) : existing.description,
        targetDate: targetDate !== undefined ? String(targetDate) : existing.targetDate,
        progressPercentage: nextPct,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(learningGoals.id, goalId))
      .returning();

    res.json({ message: 'Learning goal updated.', goal: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update learning goal.' });
  }
});

studentRouter.delete('/goals/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const goalId = Number(req.params.id);
    await db
      .delete(learningGoals)
      .where(and(eq(learningGoals.id, goalId), eq(learningGoals.userId, me.id)));
    res.json({ message: 'Learning goal deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete learning goal.' });
  }
});

// Notifications
studentRouter.get('/notifications', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, me.id))
      .orderBy(desc(notifications.createdAt));

    res.json({
      notifications: list,
      unreadCount: list.filter((n) => !n.isRead).length,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

studentRouter.put('/notifications/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, me.id));
    res.json({ message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

studentRouter.put('/notifications/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const notifId = Number(req.params.id);
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notifId), eq(notifications.userId, me.id)));
    res.json({ message: 'Notification marked as read.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Report Another User
studentRouter.post('/reports', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { reportedUserId, reason, description } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'Reported user and reason are required.' });
    }
    if (reportedUserId === me.id) {
      return res.status(400).json({ error: 'You cannot report yourself.' });
    }

    const [created] = await db
      .insert(reports)
      .values({
        reporterId: me.id,
        reportedUserId: String(reportedUserId),
        reason: String(reason),
        description: description ? String(description).trim() : '',
        status: 'Pending',
      })
      .returning();

    res.status(201).json({
      message: 'Report submitted to platform administrators for review.',
      report: created,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

// Block & Unblock Users
studentRouter.get('/blocked', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const rows = await db
      .select({
        id: blockedUsers.id,
        blockedUserId: blockedUsers.blockedUserId,
        fullName: profiles.fullName,
        email: profiles.email,
        college: profiles.college,
        avatarUrl: profiles.avatarUrl,
        createdAt: blockedUsers.createdAt,
      })
      .from(blockedUsers)
      .innerJoin(profiles, eq(blockedUsers.blockedUserId, profiles.id))
      .where(eq(blockedUsers.blockerId, me.id))
      .orderBy(desc(blockedUsers.createdAt));

    res.json({ blockedUsers: rows });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load blocked users.' });
  }
});

studentRouter.post('/blocked', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { blockedUserId } = req.body;
    if (!blockedUserId || blockedUserId === me.id) {
      return res.status(400).json({ error: 'Invalid user to block.' });
    }

    const existing = await db
      .select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, me.id),
          eq(blockedUsers.blockedUserId, String(blockedUserId))
        )
      );

    if (existing.length === 0) {
      await db.insert(blockedUsers).values({
        blockerId: me.id,
        blockedUserId: String(blockedUserId),
      });
    }

    res.status(201).json({ message: 'User has been blocked.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to block user.' });
  }
});

studentRouter.delete(
  '/blocked/:blockedUserId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const me = await resolveCurrentProfile(req);
      const targetId = String(req.params.blockedUserId);
      await db
        .delete(blockedUsers)
        .where(
          and(
            eq(blockedUsers.blockerId, me.id),
            eq(blockedUsers.blockedUserId, targetId)
          )
        );
      res.json({ message: 'User unblocked successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to unblock user.' });
    }
  }
);

// ============================================================================
// MENTOR SKILL VERIFICATION TESTS
// ============================================================================

// Get user's active test (if any) and past attempts
studentRouter.get('/skill-tests/my', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const allAttempts = await db
      .select()
      .from(skillTests)
      .where(eq(skillTests.userId, me.id))
      .orderBy(desc(skillTests.createdAt));

    // Check if any IN_PROGRESS test has expired on the server
    const now = Date.now();
    for (const att of allAttempts) {
      if (att.status === 'IN_PROGRESS') {
        const expMs = new Date(att.expiresAt).getTime();
        if (now >= expMs) {
          await finalizeSkillTestAttempt(att.id, true);
        }
      }
    }

    const refreshed = await db
      .select()
      .from(skillTests)
      .where(eq(skillTests.userId, me.id))
      .orderBy(desc(skillTests.createdAt));

    const activeTest = refreshed.find((t) => t.status === 'IN_PROGRESS') || null;
    res.json({
      activeTest: activeTest
        ? {
            ...activeTest,
            remainingSeconds: Math.max(
              0,
              Math.floor((new Date(activeTest.expiresAt).getTime() - Date.now()) / 1000)
            ),
          }
        : null,
      attempts: refreshed,
    });
  } catch (error: any) {
    console.error('Error in GET /api/skill-tests/my:', error);
    res.status(500).json({ error: 'Failed to load skill test attempts.' });
  }
});

// Start (or resume active) Skill Verification Test
studentRouter.post('/skill-tests/start', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { skill, difficulty } = req.body;
    const chosenSkill = String(skill || 'JavaScript').trim();
    const chosenDiff = String(difficulty || 'Intermediate').trim();

    // Check if user already has an active, non-expired test
    const existingActive = await db
      .select()
      .from(skillTests)
      .where(and(eq(skillTests.userId, me.id), eq(skillTests.status, 'IN_PROGRESS')));

    for (const active of existingActive) {
      const remaining = Math.floor((new Date(active.expiresAt).getTime() - Date.now()) / 1000);
      if (remaining > 0 && active.skill.toLowerCase() === chosenSkill.toLowerCase()) {
        return res.json({
          message: 'Resuming active test attempt.',
          testId: active.id,
          resumed: true,
        });
      } else if (remaining <= 0) {
        await finalizeSkillTestAttempt(active.id, true);
      }
    }

    const generated = generateSkillTestQuestions(chosenSkill);
    const testId = `TEST-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const durationSeconds = 20 * 60; // 20 minutes for 20 questions
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    await db.insert(skillTests).values({
      id: testId,
      userId: me.id,
      skill: chosenSkill,
      difficulty: chosenDiff,
      status: 'IN_PROGRESS',
      totalQuestions: generated.length,
      durationSeconds,
      startedAt,
      expiresAt,
      maxScore: generated.reduce((s, q) => s + q.points, 0),
      currentQuestionIndex: 0,
    });

    for (const q of generated) {
      await db.insert(skillTestQuestions).values({
        testId,
        questionNumber: q.questionNumber,
        questionType: q.questionType,
        questionText: q.questionText,
        options: JSON.stringify(q.options),
        starterCode: q.starterCode,
        expectedKeywords: JSON.stringify(q.expectedKeywords),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        userAnswer: q.questionType === 'CODE' ? q.starterCode : '',
        isAnswered: false,
      });
    }

    res.status(201).json({
      message: 'Skill verification test started.',
      testId,
      resumed: false,
    });
  } catch (error: any) {
    console.error('Error in POST /api/skill-tests/start:', error);
    res.status(500).json({ error: 'Failed to start skill test.' });
  }
});

// Get Test Screen state or Final Result (with server-authoritative timer)
studentRouter.get('/skill-tests/:testId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const testId = String(req.params.testId);
    const [test] = await db.select().from(skillTests).where(eq(skillTests.id, testId));

    if (!test) {
      return res.status(404).json({ error: 'Skill test attempt not found.' });
    }
    if (test.userId !== me.id && me.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to view this test.' });
    }

    // Check server timer expiration
    const now = Date.now();
    const expiresMs = new Date(test.expiresAt).getTime();
    let currentTest = test;

    if (test.status === 'IN_PROGRESS' && now >= expiresMs) {
      const finalized = await finalizeSkillTestAttempt(testId, true);
      if (finalized) currentTest = finalized.test;
    }

    const rawQuestions = await db
      .select()
      .from(skillTestQuestions)
      .where(eq(skillTestQuestions.testId, testId))
      .orderBy(asc(skillTestQuestions.questionNumber));

    const remainingSeconds =
      currentTest.status === 'IN_PROGRESS'
        ? Math.max(0, Math.floor((new Date(currentTest.expiresAt).getTime() - Date.now()) / 1000))
        : 0;

    const formattedQuestions = rawQuestions.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options || '[]');
      } catch {
        parsedOptions = [];
      }

      // Check whether user actually answered
      const hasAnswer =
        q.questionType === 'MCQ'
          ? Boolean(q.userAnswer && q.userAnswer.trim())
          : Boolean(
              q.userAnswer &&
                q.userAnswer.replace(/\s+/g, '') !== (q.starterCode || '').replace(/\s+/g, '') &&
                q.userAnswer.trim().length > 10
            );

      if (currentTest.status === 'IN_PROGRESS') {
        return {
          id: q.id,
          testId: q.testId,
          questionNumber: q.questionNumber,
          questionType: q.questionType,
          questionText: q.questionText,
          options: parsedOptions,
          starterCode: q.starterCode,
          points: q.points,
          userAnswer: q.userAnswer,
          isAnswered: hasAnswer,
        };
      }

      return {
        id: q.id,
        testId: q.testId,
        questionNumber: q.questionNumber,
        questionType: q.questionType,
        questionText: q.questionText,
        options: parsedOptions,
        starterCode: q.starterCode,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        userAnswer: q.userAnswer,
        isAnswered: q.isAnswered,
        isCorrect: q.isCorrect,
        pointsEarned: q.pointsEarned,
      };
    });

    res.json({
      test: {
        ...currentTest,
        remainingSeconds,
      },
      questions: formattedQuestions,
    });
  } catch (error: any) {
    console.error('Error in GET /api/skill-tests/:testId:', error);
    res.status(500).json({ error: 'Failed to load skill test.' });
  }
});

// Save Answer Temporarily During Active Test (preserves MCQ & Code answers across navigation/refresh)
studentRouter.put(
  '/skill-tests/:testId/answer',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const me = await resolveCurrentProfile(req);
      const testId = String(req.params.testId);
      const { questionNumber, userAnswer, currentQuestionIndex } = req.body;

      const [test] = await db.select().from(skillTests).where(eq(skillTests.id, testId));
      if (!test || test.userId !== me.id) {
        return res.status(404).json({ error: 'Test attempt not found.' });
      }

      if (test.status !== 'IN_PROGRESS') {
        return res.status(400).json({ error: 'This test is already locked and submitted.' });
      }

      const now = Date.now();
      const expiresMs = new Date(test.expiresAt).getTime();
      if (now >= expiresMs) {
        const finalized = await finalizeSkillTestAttempt(testId, true);
        return res.json({
          expired: true,
          message: 'Time is up! Your test has been automatically submitted.',
          test: finalized?.test,
        });
      }

      if (questionNumber !== undefined) {
        const [qRow] = await db
          .select()
          .from(skillTestQuestions)
          .where(
            and(
              eq(skillTestQuestions.testId, testId),
              eq(skillTestQuestions.questionNumber, Number(questionNumber))
            )
          );

        if (qRow) {
          const ansStr = String(userAnswer ?? '');
          const isAnswered =
            qRow.questionType === 'MCQ'
              ? Boolean(ansStr.trim())
              : Boolean(
                  ansStr.replace(/\s+/g, '') !== (qRow.starterCode || '').replace(/\s+/g, '') &&
                    ansStr.trim().length > 10
                );

          await db
            .update(skillTestQuestions)
            .set({
              userAnswer: ansStr,
              isAnswered,
            })
            .where(eq(skillTestQuestions.id, qRow.id));
        }
      }

      if (currentQuestionIndex !== undefined) {
        await db
          .update(skillTests)
          .set({ currentQuestionIndex: Number(currentQuestionIndex) })
          .where(eq(skillTests.id, testId));
      }

      const remainingSeconds = Math.max(
        0,
        Math.floor((new Date(test.expiresAt).getTime() - Date.now()) / 1000)
      );

      res.json({
        saved: true,
        remainingSeconds,
      });
    } catch (error: any) {
      console.error('Error saving test answer:', error);
      res.status(500).json({ error: 'Failed to save answer.' });
    }
  }
);

// Submit & Lock Skill Test
studentRouter.post(
  '/skill-tests/:testId/submit',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const me = await resolveCurrentProfile(req);
      const testId = String(req.params.testId);
      const { answers } = req.body;

      const [test] = await db.select().from(skillTests).where(eq(skillTests.id, testId));
      if (!test || test.userId !== me.id) {
        return res.status(404).json({ error: 'Test attempt not found.' });
      }

      if (test.status === 'IN_PROGRESS' && answers && typeof answers === 'object') {
        const questions = await db
          .select()
          .from(skillTestQuestions)
          .where(eq(skillTestQuestions.testId, testId));

        for (const q of questions) {
          if (answers[q.questionNumber] !== undefined) {
            await db
              .update(skillTestQuestions)
              .set({ userAnswer: String(answers[q.questionNumber]) })
              .where(eq(skillTestQuestions.id, q.id));
          }
        }
      }

      const finalized = await finalizeSkillTestAttempt(testId, false);
      if (!finalized) {
        return res.status(404).json({ error: 'Could not finalize test.' });
      }

      await createNotification(
        me.id,
        'SKILL_TEST_SUBMITTED',
        `Skill Test Completed: ${finalized.test.skill}`,
        `You scored ${finalized.test.score}/${finalized.test.maxScore} (${finalized.test.percentage}%). Your profile is now Pending Admin Review for the Verified Mentor Badge.`,
        finalized.test.id
      );

      res.json({
        message: 'Skill test submitted and locked! Your result has been sent for Admin Review.',
        test: finalized.test,
      });
    } catch (error: any) {
      console.error('Error submitting skill test:', error);
      res.status(500).json({ error: 'Failed to submit skill test.' });
    }
  }
);

// ============================================================================
// CERTIFICATES & PUBLIC CERTIFICATE VERIFICATION
// ============================================================================

// Get all certificates earned by the current user (and auto-issue for 100% progress or verified mentor)
studentRouter.get('/certificates', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const me = await resolveCurrentProfile(req);

    // 1. If user is an Approved Verified Mentor, ensure they have their Verified Mentor Certificate
    if (me.isVerifiedMentor && me.mentorVerificationStatus === 'Approved') {
      const primarySkill = (me.mentorVerifiedSkills || 'Peer Mentoring').split(',')[0].trim() || 'Peer Mentoring';
      await issueCertificateIfNotExists({
        userId: me.id,
        recipientName: me.fullName,
        title: `Verified Peer Mentor – ${primarySkill}`,
        skillName: primarySkill,
        certificateType: 'MENTOR_VERIFICATION',
        issuedBy: 'SkillBridge Academic Verification Board',
      });
    }

    // 2. If user has any progress items at 100%, ensure they have a Skill Completion Certificate
    const userProg = await db
      .select({
        progressPercentage: progress.progressPercentage,
        skillName: skills.name,
      })
      .from(progress)
      .innerJoin(skills, eq(progress.skillId, skills.id))
      .where(eq(progress.userId, me.id));

    for (const p of userProg) {
      if (p.progressPercentage >= 100) {
        await issueCertificateIfNotExists({
          userId: me.id,
          recipientName: me.fullName,
          title: `Certificate of Skill Mastery – ${p.skillName}`,
          skillName: p.skillName,
          certificateType: 'SKILL_COMPLETION',
          score: 100,
          issuedBy: 'SkillBridge Academic Board',
        });
      }
    }

    // 3. If user passed a skill test (>= 60%), ensure they have a Skill Assessment Certificate
    const myTests = await db
      .select()
      .from(skillTests)
      .where(and(eq(skillTests.userId, me.id), eq(skillTests.passed, true)));

    for (const t of myTests) {
      await issueCertificateIfNotExists({
        userId: me.id,
        recipientName: me.fullName,
        title: `Skill Assessment Achievement – ${t.skill}`,
        skillName: t.skill,
        certificateType: 'SKILL_COMPLETION',
        score: t.percentage,
        issuedBy: 'SkillBridge Technical Assessment Board',
      });
    }

    const userCerts = await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, me.id))
      .orderBy(desc(certificates.createdAt));

    res.json({ certificates: userCerts });
  } catch (error: any) {
    console.error('Error in GET /api/certificates:', error);
    res.status(500).json({ error: 'Failed to load certificates.' });
  }
});

// Claim / Generate a Certificate for a completed skill or peer exchange milestone
studentRouter.post('/certificates/claim', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const me = await resolveCurrentProfile(req);
    const { skillName, title, certificateType } = req.body;
    const targetSkill = String(skillName || 'Full Stack Development').trim();
    const targetType =
      certificateType === 'MENTOR_VERIFICATION' || certificateType === 'PEER_EXCHANGE'
        ? certificateType
        : 'SKILL_COMPLETION';
    const targetTitle = String(
      title || `Certificate of Completion – ${targetSkill}`
    ).trim();

    const cert = await issueCertificateIfNotExists({
      userId: me.id,
      recipientName: me.fullName,
      title: targetTitle,
      skillName: targetSkill,
      certificateType: targetType,
      score: 92,
      issuedBy: 'SkillBridge Academic Board',
    });

    res.status(201).json({
      message: `Certificate ${cert.certificateId} ready!`,
      certificate: cert,
    });
  } catch (error: any) {
    console.error('Error claiming certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate.' });
  }
});

// Public / Authenticated Certificate Verification by unique Certificate ID (e.g. SB-CERT-2026-000101)
studentRouter.get('/certificates/verify/:certificateId', async (req, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const rawId = String(req.params.certificateId || '').trim().toUpperCase();
    if (!rawId) {
      return res.status(400).json({ valid: false, error: 'Certificate ID is required.' });
    }

    const [cert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.certificateId, rawId));

    if (!cert) {
      return res.status(404).json({
        valid: false,
        message: `No certificate found matching ID "${rawId}". Please check the Certificate ID and try again.`,
      });
    }

    res.json({
      valid: cert.verificationStatus === 'Verified',
      certificate: cert,
    });
  } catch (error: any) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ valid: false, error: 'Failed to verify certificate.' });
  }
});
