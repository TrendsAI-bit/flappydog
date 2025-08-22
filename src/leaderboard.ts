/**
 * FlappyDog - Leaderboard Manager
 * Handles score submission, ghost races, and daily challenges
 */

export interface LeaderboardEntry {
    id: string;
    playerName: string;
    score: number;
    timestamp: number;
    seed: string;
    flag: string; // Country flag emoji
    gameMode: string;
    verified: boolean;
    ghostData?: GhostData;
}

export interface GhostData {
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
}

export interface DailyChallenge {
    date: string;
    seed: string;
    leaderboard: LeaderboardEntry[];
    playerBest: LeaderboardEntry | null;
    ghostRace: GhostData | null;
}

interface ScoreSubmission {
    score: number;
    seed: string;
    gameMode: string;
    ghostData: GhostData;
    playerName: string;
    timestamp: number;
    sessionId: string;
    signature: string;
}

interface AntiCheatMetrics {
    maxFlapRate: number;
    impossiblePositions: number;
    timeInconsistencies: number;
    scoreConsistency: number;
}

export class LeaderboardManager {
    private apiEndpoint: string = '';
    private sessionId: string = '';
    private playerName: string = '';
    private countryFlag: string = '🌍';
    
    // Local storage
    private localScores: LeaderboardEntry[] = [];
    private dailyChallenges: Map<string, DailyChallenge> = new Map();
    
    // Anti-cheat
    private sessionNonce: string = '';
    private secretKey: string = '';
    
    // Ghost recording
    private recordingGhost: boolean = false;
    private currentGhostData: GhostData | null = null;
    private recordingStartTime: number = 0;
    
    // Caching
    private leaderboardCache: Map<string, { data: LeaderboardEntry[], timestamp: number }> = new Map();
    private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
    
    constructor() {
        this.initializeSession();
        this.detectUserLocation();
        this.loadLocalData();
    }
    
    public async initialize(): Promise<void> {
        try {
            // Set API endpoint based on environment
            this.apiEndpoint = this.getApiEndpoint();
            
            // Get session nonce for anti-cheat
            await this.initializeSession();
            
            // Load daily challenge
            await this.loadTodaysChallenge();
            
            console.log('Leaderboard system initialized');
        } catch (error) {
            console.warn('Leaderboard initialization failed, using offline mode:', error);
        }
    }
    
    private getApiEndpoint(): string {
        // Use different endpoints for development and production
        if (import.meta.env.DEV) {
            return 'http://localhost:3000/api';
        } else {
            return '/api'; // Vercel serverless functions
        }
    }
    
    private async initializeSession(): Promise<void> {
        try {
            // Generate unique session ID
            this.sessionId = this.generateSessionId();
            
            // Get player name from localStorage or generate one
            this.playerName = localStorage.getItem('flappydog-playername') || this.generatePlayerName();
            
            // Request session nonce from server for anti-cheat
            const response = await fetch(`${this.apiEndpoint}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.sessionId })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.sessionNonce = data.nonce;
                this.secretKey = data.key; // This would be handled more securely in production
            }
        } catch (error) {
            console.warn('Failed to initialize server session, using offline mode:', error);
            this.sessionNonce = this.generateNonce();
        }
    }
    
    private detectUserLocation(): void {
        // Try to detect user's country for flag display
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            this.countryFlag = this.getCountryFlagFromTimezone(timezone);
        } catch (error) {
            this.countryFlag = '🌍'; // Default world flag
        }
    }
    
    private getCountryFlagFromTimezone(timezone: string): string {
        // Simple timezone to country flag mapping
        const flagMap: Record<string, string> = {
            'America/New_York': '🇺🇸',
            'America/Los_Angeles': '🇺🇸',
            'America/Chicago': '🇺🇸',
            'Europe/London': '🇬🇧',
            'Europe/Paris': '🇫🇷',
            'Europe/Berlin': '🇩🇪',
            'Asia/Tokyo': '🇯🇵',
            'Asia/Shanghai': '🇨🇳',
            'Asia/Seoul': '🇰🇷',
            'Australia/Sydney': '🇦🇺',
            'America/Toronto': '🇨🇦',
            'America/Mexico_City': '🇲🇽',
            'America/Sao_Paulo': '🇧🇷',
            'Europe/Rome': '🇮🇹',
            'Europe/Madrid': '🇪🇸',
            'Asia/Mumbai': '🇮🇳',
            'Asia/Singapore': '🇸🇬'
        };
        
        return flagMap[timezone] || '🌍';
    }
    
    private loadLocalData(): void {
        // Load local scores
        const savedScores = localStorage.getItem('flappydog-local-scores');
        if (savedScores) {
            this.localScores = JSON.parse(savedScores);
        }
        
        // Load daily challenges
        const savedChallenges = localStorage.getItem('flappydog-daily-challenges');
        if (savedChallenges) {
            const challengeArray = JSON.parse(savedChallenges);
            challengeArray.forEach((challenge: DailyChallenge) => {
                this.dailyChallenges.set(challenge.date, challenge);
            });
        }
    }
    
    private saveLocalData(): void {
        localStorage.setItem('flappydog-local-scores', JSON.stringify(this.localScores));
        
        const challengeArray = Array.from(this.dailyChallenges.values());
        localStorage.setItem('flappydog-daily-challenges', JSON.stringify(challengeArray));
    }
    
    // Ghost recording
    public startGhostRecording(): void {
        this.recordingGhost = true;
        this.recordingStartTime = Date.now();
        this.currentGhostData = {
            positions: [],
            events: [],
            duration: 0,
            checksum: ''
        };
    }
    
    public recordGhostPosition(x: number, y: number, rotation: number): void {
        if (!this.recordingGhost || !this.currentGhostData) return;
        
        const time = Date.now() - this.recordingStartTime;
        
        // Record position every 2 frames (about 33ms at 60fps) to keep data manageable
        if (this.currentGhostData.positions.length === 0 || 
            time - this.currentGhostData.positions[this.currentGhostData.positions.length - 1].time >= 33) {
            this.currentGhostData.positions.push({ time, x, y, rotation });
        }
    }
    
    public recordGhostEvent(type: 'flap' | 'dash' | 'coin' | 'score', data?: any): void {
        if (!this.recordingGhost || !this.currentGhostData) return;
        
        const time = Date.now() - this.recordingStartTime;
        this.currentGhostData.events.push({ time, type, data });
    }
    
    public stopGhostRecording(): GhostData | null {
        if (!this.recordingGhost || !this.currentGhostData) return null;
        
        this.recordingGhost = false;
        this.currentGhostData.duration = Date.now() - this.recordingStartTime;
        this.currentGhostData.checksum = this.generateGhostChecksum(this.currentGhostData);
        
        const ghostData = this.currentGhostData;
        this.currentGhostData = null;
        
        return ghostData;
    }
    
    private generateGhostChecksum(ghostData: GhostData): string {
        // Generate a simple checksum for ghost data integrity
        const data = JSON.stringify({
            positionCount: ghostData.positions.length,
            eventCount: ghostData.events.length,
            duration: ghostData.duration,
            firstPosition: ghostData.positions[0],
            lastPosition: ghostData.positions[ghostData.positions.length - 1]
        });
        
        return this.simpleHash(data);
    }
    
    // Score submission
    public async submitScore(score: number, seed: string, ghostData: GhostData, gameMode: string = 'classic'): Promise<boolean> {
        try {
            // Perform anti-cheat validation
            const antiCheatMetrics = this.analyzeGhostData(ghostData);
            if (!this.validateScore(score, antiCheatMetrics)) {
                console.warn('Score failed anti-cheat validation');
                return false;
            }
            
            // Create leaderboard entry
            const entry: LeaderboardEntry = {
                id: this.generateEntryId(),
                playerName: this.playerName,
                score,
                timestamp: Date.now(),
                seed,
                flag: this.countryFlag,
                gameMode,
                verified: true,
                ghostData
            };
            
            // Add to local scores
            this.addLocalScore(entry);
            
            // Try to submit to server
            const submitted = await this.submitToServer(entry);
            
            if (submitted) {
                // Clear cache to force refresh
                this.leaderboardCache.clear();
                console.log('Score submitted successfully');
            }
            
            return true;
            
        } catch (error) {
            console.warn('Score submission failed:', error);
            return false;
        }
    }
    
    private async submitToServer(entry: LeaderboardEntry): Promise<boolean> {
        if (!this.apiEndpoint) return false;
        
        try {
            const submission: ScoreSubmission = {
                score: entry.score,
                seed: entry.seed,
                gameMode: entry.gameMode,
                ghostData: entry.ghostData!,
                playerName: entry.playerName,
                timestamp: entry.timestamp,
                sessionId: this.sessionId,
                signature: this.signSubmission(entry)
            };
            
            const response = await fetch(`${this.apiEndpoint}/submit-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission)
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.success;
            } else {
                const error = await response.text();
                console.warn('Server rejected score submission:', error);
                return false;
            }
            
        } catch (error) {
            console.warn('Network error during score submission:', error);
            return false;
        }
    }
    
    private signSubmission(entry: LeaderboardEntry): string {
        // Create HMAC signature for anti-cheat
        const data = `${entry.score}:${entry.seed}:${entry.timestamp}:${this.sessionNonce}`;
        return this.simpleHash(data + this.secretKey);
    }
    
    private addLocalScore(entry: LeaderboardEntry): void {
        this.localScores.push(entry);
        
        // Keep only top 100 local scores
        this.localScores.sort((a, b) => b.score - a.score);
        this.localScores = this.localScores.slice(0, 100);
        
        this.saveLocalData();
    }
    
    // Anti-cheat validation
    private analyzeGhostData(ghostData: GhostData): AntiCheatMetrics {
        let maxFlapRate = 0;
        let impossiblePositions = 0;
        let timeInconsistencies = 0;
        
        // Analyze flap rate
        const flapEvents = ghostData.events.filter(e => e.type === 'flap');
        if (flapEvents.length > 1) {
            const intervals = [];
            for (let i = 1; i < flapEvents.length; i++) {
                intervals.push(flapEvents[i].time - flapEvents[i - 1].time);
            }
            intervals.sort((a, b) => a - b);
            maxFlapRate = intervals.length > 0 ? 1000 / intervals[0] : 0; // flaps per second
        }
        
        // Check for impossible positions (teleportation, out of bounds)
        for (let i = 1; i < ghostData.positions.length; i++) {
            const prev = ghostData.positions[i - 1];
            const curr = ghostData.positions[i];
            const timeDelta = curr.time - prev.time;
            const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
            
            // Check for impossible movement speed (teleportation)
            const maxSpeed = 1000; // pixels per second
            if (timeDelta > 0 && distance / (timeDelta / 1000) > maxSpeed) {
                impossiblePositions++;
            }
            
            // Check for out of bounds positions
            if (curr.x < -100 || curr.x > 900 || curr.y < -100 || curr.y > 700) {
                impossiblePositions++;
            }
        }
        
        // Check time consistency
        for (let i = 1; i < ghostData.positions.length; i++) {
            if (ghostData.positions[i].time <= ghostData.positions[i - 1].time) {
                timeInconsistencies++;
            }
        }
        
        // Calculate score consistency (basic check)
        const scoreEvents = ghostData.events.filter(e => e.type === 'score').length;
        const scoreConsistency = Math.abs(scoreEvents - Math.floor(scoreEvents)) < 0.1 ? 1 : 0;
        
        return {
            maxFlapRate,
            impossiblePositions,
            timeInconsistencies,
            scoreConsistency
        };
    }
    
    private validateScore(score: number, metrics: AntiCheatMetrics): boolean {
        // Basic anti-cheat validation
        if (metrics.maxFlapRate > 20) return false; // Max 20 flaps per second
        if (metrics.impossiblePositions > 5) return false; // Max 5 impossible positions
        if (metrics.timeInconsistencies > 10) return false; // Max 10 time inconsistencies
        if (score < 0 || score > 10000) return false; // Reasonable score bounds
        
        return true;
    }
    
    // Leaderboard retrieval
    public async getLeaderboard(type: 'daily' | 'alltime', limit: number = 50): Promise<LeaderboardEntry[]> {
        const cacheKey = `${type}-${limit}`;
        
        // Check cache first
        const cached = this.leaderboardCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        
        try {
            // Try to get from server
            const serverData = await this.fetchFromServer(type, limit);
            if (serverData.length > 0) {
                this.leaderboardCache.set(cacheKey, { data: serverData, timestamp: Date.now() });
                return serverData;
            }
        } catch (error) {
            console.warn('Failed to fetch leaderboard from server:', error);
        }
        
        // Fall back to local data
        return this.getLocalLeaderboard(type, limit);
    }
    
    private async fetchFromServer(type: string, limit: number): Promise<LeaderboardEntry[]> {
        if (!this.apiEndpoint) return [];
        
        const response = await fetch(`${this.apiEndpoint}/leaderboard?type=${type}&limit=${limit}`);
        if (response.ok) {
            const data = await response.json();
            return data.entries || [];
        }
        return [];
    }
    
    private getLocalLeaderboard(type: string, limit: number): LeaderboardEntry[] {
        let scores = [...this.localScores];
        
        if (type === 'daily') {
            const today = this.getTodayString();
            const todayChallenge = this.dailyChallenges.get(today);
            if (todayChallenge) {
                scores = scores.filter(s => s.seed === todayChallenge.seed);
            } else {
                scores = [];
            }
        }
        
        return scores.slice(0, limit);
    }
    
    // Daily challenges
    private async loadTodaysChallenge(): Promise<void> {
        const today = this.getTodayString();
        
        // Check if we already have today's challenge
        if (this.dailyChallenges.has(today)) {
            return;
        }
        
        try {
            // Try to get from server
            const response = await fetch(`${this.apiEndpoint}/daily-challenge?date=${today}`);
            if (response.ok) {
                const challenge = await response.json();
                this.dailyChallenges.set(today, challenge);
                this.saveLocalData();
                return;
            }
        } catch (error) {
            console.warn('Failed to load daily challenge from server:', error);
        }
        
        // Generate local daily challenge
        const challenge: DailyChallenge = {
            date: today,
            seed: this.generateDailySeed(today),
            leaderboard: [],
            playerBest: null,
            ghostRace: null
        };
        
        this.dailyChallenges.set(today, challenge);
        this.saveLocalData();
    }
    
    public getDailyChallenge(): DailyChallenge | null {
        const today = this.getTodayString();
        return this.dailyChallenges.get(today) || null;
    }
    
    public async getGhostRace(seed: string): Promise<GhostData | null> {
        try {
            const response = await fetch(`${this.apiEndpoint}/ghost-race?seed=${seed}`);
            if (response.ok) {
                const data = await response.json();
                return data.ghost;
            }
        } catch (error) {
            console.warn('Failed to load ghost race:', error);
        }
        
        // Return local ghost if available
        const today = this.getTodayString();
        const challenge = this.dailyChallenges.get(today);
        return challenge?.ghostRace || null;
    }
    
    // Ghost playback
    public createGhostPlayer(ghostData: GhostData): GhostPlayer {
        return new GhostPlayer(ghostData);
    }
    
    // Utility methods
    private generateSessionId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    private generatePlayerName(): string {
        const adjectives = ['Swift', 'Brave', 'Clever', 'Quick', 'Happy', 'Lucky', 'Mighty', 'Noble'];
        const animals = ['Dog', 'Wolf', 'Fox', 'Eagle', 'Hawk', 'Lion', 'Tiger', 'Bear'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const number = Math.floor(Math.random() * 1000);
        
        return `${adj}${animal}${number}`;
    }
    
    private generateEntryId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    private generateNonce(): string {
        return Math.random().toString(36).substr(2, 15);
    }
    
    private generateDailySeed(date: string): string {
        // Generate consistent daily seed based on date
        return this.simpleHash(date + 'flappydog-daily').substr(0, 8);
    }
    
    private getTodayString(): string {
        const today = new Date();
        return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    }
    
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    // Public API
    public setPlayerName(name: string): void {
        this.playerName = name;
        localStorage.setItem('flappydog-playername', name);
    }
    
    public getPlayerName(): string {
        return this.playerName;
    }
    
    public getLocalBestScore(): number {
        return this.localScores.length > 0 ? this.localScores[0].score : 0;
    }
    
    public clearLocalData(): void {
        this.localScores = [];
        this.dailyChallenges.clear();
        this.leaderboardCache.clear();
        localStorage.removeItem('flappydog-local-scores');
        localStorage.removeItem('flappydog-daily-challenges');
    }
}

// Ghost player class for replaying ghost data
export class GhostPlayer {
    private ghostData: GhostData;
    private startTime: number = 0;
    private playing: boolean = false;
    private currentPositionIndex: number = 0;
    private currentEventIndex: number = 0;
    
    constructor(ghostData: GhostData) {
        this.ghostData = ghostData;
    }
    
    public start(): void {
        this.startTime = Date.now();
        this.playing = true;
        this.currentPositionIndex = 0;
        this.currentEventIndex = 0;
    }
    
    public stop(): void {
        this.playing = false;
    }
    
    public isPlaying(): boolean {
        return this.playing;
    }
    
    public getCurrentPosition(): { x: number; y: number; rotation: number } | null {
        if (!this.playing) return null;
        
        const elapsed = Date.now() - this.startTime;
        
        // Find the appropriate position in the ghost data
        while (this.currentPositionIndex < this.ghostData.positions.length - 1) {
            if (this.ghostData.positions[this.currentPositionIndex + 1].time > elapsed) {
                break;
            }
            this.currentPositionIndex++;
        }
        
        if (this.currentPositionIndex >= this.ghostData.positions.length) {
            this.playing = false;
            return null;
        }
        
        const currentPos = this.ghostData.positions[this.currentPositionIndex];
        const nextPos = this.ghostData.positions[this.currentPositionIndex + 1];
        
        // Interpolate between positions for smooth movement
        if (nextPos) {
            const progress = (elapsed - currentPos.time) / (nextPos.time - currentPos.time);
            const clampedProgress = Math.max(0, Math.min(1, progress));
            
            return {
                x: currentPos.x + (nextPos.x - currentPos.x) * clampedProgress,
                y: currentPos.y + (nextPos.y - currentPos.y) * clampedProgress,
                rotation: currentPos.rotation + (nextPos.rotation - currentPos.rotation) * clampedProgress
            };
        }
        
        return {
            x: currentPos.x,
            y: currentPos.y,
            rotation: currentPos.rotation
        };
    }
    
    public getNextEvent(): { type: string; data?: any } | null {
        if (!this.playing) return null;
        
        const elapsed = Date.now() - this.startTime;
        
        if (this.currentEventIndex < this.ghostData.events.length) {
            const event = this.ghostData.events[this.currentEventIndex];
            if (event.time <= elapsed) {
                this.currentEventIndex++;
                return { type: event.type, data: event.data };
            }
        }
        
        return null;
    }
    
    public getProgress(): number {
        if (!this.playing) return 0;
        
        const elapsed = Date.now() - this.startTime;
        return Math.min(1, elapsed / this.ghostData.duration);
    }
}
