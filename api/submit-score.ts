/**
 * FlappyDog - Score Submission API
 * Vercel serverless function for submitting and validating scores
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateSession } from './session';

// In-memory leaderboard storage (would use database in production)
const leaderboards = {
  daily: new Map<string, Array<LeaderboardEntry>>(),
  alltime: [] as LeaderboardEntry[]
};

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timestamp: number;
  seed: string;
  flag: string;
  gameMode: string;
  verified: boolean;
  ghostData?: any;
}

interface ScoreSubmission {
  score: number;
  seed: string;
  gameMode: string;
  ghostData: any;
  playerName: string;
  timestamp: number;
  sessionId: string;
  signature: string;
}

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
    const submission: ScoreSubmission = req.body;
    
    // Validate required fields
    if (!submission.score || !submission.playerName || !submission.sessionId || !submission.signature) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Validate session and signature
    const dataToSign = `${submission.score}:${submission.seed}:${submission.timestamp}`;
    if (!validateSession(submission.sessionId, submission.signature, dataToSign)) {
      res.status(401).json({ error: 'Invalid session or signature' });
      return;
    }
    
    // Anti-cheat validation
    const validation = validateScore(submission);
    if (!validation.valid) {
      res.status(400).json({ error: 'Score validation failed', reason: validation.reason });
      return;
    }
    
    // Rate limiting by IP
    const clientIP = req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown';
    const recentSubmissions = getRecentSubmissions(clientIP);
    if (recentSubmissions.length > 10) {
      res.status(429).json({ error: 'Too many score submissions' });
      return;
    }
    
    // Create leaderboard entry
    const entry: LeaderboardEntry = {
      id: generateEntryId(),
      playerName: sanitizePlayerName(submission.playerName),
      score: submission.score,
      timestamp: submission.timestamp,
      seed: submission.seed || '',
      flag: getCountryFlag(req),
      gameMode: submission.gameMode || 'classic',
      verified: true,
      ghostData: submission.ghostData
    };
    
    // Add to appropriate leaderboards
    if (submission.seed) {
      // Daily challenge
      const dailyDate = getDailyDate(submission.seed);
      if (!leaderboards.daily.has(dailyDate)) {
        leaderboards.daily.set(dailyDate, []);
      }
      const dailyBoard = leaderboards.daily.get(dailyDate)!;
      dailyBoard.push(entry);
      dailyBoard.sort((a, b) => b.score - a.score);
      
      // Keep only top 100
      if (dailyBoard.length > 100) {
        dailyBoard.splice(100);
      }
    }
    
    // All-time leaderboard
    leaderboards.alltime.push(entry);
    leaderboards.alltime.sort((a, b) => b.score - a.score);
    
    // Keep only top 1000
    if (leaderboards.alltime.length > 1000) {
      leaderboards.alltime.splice(1000);
    }
    
    // Track submission for rate limiting
    trackSubmission(clientIP, entry);
    
    res.status(200).json({
      success: true,
      entry: {
        id: entry.id,
        score: entry.score,
        rank: getRank(entry)
      }
    });
    
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function validateScore(submission: ScoreSubmission): { valid: boolean; reason?: string } {
  // Basic score validation
  if (submission.score < 0 || submission.score > 10000) {
    return { valid: false, reason: 'Score out of valid range' };
  }
  
  // Timestamp validation (not too old or in the future)
  const now = Date.now();
  const timeDiff = Math.abs(now - submission.timestamp);
  if (timeDiff > 24 * 60 * 60 * 1000) {
    return { valid: false, reason: 'Timestamp too old or in future' };
  }
  
  // Ghost data validation
  if (submission.ghostData) {
    const ghostValidation = validateGhostData(submission.ghostData, submission.score);
    if (!ghostValidation.valid) {
      return ghostValidation;
    }
  }
  
  return { valid: true };
}

function validateGhostData(ghostData: any, score: number): { valid: boolean; reason?: string } {
  if (!ghostData.positions || !Array.isArray(ghostData.positions)) {
    return { valid: false, reason: 'Invalid ghost data structure' };
  }
  
  // Check for reasonable data size
  if (ghostData.positions.length > 10000) {
    return { valid: false, reason: 'Ghost data too large' };
  }
  
  // Check for time consistency
  let lastTime = 0;
  for (const position of ghostData.positions) {
    if (position.time < lastTime) {
      return { valid: false, reason: 'Ghost data time inconsistency' };
    }
    lastTime = position.time;
  }
  
  // Check for impossible positions
  let impossibleCount = 0;
  for (let i = 1; i < ghostData.positions.length; i++) {
    const prev = ghostData.positions[i - 1];
    const curr = ghostData.positions[i];
    const timeDelta = curr.time - prev.time;
    const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
    
    // Check for teleportation
    if (timeDelta > 0 && distance / (timeDelta / 1000) > 1000) {
      impossibleCount++;
    }
    
    // Check bounds
    if (curr.x < -100 || curr.x > 900 || curr.y < -100 || curr.y > 700) {
      impossibleCount++;
    }
  }
  
  if (impossibleCount > 5) {
    return { valid: false, reason: 'Too many impossible positions in ghost data' };
  }
  
  // Check score consistency with events
  if (ghostData.events) {
    const scoreEvents = ghostData.events.filter((e: any) => e.type === 'score').length;
    if (Math.abs(scoreEvents - score) > 5) {
      return { valid: false, reason: 'Score inconsistent with ghost events' };
    }
  }
  
  return { valid: true };
}

// Rate limiting storage
const submissionTracking = new Map<string, Array<{ timestamp: number; entry: LeaderboardEntry }>>();

function getRecentSubmissions(ip: string): Array<{ timestamp: number; entry: LeaderboardEntry }> {
  const submissions = submissionTracking.get(ip) || [];
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  // Filter to recent submissions
  return submissions.filter(s => s.timestamp > oneHourAgo);
}

function trackSubmission(ip: string, entry: LeaderboardEntry): void {
  if (!submissionTracking.has(ip)) {
    submissionTracking.set(ip, []);
  }
  
  const submissions = submissionTracking.get(ip)!;
  submissions.push({ timestamp: Date.now(), entry });
  
  // Keep only recent submissions
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  submissionTracking.set(ip, submissions.filter(s => s.timestamp > oneHourAgo));
}

function getRank(entry: LeaderboardEntry): number {
  const board = entry.seed ? 
    leaderboards.daily.get(getDailyDate(entry.seed)) || [] :
    leaderboards.alltime;
  
  return board.findIndex(e => e.id === entry.id) + 1;
}

function generateEntryId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function sanitizePlayerName(name: string): string {
  return name.replace(/[^\w\s-]/g, '').substring(0, 20).trim() || 'Anonymous';
}

function getCountryFlag(req: VercelRequest): string {
  const country = req.headers['cf-ipcountry'] as string || 
                 req.headers['x-vercel-ip-country'] as string;
  
  const flagMap: Record<string, string> = {
    'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'DE': '🇩🇪', 'FR': '🇫🇷',
    'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳', 'AU': '🇦🇺', 'BR': '🇧🇷',
    'IN': '🇮🇳', 'IT': '🇮🇹', 'ES': '🇪🇸', 'MX': '🇲🇽', 'SG': '🇸🇬'
  };
  
  return flagMap[country] || '🌍';
}

function getDailyDate(seed: string): string {
  // Extract date from seed format YYYYMMDD
  if (seed.length >= 8) {
    const year = seed.substring(0, 4);
    const month = seed.substring(4, 6);
    const day = seed.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  // Fallback to today
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
}
