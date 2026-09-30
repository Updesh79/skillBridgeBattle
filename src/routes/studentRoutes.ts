import { Router, Response } from 'express';
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
} from '../db/schema.ts';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
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
