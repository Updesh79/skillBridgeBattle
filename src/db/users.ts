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
    const normalizedEmail = email.toLowerCase();
    const byEmail = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail));

    if (byEmail.length > 0) {
      // Line 32 Fix: Sync the uid if registered with email/password previously
      const [updated] = await db
        .update(profiles)
        .set({ uid, emailVerified: true, updatedAt: new Date() })
        .where(eq(profiles.id, byEmail[0].id))
        .returning();
      return updated || byEmail[0];
    }

    const derivedName =
      fullName ||
      email
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const initialRole =
      normalizedEmail === 'abhiraghuvanshi2879@gmail.com' ? 'ADMIN' : 'STUDENT';

    // Line 53 Fix: Target profiles.id on conflict
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
        target: profiles.id,
        set: {
          uid,
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
