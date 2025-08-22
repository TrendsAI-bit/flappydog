/**
 * FlappyDog - Leaderboard API
 * Vercel serverless function for retrieving leaderboard data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// This would be shared with submit-score.ts in a real implementation
// For now, we'll simulate the leaderboard data
interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timestamp: number;
  seed: string;
  flag: string;
  gameMode: string;
  verified: boolean;
}

// Mock leaderboard data for demonstration
const mockLeaderboards = {
  daily: new Map<string, LeaderboardEntry[]>([
    [getTodayString(), [
      {
        id: '1',
        playerName: 'SwiftDog123',
        score: 42,
        timestamp: Date.now() - 3600000,
        seed: getDailySeed(),
        flag: '🇺🇸',
        gameMode: 'classic',
        verified: true
      },
      {
        id: '2',
        playerName: 'BravePup456',
        score: 38,
        timestamp: Date.now() - 7200000,
        seed: getDailySeed(),
        flag: '🇬🇧',
        gameMode: 'classic',
        verified: true
      },
      {
        id: '3',
        playerName: 'CleverCanine789',
        score: 35,
        timestamp: Date.now() - 10800000,
        seed: getDailySeed(),
        flag: '🇨🇦',
        gameMode: 'classic',
        verified: true
      }
    ]]
  ]),
  alltime: [
    {
      id: 'a1',
      playerName: 'MightyHound999',
      score: 156,
      timestamp: Date.now() - 86400000,
      seed: '',
      flag: '🇯🇵',
      gameMode: 'classic',
      verified: true
    },
    {
      id: 'a2',
      playerName: 'QuickWolf888',
      score: 142,
      timestamp: Date.now() - 172800000,
      seed: '',
      flag: '🇩🇪',
      gameMode: 'rhythm',
      verified: true
    },
    {
      id: 'a3',
      playerName: 'HappyBeagle777',
      score: 128,
      timestamp: Date.now() - 259200000,
      seed: '',
      flag: '🇫🇷',
      gameMode: 'classic',
      verified: true
    },
    {
      id: 'a4',
      playerName: 'LuckyShiba666',
      score: 115,
      timestamp: Date.now() - 345600000,
      seed: '',
      flag: '🇰🇷',
      gameMode: 'checkpoint',
      verified: true
    },
    {
      id: 'a5',
      playerName: 'NobleCollie555',
      score: 98,
      timestamp: Date.now() - 432000000,
      seed: '',
      flag: '🇦🇺',
      gameMode: 'classic',
      verified: true
    }
  ] as LeaderboardEntry[]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { type = 'alltime', limit = '50', offset = '0', gameMode } = req.query;
    
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
    const offsetNum = Math.max(parseInt(offset as string, 10) || 0, 0);
    
    let entries: LeaderboardEntry[] = [];
    
    if (type === 'daily') {
      const today = getTodayString();
      entries = mockLeaderboards.daily.get(today) || [];
    } else {
      entries = [...mockLeaderboards.alltime];
    }
    
    // Filter by game mode if specified
    if (gameMode && gameMode !== 'all') {
      entries = entries.filter(entry => entry.gameMode === gameMode);
    }
    
    // Apply pagination
    const paginatedEntries = entries.slice(offsetNum, offsetNum + limitNum);
    
    // Add rank information
    const entriesWithRank = paginatedEntries.map((entry, index) => ({
      ...entry,
      rank: offsetNum + index + 1,
      // Remove sensitive data
      id: undefined,
      timestamp: formatTimestamp(entry.timestamp)
    }));
    
    // Get statistics
    const stats = {
      totalEntries: entries.length,
      topScore: entries.length > 0 ? entries[0].score : 0,
      averageScore: entries.length > 0 ? 
        Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length) : 0,
      lastUpdated: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      type,
      entries: entriesWithRank,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: entries.length,
        hasMore: offsetNum + limitNum < entries.length
      },
      stats
    });
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
}

function getDailySeed(): string {
  const today = new Date();
  return `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
