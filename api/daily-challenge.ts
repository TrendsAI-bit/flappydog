/**
 * FlappyDog - Daily Challenge API
 * Vercel serverless function for daily challenge data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

interface DailyChallenge {
  date: string;
  seed: string;
  leaderboard: Array<{
    playerName: string;
    score: number;
    flag: string;
    timestamp: string;
  }>;
  playerBest: {
    score: number;
    rank: number;
  } | null;
  ghostRace: any | null;
  stats: {
    totalPlayers: number;
    averageScore: number;
    completionRate: number;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600'); // 5 min cache
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { date } = req.query;
    const targetDate = (date as string) || getTodayString();
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }
    
    // Generate daily challenge data
    const challenge = generateDailyChallenge(targetDate);
    
    res.status(200).json({
      success: true,
      challenge
    });
    
  } catch (error) {
    console.error('Daily challenge API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateDailyChallenge(date: string): DailyChallenge {
  const seed = generateDailySeed(date);
  
  // Generate deterministic leaderboard based on date
  const random = seedRandom(seed);
  const playerCount = 15 + Math.floor(random() * 35); // 15-50 players
  
  const leaderboard = [];
  const playerNames = generatePlayerNames(playerCount, random);
  const flags = ['🇺🇸', '🇬🇧', '🇨🇦', '🇩🇪', '🇫🇷', '🇯🇵', '🇰🇷', '🇨🇳', '🇦🇺', '🇧🇷', '🇮🇳', '🇮🇹', '🇪🇸', '🇲🇽', '🇸🇬'];
  
  // Generate scores with realistic distribution
  const baseScore = 20 + Math.floor(random() * 30); // 20-50 base
  
  for (let i = 0; i < playerCount; i++) {
    const scoreVariation = Math.floor(random() * 20) - (i * 2); // Decreasing scores
    const score = Math.max(1, baseScore + scoreVariation);
    const flag = flags[Math.floor(random() * flags.length)];
    
    // Generate realistic timestamp (within last 24 hours)
    const hoursAgo = Math.floor(random() * 24);
    const timestamp = new Date(Date.now() - hoursAgo * 3600000);
    
    leaderboard.push({
      playerName: playerNames[i],
      score,
      flag,
      timestamp: formatTimestamp(timestamp.getTime())
    });
  }
  
  // Sort by score
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Calculate stats
  const totalScore = leaderboard.reduce((sum, entry) => sum + entry.score, 0);
  const averageScore = Math.round(totalScore / leaderboard.length);
  const completionRate = Math.min(95, 60 + Math.floor(random() * 35)); // 60-95%
  
  return {
    date,
    seed,
    leaderboard: leaderboard.slice(0, 20), // Top 20
    playerBest: null, // Would be populated based on player's session
    ghostRace: generateGhostRace(seed, leaderboard[0]?.score || 0),
    stats: {
      totalPlayers: playerCount,
      averageScore,
      completionRate
    }
  };
}

function generateDailySeed(date: string): string {
  return crypto
    .createHash('sha256')
    .update(date + 'flappydog-daily-salt')
    .digest('hex')
    .substring(0, 8);
}

function seedRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return function() {
    hash = ((hash * 9301) + 49297) % 233280;
    return hash / 233280;
  };
}

function generatePlayerNames(count: number, random: () => number): string[] {
  const adjectives = [
    'Swift', 'Brave', 'Clever', 'Quick', 'Happy', 'Lucky', 'Mighty', 'Noble',
    'Wise', 'Bold', 'Fierce', 'Gentle', 'Bright', 'Strong', 'Calm', 'Wild',
    'Free', 'Pure', 'Keen', 'Loyal', 'True', 'Fast', 'Smart', 'Kind'
  ];
  
  const animals = [
    'Dog', 'Wolf', 'Fox', 'Eagle', 'Hawk', 'Lion', 'Tiger', 'Bear',
    'Panda', 'Rabbit', 'Deer', 'Owl', 'Cat', 'Lynx', 'Falcon', 'Raven',
    'Otter', 'Seal', 'Whale', 'Shark', 'Dragon', 'Phoenix', 'Griffin', 'Pegasus'
  ];
  
  const names = [];
  const used = new Set<string>();
  
  while (names.length < count) {
    const adj = adjectives[Math.floor(random() * adjectives.length)];
    const animal = animals[Math.floor(random() * animals.length)];
    const number = Math.floor(random() * 1000);
    const name = `${adj}${animal}${number}`;
    
    if (!used.has(name)) {
      used.add(name);
      names.push(name);
    }
  }
  
  return names;
}

function generateGhostRace(seed: string, topScore: number): any {
  if (topScore === 0) return null;
  
  const random = seedRandom(seed + 'ghost');
  
  // Generate a simplified ghost race data
  const duration = 30000 + (topScore * 1000); // Rough duration based on score
  const positions = [];
  const events = [];
  
  let time = 0;
  let x = 160; // Starting x position
  let y = 300; // Starting y position
  let velocity = 0;
  let score = 0;
  
  while (time < duration && score < topScore) {
    // Simulate basic movement
    if (random() < 0.3) { // 30% chance to flap
      velocity = -8;
      events.push({ time, type: 'flap' });
    }
    
    velocity += 0.5; // Gravity
    y += velocity;
    
    // Bounds check
    if (y < 0) {
      y = 0;
      velocity = 0;
    }
    if (y > 550) {
      break; // Game over
    }
    
    // Score occasionally
    if (time > 0 && time % 3000 < 50) { // Every ~3 seconds
      score++;
      events.push({ time, type: 'score' });
    }
    
    // Record position every 100ms
    if (time % 100 === 0) {
      positions.push({
        time,
        x: x + (time * 0.1), // Slow forward movement
        y: Math.max(0, Math.min(550, y)),
        rotation: Math.max(-45, Math.min(45, velocity * 2))
      });
    }
    
    time += 50; // 50ms steps
  }
  
  return {
    positions,
    events,
    duration: time,
    checksum: crypto
      .createHash('md5')
      .update(JSON.stringify({ positions: positions.length, events: events.length, duration: time }))
      .digest('hex')
      .substring(0, 8)
  };
}

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}
