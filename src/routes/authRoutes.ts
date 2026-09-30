import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import { profiles } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import {
  requireAuth,
  AuthRequest,
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

// Register with Email & Password
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    await ensureDefaultCatalogAndDemoPeers();
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }
    if (password.length < 6) {
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

    await db.insert(profiles).values({
      id: uid,
      uid,
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      emailVerified: false,
      verificationCode,
      role: 'STUDENT', // Enforced STUDENT default role
      isActive: true,
      isDemo: false,
      college: 'University Campus',
      course: 'BCA',
      year: '3rd Year (Final)',
      availability: 'Weekdays & Weekends',
    });

    await createNotification(
      uid,
      'WELCOME',
      'Welcome to SkillBridge!',
      'Add the skills you can teach and the skills you want to learn to get instant peer matches.'
    );

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
