import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import crypto from 'crypto';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'skillbridge-academic-hmac-secret-2026';

export function createSignedSessionToken(payload: { uid: string; email: string; email_verified: boolean; name?: string }): string {
  const data = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `sb_tok.${data}.${sig}`;
}

export function verifySignedSessionToken(token: string): DecodedIdToken | null {
  if (!token.startsWith('sb_tok.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      uid: parsed.uid,
      email: parsed.email,
      email_verified: Boolean(parsed.email_verified),
      name: parsed.name,
      aud: 'skillbridge',
      auth_time: parsed.iat || Math.floor(Date.now() / 1000),
      exp: parsed.exp || Math.floor(Date.now() / 1000) + 3600,
      iat: parsed.iat || Math.floor(Date.now() / 1000),
      iss: 'skillbridge',
      sub: parsed.uid,
      firebase: { identities: {}, sign_in_provider: 'password' },
    } as DecodedIdToken;
  } catch {
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Check if it is a SkillBridge signed email/password session token
  if (token.startsWith('sb_tok.')) {
    const sessionUser = verifySignedSessionToken(token);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
    }
    req.user = sessionUser;
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
