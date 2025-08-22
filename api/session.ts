/**
 * FlappyDog - Session API
 * Vercel serverless function for session management and anti-cheat
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// In-memory session storage (would use Redis/database in production)
const sessions = new Map<string, {
  nonce: string;
  key: string;
  created: number;
  ip: string;
}>();

// Clean up expired sessions (1 hour)
const SESSION_EXPIRY = 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.created > SESSION_EXPIRY) {
      sessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { sessionId } = req.body;
    
    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }
    
    // Rate limiting by IP
    const clientIP = req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown';
    const recentSessions = Array.from(sessions.values()).filter(
      session => session.ip === clientIP && Date.now() - session.created < 60000
    );
    
    if (recentSessions.length > 5) {
      res.status(429).json({ error: 'Too many session requests' });
      return;
    }
    
    // Generate nonce and secret key for this session
    const nonce = crypto.randomBytes(16).toString('hex');
    const key = crypto.randomBytes(32).toString('hex');
    
    // Store session
    sessions.set(sessionId, {
      nonce,
      key,
      created: Date.now(),
      ip: clientIP
    });
    
    res.status(200).json({
      success: true,
      nonce,
      key: key.substring(0, 16) // Only send part of the key for security
    });
    
  } catch (error) {
    console.error('Session API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export session validation function for other APIs
export function validateSession(sessionId: string, providedSignature: string, data: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  // Check if session is expired
  if (Date.now() - session.created > SESSION_EXPIRY) {
    sessions.delete(sessionId);
    return false;
  }
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', session.key)
    .update(data + session.nonce)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(providedSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
