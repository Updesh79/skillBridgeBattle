import { db } from './index.ts';
import { profiles } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  fullName?: string,
  emailVerified: boolean = true,
  avatarUrl?: string
) {
  try {
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.uid, uid));

    if (existing.length > 0) {
      if (emailVerified && !existing[0].emailVerified) {
        const updated = await db
          .update(profiles)
          .set({ emailVerified: true, updatedAt: new Date() })
          .where(eq(profiles.uid, uid))
          .returning();
        return updated[0];
      }
      return existing[0];
    }

    // Check if user exists by email (e.g., previously registered via email/password or seeded)
    const byEmail = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email.toLowerCase()));

    if (byEmail.length > 0) {
      return byEmail[0];
    }

    const derivedName =
      fullName ||
      email
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const normalizedEmail = email.toLowerCase();
    const initialRole =
      normalizedEmail === 'abhiraghuvanshi2879@gmail.com' ? 'ADMIN' : 'STUDENT';

    const result = await db
      .insert(profiles)
      .values({
        id: uid,
        uid,
        email: normalizedEmail,
        fullName: derivedName,
        emailVerified,
        avatarUrl: avatarUrl || '',
        role: initialRole,
        isActive: true,
        isDemo: false,
      })
      .onConflictDoUpdate({
        target: profiles.uid,
        set: {
          email: normalizedEmail,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile. Please try again later.', {
      cause: error,
    });
  }
}
