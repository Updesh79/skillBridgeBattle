import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  profiles,
  userLearningSkills,
  userTeachingSkills,
  progress,
  learningGoals,
} from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import {
  requireAuth,
  type AuthRequest,
  createSignedSessionToken,
} from '../middleware/auth.ts';
import { getOrCreateUser } from '../db/users.ts';
import { getFullUserProfile, createNotification } from '../db/queries.ts';
import { ensureDefaultCatalogAndDemoPeers } from '../db/seed.ts';

export const authRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_skillbridge_salt').digest('hex');
}

function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register with Email & Password (supports Learner & Mentor registration)
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const {
      fullName,
      email,
      password,
      accountType,
      phoneNumber,
      qualification,
      careerGoal,
      experienceYears,
      experienceDescription,
      githubUrl,
      linkedinUrl,
      projectsUrl,
      learningSkillIds,
      teachingSkillIds,
      autoLogin,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail));

    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const uid = `usr_${crypto.randomUUID()}`;
    const verificationCode = generateSixDigitCode();
    const normalizedAccountType = accountType === 'MENTOR' ? 'MENTOR' : 'LEARNER';
    const shouldAutoVerify = Boolean(autoLogin || accountType);

    const bioText =
      normalizedAccountType === 'MENTOR'
        ? experienceDescription
          ? String(experienceDescription).trim()
          : `Peer Mentor (${experienceYears || '1+'} yrs experience)`
        : careerGoal
        ? `Aspiring ${String(careerGoal).trim()} • ${qualification || 'University Student'}`
        : '';

    await db.insert(profiles).values({
      id: uid,
      uid,
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      emailVerified: shouldAutoVerify,
      verificationCode: shouldAutoVerify ? null : verificationCode,
      role: 'STUDENT',
      accountType: normalizedAccountType,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : '',
      qualification: qualification ? String(qualification).trim() : '',
      careerGoal: careerGoal ? String(careerGoal).trim() : '',
      experienceYears: experienceYears ? String(experienceYears).trim() : '',
      experienceDescription: experienceDescription ? String(experienceDescription).trim() : '',
      githubUrl: githubUrl ? String(githubUrl).trim() : '',
      linkedinUrl: linkedinUrl ? String(linkedinUrl).trim() : '',
      projectsUrl: projectsUrl ? String(projectsUrl).trim() : '',
      isVerifiedMentor: false,
      mentorVerificationStatus: normalizedAccountType === 'MENTOR' ? 'Not Submitted' : 'Not Submitted',
      bio: bioText,
      isActive: true,
      isDemo: false,
      college: 'University Campus',
      course: qualification ? String(qualification).trim() : 'BCA',
      year: normalizedAccountType === 'MENTOR' ? `${experienceYears || '1+'} Yrs Exp` : 'Student',
      availability: 'Weekdays & Weekends',
    });

    // Save selected learning skills for Learner
    if (Array.isArray(learningSkillIds) && learningSkillIds.length > 0) {
      for (const rawId of learningSkillIds) {
        const sId = Number(rawId);
        if (!Number.isNaN(sId) && sId > 0) {
          await db.insert(userLearningSkills).values({
            userId: uid,
            skillId: sId,
            level: 'Beginner',
          });
          await db.insert(progress).values({
            userId: uid,
            skillId: sId,
            startingLevel: 'Beginner',
            currentLevel: 'Beginner',
            progressPercentage: 10,
            sessionsCompleted: 0,
            topicsCompleted: 'Onboarding completed',
            notes: careerGoal ? `Career Goal: ${careerGoal}` : '',
          });
        }
      }
    }

    // Save career goal as an active Learning Goal if provided
    if (careerGoal && String(careerGoal).trim()) {
      const target = new Date();
      target.setMonth(target.getMonth() + 3);
      await db.insert(learningGoals).values({
        userId: uid,
        skillId:
          Array.isArray(learningSkillIds) && learningSkillIds.length > 0
            ? Number(learningSkillIds[0]) || null
            : null,
        title: `Become a ${String(careerGoal).trim()}`,
        description: `Master selected skills to achieve my career goal as a ${String(careerGoal).trim()}.`,
        targetDate: target.toISOString().split('T')[0],
        progressPercentage: 10,
        status: 'In Progress',
      });
    }

    // Save selected teaching skills for Mentor
    if (Array.isArray(teachingSkillIds) && teachingSkillIds.length > 0) {
      for (const rawId of teachingSkillIds) {
        const sId = Number(rawId);
        if (!Number.isNaN(sId) && sId > 0) {
          await db.insert(userTeachingSkills).values({
            userId: uid,
            skillId: sId,
            level: 'Advanced',
          });
        }
      }
    }

    await createNotification(
      uid,
      'WELCOME',
      `Welcome to SkillBridge as a ${normalizedAccountType === 'MENTOR' ? 'Mentor' : 'Learner'}!`,
      normalizedAccountType === 'MENTOR'
        ? 'Complete your Mentor Skill Verification Test so an administrator can review and award your Verified Mentor badge.'
        : 'Explore compatible peers, schedule learning sessions, and track your career goal progress.'
    );

    if (shouldAutoVerify) {
      const token = createSignedSessionToken({
        uid,
        email: normalizedEmail,
        email_verified: true,
        name: String(fullName).trim(),
      });
      const fullProfile = await getFullUserProfile(uid);
      return res.status(201).json({
        message: 'Registration completed successfully!',
        requiresVerification: false,
        token,
        profile: fullProfile,
        accountType: normalizedAccountType,
      });
    }

    res.status(201).json({
      message: 'Account created. Please verify your email address.',
      requiresVerification: true,
      email: normalizedEmail,
      verificationCodePreview: verificationCode,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error);
    res.status(500).json({ error: error.message || 'Registration failed.' });
  }
});

// Verify Email with Code
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail));

    if (!user) {
      return res.status(404).json({ error: 'Account not found for this email.' });
    }

    if (user.verificationCode && user.verificationCode !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    await db
      .update(profiles)
      .set({
        emailVerified: true,
        verificationCode: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    const token = createSignedSessionToken({
      uid: user.id,
      email: user.email,
      email_verified: true,
      name: user.fullName,
    });

    const fullProfile = await getFullUserProfile(user.id);
    res.json({
      message: 'Email verified successfully!',
      token,
      profile: fullProfile,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/verify-email:', error);
    res.status(500).json({ error: error.message || 'Email verification failed.' });
  }
});

// Resend Verification Email
authRouter.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail));

    if (!user) {
      return res.status(404).json({ error: 'No account found with that email address.' });
    }

    const newCode = generateSixDigitCode();
    await db
      .update(profiles)
      .set({ verificationCode: newCode, updatedAt: new Date() })
      .where(eq(profiles.id, user.id));

    res.json({
      message: 'A new verification email has been sent.',
      email: normalizedEmail,
      verificationCodePreview: newCode,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/resend-verification:', error);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

// Login with Email & Password
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail));

    if (!user || !user.passwordHash || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Your account has been deactivated by an administrator. Please contact support.',
      });
    }

    if (!user.emailVerified) {
      const verificationCode = user.verificationCode || generateSixDigitCode();
      if (!user.verificationCode) {
        await db
          .update(profiles)
          .set({ verificationCode })
          .where(eq(profiles.id, user.id));
      }
      return res.status(403).json({
        error: 'Please verify your email address before logging in.',
        requiresVerification: true,
        email: user.email,
        verificationCodePreview: verificationCode,
      });
    }

    const token = createSignedSessionToken({
      uid: user.id,
      email: user.email,
      email_verified: true,
      name: user.fullName,
    });

    const fullProfile = await getFullUserProfile(user.id);
    res.json({
      token,
      profile: fullProfile,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
});

// Forgot Password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please enter your email address.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail));

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const resetCode = generateSixDigitCode();
    await db
      .update(profiles)
      .set({ resetCode, updatedAt: new Date() })
      .where(eq(profiles.id, user.id));

    res.json({
      message: 'Password reset instructions have been sent to your email.',
      email: normalizedEmail,
      resetCodePreview: resetCode,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/forgot-password:', error);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// Reset Password
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail));

    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (!user.resetCode || user.resetCode !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid or expired password reset code.' });
    }

    await db
      .update(profiles)
      .set({
        passwordHash: hashPassword(newPassword),
        resetCode: null,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error: any) {
    console.error('Error in /api/auth/reset-password:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Get or Sync Current Authenticated User (supports Firebase Google OAuth + Email/Password)
authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const decoded = req.user!;
    const syncedUser = await getOrCreateUser(
      decoded.uid,
      decoded.email || `${decoded.uid}@skillbridge.edu`,
      decoded.name,
      decoded.email_verified ?? true,
      decoded.picture
    );

    if (!syncedUser.isActive) {
      return res.status(403).json({
        error: 'Your account has been deactivated by an administrator.',
      });
    }

    const fullProfile = await getFullUserProfile(syncedUser.id);
    res.json({ profile: fullProfile });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: error.message || 'Failed to load authenticated user.' });
  }
});

// Change Password for Logged-In User
authRouter.put('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    const [me] = await db.select().from(profiles).where(eq(profiles.uid, req.user!.uid));
    if (!me) return res.status(404).json({ error: 'User not found.' });

    await db
      .update(profiles)
      .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
      .where(eq(profiles.id, me.id));

    res.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Error in /api/auth/change-password:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});
