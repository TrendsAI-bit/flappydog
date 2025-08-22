/**
 * FlappyDog - Ghost Race API
 * Vercel serverless function for retrieving ghost race data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

interface GhostData {
  positions: Array<{
    time: number;
    x: number;
    y: number;
    rotation: number;
  }>;
  events: Array<{
    time: number;
    type: 'flap' | 'dash' | 'coin' | 'score';
    data?: any;
  }>;
  duration: number;
  checksum: string;
  metadata: {
    playerName: string;
    score: number;
    date: string;
    seed: string;
    gameMode: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200'); // 1 hour cache
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { seed, type = 'daily', playerName } = req.query;
    
    if (!seed) {
      res.status(400).json({ error: 'Seed parameter is required' });
      return;
    }
    
    // Validate seed format
    if (typeof seed !== 'string' || seed.length < 4) {
      res.status(400).json({ error: 'Invalid seed format' });
      return;
    }
    
    let ghostData: GhostData | null = null;
    
    if (type === 'daily') {
      ghostData = generateDailyGhost(seed as string);
    } else if (type === 'player' && playerName) {
      ghostData = getPlayerGhost(seed as string, playerName as string);
    } else if (type === 'dev') {
      ghostData = generateDevGhost(seed as string);
    }
    
    if (!ghostData) {
      res.status(404).json({ error: 'Ghost data not found' });
      return;
    }
    
    res.status(200).json({
      success: true,
      ghost: ghostData,
      info: {
        type,
        seed,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Ghost race API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateDailyGhost(seed: string): GhostData {
  const random = seedRandom(seed);
  
  // Generate a challenging but achievable ghost
  const targetScore = 25 + Math.floor(random() * 25); // 25-50 score
  const duration = 45000 + (targetScore * 800); // Duration based on score
  
  const positions = [];
  const events = [];
  
  let time = 0;
  let x = 160;
  let y = 300;
  let velocity = 0;
  let score = 0;
  let lastFlap = 0;
  
  while (time < duration && score < targetScore) {
    // Smart flapping pattern
    const shouldFlap = (
      (y > 400 && velocity > 3) || // Too low with downward velocity
      (velocity > 6) || // High downward velocity
      (time - lastFlap > 2000 && random() < 0.4) // Random flap after pause
    );
    
    if (shouldFlap) {
      velocity = -7 - random() * 2; // Slight variation in flap power
      events.push({ time, type: 'flap' });
      lastFlap = time;
    }
    
    // Physics
    velocity += 0.45; // Gravity
    y += velocity;
    
    // Bounds checking
    if (y < 0) {
      y = 0;
      velocity = 0;
    }
    if (y > 550) {
      break; // Game over
    }
    
    // Scoring
    if (time > 0 && time % 2800 < 50) { // Score every ~2.8 seconds
      score++;
      events.push({ time, type: 'score' });
    }
    
    // Occasional dash (every 8-12 seconds)
    if (time > 8000 && (time % 10000) < 50 && random() < 0.3) {
      events.push({ time, type: 'dash' });
    }
    
    // Coin collection (occasionally)
    if (random() < 0.02) { // 2% chance per frame
      events.push({ time, type: 'coin' });
    }
    
    // Record position every 66ms (15fps for smooth playback)
    if (time % 66 === 0) {
      positions.push({
        time,
        x: x + (time * 0.12), // Forward movement
        y: Math.max(0, Math.min(550, y)),
        rotation: Math.max(-30, Math.min(30, velocity * 1.5))
      });
    }
    
    time += 33; // ~30fps simulation
  }
  
  const ghostData: GhostData = {
    positions,
    events,
    duration: time,
    checksum: generateChecksum(positions, events, time),
    metadata: {
      playerName: 'DailyChampion',
      score: score,
      date: new Date().toISOString().split('T')[0],
      seed,
      gameMode: 'daily'
    }
  };
  
  return ghostData;
}

function generateDevGhost(seed: string): GhostData {
  const random = seedRandom(seed + 'dev');
  
  // Generate a perfect, demonstration-quality ghost
  const targetScore = 35 + Math.floor(random() * 15); // 35-50 score
  const duration = 60000; // 1 minute demonstration
  
  const positions = [];
  const events = [];
  
  let time = 0;
  let x = 160;
  let y = 300;
  let velocity = 0;
  let score = 0;
  
  // Perfect rhythm pattern
  const flapInterval = 1200; // Consistent flap timing
  let nextFlap = flapInterval;
  
  while (time < duration && score < targetScore) {
    // Perfect timing flaps
    if (time >= nextFlap) {
      velocity = -8;
      events.push({ time, type: 'flap' });
      nextFlap += flapInterval + (random() * 200 - 100); // Slight variation
    }
    
    // Physics
    velocity += 0.5;
    y += velocity;
    
    // Perfect bounds control
    if (y < 50) {
      y = 50;
      velocity = 2;
    }
    if (y > 450) {
      y = 450;
      velocity = -2;
    }
    
    // Consistent scoring
    if (time > 0 && time % 2500 < 50) {
      score++;
      events.push({ time, type: 'score' });
    }
    
    // Show off advanced techniques
    if (time % 8000 < 50) {
      events.push({ time, type: 'dash' });
    }
    
    if (time % 3000 < 50 && random() < 0.8) {
      events.push({ time, type: 'coin' });
    }
    
    // Record smooth positions
    if (time % 50 === 0) {
      positions.push({
        time,
        x: x + (time * 0.1),
        y: Math.max(50, Math.min(450, y)),
        rotation: Math.max(-20, Math.min(20, velocity * 1.2))
      });
    }
    
    time += 33;
  }
  
  return {
    positions,
    events,
    duration: time,
    checksum: generateChecksum(positions, events, time),
    metadata: {
      playerName: 'FlappyDogDev',
      score: score,
      date: new Date().toISOString().split('T')[0],
      seed,
      gameMode: 'demo'
    }
  };
}

function getPlayerGhost(seed: string, playerName: string): GhostData | null {
  // In a real implementation, this would query a database
  // For now, return null to indicate no player ghost found
  return null;
}

function seedRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return function() {
    hash = ((hash * 9301) + 49297) % 233280;
    return hash / 233280;
  };
}

function generateChecksum(positions: any[], events: any[], duration: number): string {
  const data = {
    positionCount: positions.length,
    eventCount: events.length,
    duration,
    firstPos: positions[0],
    lastPos: positions[positions.length - 1]
  };
  
  return crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 8);
}
