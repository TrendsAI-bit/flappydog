/**
 * FlappyDog - Main Game Engine
 * A next-level Flappy-style web game with rhythm gameplay and cozy polish
 */

import './styles.css';
import { SimpleAudioManager } from './simple-audio';
import { UIManager } from './ui';
import { LeaderboardManager } from './leaderboard';
import { SPRITES } from './assets';
import { updateFavicon, generateOGImage } from './generate-assets';

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRAVITY = 0.6;
const FLAP_POWER = -12;
const GLIDE_GRAVITY_MULTIPLIER = 0.3;
const DASH_POWER = 8;
const DASH_COOLDOWN = 8000; // 8 seconds
const WIND_STRENGTH = 0.15;

// Game state types
type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'settings';
type GameMode = 'classic' | 'rhythm' | 'checkpoint';

interface Vector2 {
    x: number;
    y: number;
}

interface GameObject {
    position: Vector2;
    velocity: Vector2;
    width: number;
    height: number;
    active: boolean;
}

interface Dog extends GameObject {
    rotation: number;
    flapAnimation: number;
    blinkTimer: number;
    invulnerable: boolean;
    superWagActive: boolean;
}

interface Obstacle extends GameObject {
    passed: boolean;
    gapY: number;
    gapSize: number;
}

interface Collectible extends GameObject {
    type: 'bone' | 'coin' | 'checkpoint';
    value: number;
    collected: boolean;
}

interface WindGust {
    strength: number;
    direction: Vector2;
    duration: number;
    elapsed: number;
}

interface Quest {
    id: string;
    description: string;
    progress: number;
    target: number;
    completed: boolean;
    reward: string;
}

// Game settings
interface GameSettings {
    soundVolume: number;
    musicVolume: number;
    haptics: boolean;
    colorblind: boolean;
    highContrast: boolean;
    leftHandMode: boolean;
    motionReduced: boolean;
    screenShake: boolean;
    rhythmAssist: boolean;
}

class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private deltaTime: number = 0;
    private gameState: GameState = 'menu';
    private gameMode: GameMode = 'classic';
    
    // Game objects
    private dog: Dog;
    private obstacles: Obstacle[] = [];
    private collectibles: Collectible[] = [];
    private particles: Array<{
        position: Vector2;
        velocity: Vector2;
        life: number;
        maxLife: number;
        color: string;
        size: number;
    }> = [];
    
    // Game state
    private score: number = 0;
    private bestScore: number = 0;
    private superWagMeter: number = 0;
    private dashCooldown: number = 0;
    private wind: WindGust | null = null;
    private perfectBeatStreak: number = 0;
    private bulletTimeRemaining: number = 0;
    
    // Input handling
    private keys: Set<string> = new Set();
    private mousePressed: boolean = false;
    private touchPressed: boolean = false;
    private lastTapTime: number = 0;
    private doubleTapWindow: number = 300;
    
    // Managers
    private audioManager: SimpleAudioManager;
    private uiManager: UIManager;
    private leaderboardManager: LeaderboardManager;
    
    // Assets
    private sprites: Map<string, HTMLImageElement> = new Map();
    private spritesLoaded: number = 0;
    private totalSprites: number = 0;
    private assetsLoadedCalled: boolean = false;
    
    // Settings
    private settings: GameSettings = {
        soundVolume: 0.7,
        musicVolume: 0.5,
        haptics: true,
        colorblind: false,
        highContrast: false,
        leftHandMode: false,
        motionReduced: false,
        screenShake: true,
        rhythmAssist: true
    };
    
    // Adaptive difficulty
    private recentFailures: number = 0;
    private difficultyMultiplier: number = 1.0;
    
    // Daily seed and ghost
    private dailySeed: string = '';
    private ghostData: Array<{time: number, position: Vector2}> = [];
    private recordingGhost: boolean = false;
    
    // Quests
    private _activeQuests: Quest[] = [];
    private _completedCosmetics: Set<string> = new Set();
    
    // Performance
    private frameCount: number = 0;
    private fps: number = 60;
    private _targetFps: number = 60;
    
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        // Initialize managers
        this.audioManager = new SimpleAudioManager();
        this.uiManager = new UIManager();
        this.leaderboardManager = new LeaderboardManager();
        
        // Initialize game objects
        this.dog = this.createDog();
        
        // Set up canvas
        this.setupCanvas();
        
        // Load settings
        this.loadSettings();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Generate daily seed
        this.generateDailySeed();
        
        // Initialize quests
        this.initializeQuests();
        
        // Update favicon with generated icon
        updateFavicon();
        
        // Generate and set OG image
        this.generateSocialImage();
        
        // Start loading assets
        this.loadAssets();
    }
    
    private setupCanvas(): void {
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;
        
        // Scale canvas for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // Set canvas style
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.display = 'block';
        this.canvas.style.imageRendering = 'pixelated';
    }
    
    private createDog(): Dog {
        return {
            position: { x: GAME_WIDTH * 0.2, y: GAME_HEIGHT * 0.5 },
            velocity: { x: 0, y: 0 },
            width: 48,
            height: 32,
            active: true,
            rotation: 0,
            flapAnimation: 0,
            blinkTimer: 0,
            invulnerable: false,
            superWagActive: false
        };
    }
    
    private setupEventListeners(): void {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            this.handleInput(e.code);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.mousePressed = true;
            this.handleInput('mouse');
        });
        
        window.addEventListener('mouseup', () => {
            this.mousePressed = false;
        });
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchPressed = true;
            const now = Date.now();
            
            // Check for double tap
            if (now - this.lastTapTime < this.doubleTapWindow) {
                this.handleDoubleTap();
            }
            this.lastTapTime = now;
            
            this.handleInput('touch');
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchPressed = false;
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Handle page visibility for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._targetFps = 30;
                if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                }
            } else {
                this._targetFps = 60;
            }
        });
    }
    
    private handleInput(input: string): void {
        if (this.gameState === 'menu') {
            this.startGame();
            return;
        }
        
        if (this.gameState === 'playing') {
            if (input === 'Space' || input === 'ArrowUp' || input === 'mouse' || input === 'touch') {
                this.flap();
            }
            
            if (input === 'Escape') {
                this.pauseGame();
            }
        }
        
        if (this.gameState === 'paused') {
            if (input === 'Space' || input === 'mouse' || input === 'touch') {
                this.resumeGame();
            }
        }
        
        if (this.gameState === 'gameover') {
            if (input === 'Space' || input === 'mouse' || input === 'touch') {
                this.restartGame();
            }
        }
    }
    
    private handleDoubleTap(): void {
        if (this.gameState === 'playing' && this.dashCooldown <= 0) {
            this.dash();
        }
    }
    
    private flap(): void {
        if (this.bulletTimeRemaining > 0) {
            // Super Wag mode - more powerful flap
            this.dog.velocity.y = FLAP_POWER * 1.3;
        } else {
            this.dog.velocity.y = FLAP_POWER;
        }
        
        this.dog.flapAnimation = 0.3;
        this.dog.rotation = -30;
        
        // Check for perfect beat in rhythm mode
        if (this.gameMode === 'rhythm') {
            const beatPerfect = this.audioManager.isOnBeat();
            if (beatPerfect) {
                this.perfectBeatStreak++;
                this.addParticles(this.dog.position, 'gold', 5);
                this.score += 1; // Bonus point for perfect beat
            } else {
                this.perfectBeatStreak = 0;
            }
        }
        
        // Add super wag meter
        this.superWagMeter = Math.min(100, this.superWagMeter + 10);
        
        // Trigger bark pulse if meter is full and spacebar held
        if (this.superWagMeter >= 100 && this.keys.has('Space')) {
            this._barkPulse();
        }
        
        // Screen shake
        if (this.settings.screenShake && !this.settings.motionReduced) {
            this.addScreenShake(2);
        }
        
        // Haptic feedback
        if (this.settings.haptics && 'vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        // Play sound
        this.audioManager.playSound('flap');
        
        // Add flap particles
        this.addParticles(this.dog.position, 'white', 3);
    }
    
    private dash(): void {
        this.dog.velocity.x = DASH_POWER;
        this.dashCooldown = DASH_COOLDOWN;
        
        // Add dash particles
        this.addParticles(this.dog.position, 'blue', 8);
        
        // Screen shake
        if (this.settings.screenShake && !this.settings.motionReduced) {
            this.addScreenShake(5);
        }
        
        // Haptic feedback
        if (this.settings.haptics && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        
        this.audioManager.playSound('dash');
    }
    
    private _barkPulse(): void {
        if (this.superWagMeter >= 100) {
            // Activate bullet time
            this.bulletTimeRemaining = 2000; // 2 seconds
            this.dog.invulnerable = true;
            this.dog.superWagActive = true;
            this.superWagMeter = 0;
            
            // Push nearby obstacles
            this.obstacles.forEach(obstacle => {
                const distance = this.getDistance(this.dog.position, obstacle.position);
                if (distance < 150) {
                    const direction = this.normalize({
                        x: obstacle.position.x - this.dog.position.x,
                        y: obstacle.position.y - this.dog.position.y
                    });
                    obstacle.position.x += direction.x * 20;
                    obstacle.position.y += direction.y * 10;
                }
            });
            
            // Attract nearby coins
            this.collectibles.forEach(collectible => {
                if (collectible.type === 'coin' && !collectible.collected) {
                    const distance = this.getDistance(this.dog.position, collectible.position);
                    if (distance < 100) {
                        const direction = this.normalize({
                            x: this.dog.position.x - collectible.position.x,
                            y: this.dog.position.y - collectible.position.y
                        });
                        collectible.velocity.x = direction.x * 5;
                        collectible.velocity.y = direction.y * 5;
                    }
                }
            });
            
            // Add bark particles
            this.addParticles(this.dog.position, 'yellow', 15);
            
            this.audioManager.playSound('bark');
        }
    }
    
    private startGame(): void {
        this.gameState = 'playing';
        this.score = 0;
        this.superWagMeter = 0;
        this.dashCooldown = 0;
        this.perfectBeatStreak = 0;
        this.bulletTimeRemaining = 0;
        
        // Reset dog
        this.dog = this.createDog();
        
        // Clear objects
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        
        // Start recording ghost if daily mode
        if (this.dailySeed) {
            this.recordingGhost = true;
            this.ghostData = [];
        }
        
        // Start background music
        if (this.gameMode === 'rhythm') {
            this.audioManager.playMusic('rhythm1');
        } else {
            this.audioManager.playMusic('ambient');
        }
    }
    
    private pauseGame(): void {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.audioManager.pauseMusic();
        }
    }
    
    private resumeGame(): void {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.audioManager.resumeMusic();
        }
    }
    
    private restartGame(): void {
        this.gameState = 'menu';
        this.audioManager.stopMusic();
        this.uiManager.showMenu();
    }
    
    private gameOver(): void {
        this.gameState = 'gameover';
        this.audioManager.stopMusic();
        this.audioManager.playSound('gameover');
        
        // Screen reader announcement
        this.announceToScreenReader(`Game Over! Final score: ${this.score}`);
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveSettings();
            
            // Announce new record
            this.announceToScreenReader(`New personal best! Score: ${this.score}`);
            
            // Confetti for new record
            this.addParticles({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 }, 'rainbow', 20);
        }
        
        // Update adaptive difficulty
        if (this.score < 10) {
            this.recentFailures++;
        } else {
            this.recentFailures = Math.max(0, this.recentFailures - 1);
        }
        
        this.updateDifficultyMultiplier();
        
        // Submit to leaderboard
        // this.leaderboardManager.submitScore(this.score, this.dailySeed, this.ghostData);
        
        // Show game over UI
        this.uiManager.showGameOver(this.score, this.bestScore);
        
        // Update quests
        this.updateQuests();
    }
    
    private announceToScreenReader(message: string): void {
        const srElement = document.getElementById('sr-instructions');
        if (srElement) {
            srElement.textContent = message;
            
            // Clear after a delay to allow for new announcements
            setTimeout(() => {
                if (srElement.textContent === message) {
                    srElement.textContent = '';
                }
            }, 3000);
        }
    }
    
    private updateDifficultyMultiplier(): void {
        if (this.recentFailures >= 3) {
            this.difficultyMultiplier = Math.max(0.7, this.difficultyMultiplier - 0.1);
        } else if (this.recentFailures === 0 && this.score > 20) {
            this.difficultyMultiplier = Math.min(1.3, this.difficultyMultiplier + 0.05);
        }
    }
    
    private update(deltaTime: number): void {
        if (this.gameState !== 'playing') return;
        
        const dt = this.bulletTimeRemaining > 0 ? deltaTime * 0.6 : deltaTime;
        
        this.updateDog(dt);
        this.updateObstacles(dt);
        this.updateCollectibles(dt);
        this.updateParticles(dt);
        this.updateWind(dt);
        this.updateTimers(dt);
        
        this.checkCollisions();
        this.spawnObjects();
        
        // Record ghost data
        if (this.recordingGhost) {
            this.ghostData.push({
                time: Date.now(),
                position: { ...this.dog.position }
            });
        }
    }
    
    private updateDog(deltaTime: number): void {
        // Apply gravity
        const gravity = this.isGliding() ? GRAVITY * GLIDE_GRAVITY_MULTIPLIER : GRAVITY;
        this.dog.velocity.y += gravity * (deltaTime / 16.67);
        
        // Apply wind
        if (this.wind) {
            this.dog.velocity.x += this.wind.direction.x * this.wind.strength * (deltaTime / 16.67);
            this.dog.velocity.y += this.wind.direction.y * this.wind.strength * (deltaTime / 16.67);
        }
        
        // Update position
        this.dog.position.x += this.dog.velocity.x * (deltaTime / 16.67);
        this.dog.position.y += this.dog.velocity.y * (deltaTime / 16.67);
        
        // Decay horizontal velocity
        this.dog.velocity.x *= 0.95;
        
        // Update rotation based on velocity
        this.dog.rotation = Math.max(-45, Math.min(45, this.dog.velocity.y * 2));
        
        // Update animations
        this.dog.flapAnimation = Math.max(0, this.dog.flapAnimation - deltaTime / 1000);
        this.dog.blinkTimer += deltaTime;
        
        // Blink every 3 seconds
        if (this.dog.blinkTimer > 3000) {
            this.dog.blinkTimer = 0;
        }
        
        // Boundary checks
        if (this.dog.position.y < 0) {
            this.dog.position.y = 0;
            this.dog.velocity.y = 0;
        }
        
        if (this.dog.position.y > GAME_HEIGHT - this.dog.height) {
            this.gameOver();
        }
    }
    
    private updateObstacles(deltaTime: number): void {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            obstacle.position.x -= 200 * (deltaTime / 1000);
            
            // Check if passed
            if (!obstacle.passed && obstacle.position.x + obstacle.width < this.dog.position.x) {
                obstacle.passed = true;
                this.score++;
                this.audioManager.playSound('score');
                
                // Add score particles
                this.addParticles({ x: obstacle.position.x + obstacle.width, y: obstacle.gapY }, 'green', 3);
            }
            
            // Remove off-screen obstacles
            if (obstacle.position.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    private updateCollectibles(deltaTime: number): void {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            
            if (!collectible.collected) {
                collectible.position.x -= 200 * (deltaTime / 1000);
                collectible.position.x += collectible.velocity.x * (deltaTime / 1000);
                collectible.position.y += collectible.velocity.y * (deltaTime / 1000);
                
                // Decay velocity
                collectible.velocity.x *= 0.98;
                collectible.velocity.y *= 0.98;
            }
            
            // Remove off-screen collectibles
            if (collectible.position.x + collectible.width < 0) {
                this.collectibles.splice(i, 1);
            }
        }
    }
    
    private updateParticles(deltaTime: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.position.x += particle.velocity.x * (deltaTime / 1000);
            particle.position.y += particle.velocity.y * (deltaTime / 1000);
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    private updateWind(deltaTime: number): void {
        // Generate wind with perlin-like noise
        if (!this.wind || this.wind.elapsed >= this.wind.duration) {
            // Create new wind gust
            const angle = (Math.random() - 0.5) * Math.PI; // Random direction
            this.wind = {
                strength: WIND_STRENGTH * (0.5 + Math.random() * 0.5),
                direction: {
                    x: Math.cos(angle),
                    y: Math.sin(angle) * 0.3 // Less vertical wind
                },
                duration: 2000 + Math.random() * 3000,
                elapsed: 0
            };
            
            // Add wind particles when new gust starts
            this.addWindParticles();
        }
        
        if (this.wind) {
            this.wind.elapsed += deltaTime;
            
            // Ease in/out wind strength
            const progress = this.wind.elapsed / this.wind.duration;
            const easing = Math.sin(progress * Math.PI);
            this.wind.strength = WIND_STRENGTH * easing * this.difficultyMultiplier;
        }
    }
    
    private addWindParticles(): void {
        if (!this.wind) return;
        
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * GAME_HEIGHT;
            
            this.particles.push({
                position: { x, y },
                velocity: {
                    x: this.wind.direction.x * 100,
                    y: this.wind.direction.y * 50
                },
                life: 1000 + Math.random() * 500,
                maxLife: 1500,
                color: 'rgba(255, 255, 255, 0.3)',
                size: 1 + Math.random() * 2
            });
        }
    }
    
    private updateTimers(deltaTime: number): void {
        this.dashCooldown = Math.max(0, this.dashCooldown - deltaTime);
        this.bulletTimeRemaining = Math.max(0, this.bulletTimeRemaining - deltaTime);
        
        if (this.bulletTimeRemaining === 0 && this.dog.superWagActive) {
            this.dog.superWagActive = false;
            this.dog.invulnerable = false;
        }
    }
    
    private checkCollisions(): void {
        if (this.dog.invulnerable) return;
        
        // Check obstacle collisions
        for (const obstacle of this.obstacles) {
            if (this.isColliding(this.dog, obstacle)) {
                this.gameOver();
                return;
            }
        }
        
        // Check collectible collisions
        for (const collectible of this.collectibles) {
            if (!collectible.collected && this.isColliding(this.dog, collectible)) {
                this.collectItem(collectible);
            }
        }
    }
    
    private collectItem(collectible: Collectible): void {
        collectible.collected = true;
        
        switch (collectible.type) {
            case 'bone':
                this.superWagMeter = Math.min(100, this.superWagMeter + 20);
                this.audioManager.playSound('bone');
                this.addParticles(collectible.position, 'bone-white', 5);
                break;
                
            case 'coin':
                this.score += collectible.value;
                this.audioManager.playSound('coin');
                this.addParticles(collectible.position, 'gold', 8);
                break;
                
            case 'checkpoint':
                // Save checkpoint state
                this.audioManager.playSound('checkpoint');
                this.addParticles(collectible.position, 'rainbow', 12);
                break;
        }
        
        // Haptic feedback
        if (this.settings.haptics && 'vibrate' in navigator) {
            navigator.vibrate(100);
        }
    }
    
    private spawnObjects(): void {
        // Spawn obstacles
        if (this.obstacles.length === 0 || 
            this.obstacles[this.obstacles.length - 1].position.x < GAME_WIDTH - 300) {
            this.spawnObstacle();
        }
        
        // Spawn collectibles randomly
        if (Math.random() < 0.02 * (this.deltaTime / 16.67)) {
            this.spawnCollectible();
        }
    }
    
    private spawnObstacle(): void {
        const gapSize = 180 * this.difficultyMultiplier;
        const gapY = 100 + Math.random() * (GAME_HEIGHT - 200 - gapSize);
        
        // In rhythm mode, sync spawns to beat
        let spawnX = GAME_WIDTH + 50;
        if (this.gameMode === 'rhythm') {
            const beatTime = this.audioManager.getNextBeatTime();
            spawnX = GAME_WIDTH + (beatTime * 200); // Adjust based on scroll speed
        }
        
        const obstacle: Obstacle = {
            position: { x: spawnX, y: 0 },
            velocity: { x: 0, y: 0 },
            width: 80,
            height: GAME_HEIGHT,
            active: true,
            passed: false,
            gapY: gapY,
            gapSize: gapSize
        };
        
        this.obstacles.push(obstacle);
    }
    
    private spawnCollectible(): void {
        const type = Math.random() < 0.6 ? 'bone' : 'coin';
        const x = GAME_WIDTH + 100 + Math.random() * 200;
        const y = 50 + Math.random() * (GAME_HEIGHT - 100);
        
        let value = 1;
        if (type === 'coin') {
            // Coins near obstacles are worth more
            const nearObstacle = this.obstacles.some(obs => 
                Math.abs(obs.position.x - x) < 150 && 
                Math.abs(obs.gapY - y) < 100
            );
            value = nearObstacle ? 3 : 1;
        }
        
        const collectible: Collectible = {
            position: { x, y },
            velocity: { x: 0, y: 0 },
            width: 24,
            height: 24,
            active: true,
            type: type as 'bone' | 'coin',
            value: value,
            collected: false
        };
        
        this.collectibles.push(collectible);
    }
    
    private render(): void {
        // Clear canvas with solid color to prevent flickering
        this.ctx.fillStyle = '#87CEEB'; // Sky blue
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw simple gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw static background elements
        this.drawParallaxBackground();
        
        // Draw game objects
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
        
        this.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                this.drawCollectible(collectible);
            }
        });
        
        // Draw particles (but limit them to prevent performance issues)
        if (this.particles.length > 50) {
            this.particles = this.particles.slice(0, 50);
        }
        this.particles.forEach(particle => this.drawParticle(particle));
        
        // Draw dog
        this.drawDog();
        
        // Draw UI elements
        this.drawUI();
    }
    
    private getBackgroundGradient(): CanvasGradient {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        
        if (this.settings.highContrast) {
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(1, '#333333');
        } else if (this.settings.colorblind) {
            gradient.addColorStop(0, '#4A90E2');
            gradient.addColorStop(1, '#2C5282');
        } else {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#4682B4');
        }
        
        return gradient;
    }
    
    private drawParallaxBackground(): void {
        if (this.settings.motionReduced) return;
        
        // Draw simple static clouds to avoid flickering
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#FFFFFF';
        
        // Static cloud positions
        const clouds = [
            { x: 100, y: 80, size: 60 },
            { x: 300, y: 120, size: 80 },
            { x: 500, y: 60, size: 70 },
            { x: 650, y: 140, size: 65 },
            { x: 200, y: 200, size: 75 }
        ];
        
        clouds.forEach(cloud => {
            this.drawSimpleCloud(cloud.x, cloud.y, cloud.size);
        });
        
        this.ctx.restore();
    }
    
    private drawSimpleCloud(x: number, y: number, size: number): void {
        // Draw a simple cloud shape
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.3, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.1, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    private drawCloud(x: number, y: number, size: number): void {
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = '#FFFFFF';
        
        // Simple cloud shape
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.3, y, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    private drawWindParticles(): void {
        if (!this.wind || this.settings.motionReduced) return;
        
        // Draw wind direction indicators
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 10; i++) {
            const x = (i * 80 + (Date.now() * 0.1)) % GAME_WIDTH;
            const y = 100 + (i * 50) % (GAME_HEIGHT - 200);
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(
                x + this.wind.direction.x * 20,
                y + this.wind.direction.y * 20
            );
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    private drawObstacle(obstacle: Obstacle): void {
        this.ctx.save();
        
        const obstacleSprite = this.sprites.get('obstacle');
        
        if (obstacleSprite) {
            // Draw sprite-based obstacles
            // Top part
            this.ctx.drawImage(
                obstacleSprite,
                obstacle.position.x,
                0,
                obstacle.width,
                obstacle.gapY
            );
            
            // Bottom part
            this.ctx.drawImage(
                obstacleSprite,
                0, obstacle.gapY + obstacle.gapSize, // Source Y from sprite
                obstacle.width, GAME_HEIGHT - (obstacle.gapY + obstacle.gapSize), // Source dimensions
                obstacle.position.x,
                obstacle.gapY + obstacle.gapSize,
                obstacle.width,
                GAME_HEIGHT - (obstacle.gapY + obstacle.gapSize)
            );
        } else {
            // Fallback to procedural drawing
            this.ctx.fillStyle = this.settings.colorblind ? '#FF6B6B' : '#90EE90';
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 3;
            
            // Top part
            this.drawRoundedRect(
                obstacle.position.x,
                0,
                obstacle.width,
                obstacle.gapY,
                10
            );
            
            // Bottom part
            this.drawRoundedRect(
                obstacle.position.x,
                obstacle.gapY + obstacle.gapSize,
                obstacle.width,
                GAME_HEIGHT - (obstacle.gapY + obstacle.gapSize),
                10
            );
        }
        
        // Add glow effect if dog is near
        const distance = this.getDistance(this.dog.position, {
            x: obstacle.position.x + obstacle.width / 2,
            y: obstacle.gapY + obstacle.gapSize / 2
        });
        
        if (distance < 150) {
            this.ctx.shadowColor = this.dog.superWagActive ? '#FFD700' : '#87CEEB';
            this.ctx.shadowBlur = 10;
        }
        
        this.ctx.restore();
    }
    
    private drawCollectible(collectible: Collectible): void {
        this.ctx.save();
        
        const x = collectible.position.x + collectible.width / 2;
        const y = collectible.position.y + collectible.height / 2;
        
        // Add floating animation
        const floatOffset = Math.sin(Date.now() * 0.005 + x * 0.01) * 3;
        
        this.ctx.translate(x, y + floatOffset);
        
        // Add rotation for coins
        if (collectible.type === 'coin') {
            const rotation = Date.now() * 0.003;
            this.ctx.rotate(rotation);
        }
        
        // Use generated sprites if available
        const spriteKey = collectible.type === 'bone' ? 'bone' : 'coin';
        const sprite = this.sprites.get(spriteKey);
        
        if (sprite) {
            this.ctx.drawImage(
                sprite,
                -collectible.width / 2,
                -collectible.height / 2,
                collectible.width,
                collectible.height
            );
            
            // Add sparkle effect for valuable coins
            if (collectible.type === 'coin' && collectible.value > 1) {
                this.addSparkleEffect();
            }
        } else {
            // Fallback to procedural drawing
            if (collectible.type === 'bone') {
                this.ctx.fillStyle = '#FFF8DC';
                this.ctx.strokeStyle = '#DDD';
                this.drawBone();
            } else if (collectible.type === 'coin') {
                const isValuable = collectible.value > 1;
                this.ctx.fillStyle = isValuable ? '#FFD700' : '#FFA500';
                this.ctx.strokeStyle = isValuable ? '#B8860B' : '#FF8C00';
                this.drawCoin(isValuable);
            }
        }
        
        this.ctx.restore();
    }
    
    private addSparkleEffect(): void {
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Date.now() * 0.01;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 15;
            this.ctx.fillRect(x - 1, y - 1, 2, 2);
        }
    }
    
    private drawBone(): void {
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Bone shape
        this.ctx.ellipse(-8, 0, 4, 8, 0, 0, Math.PI * 2);
        this.ctx.ellipse(8, 0, 4, 8, 0, 0, Math.PI * 2);
        this.ctx.rect(-8, -2, 16, 4);
        
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    private drawCoin(valuable: boolean): void {
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, valuable ? 12 : 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Add shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(-3, -3, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (valuable) {
            // Add sparkles for valuable coins
            this.ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + Date.now() * 0.01;
                const x = Math.cos(angle) * 15;
                const y = Math.sin(angle) * 15;
                this.ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        }
    }
    
    private drawDog(): void {
        this.ctx.save();
        
        const x = this.dog.position.x + this.dog.width / 2;
        const y = this.dog.position.y + this.dog.height / 2;
        
        this.ctx.translate(x, y);
        this.ctx.rotate((this.dog.rotation * Math.PI) / 180);
        
        // Squash effect during flap
        const squash = 1 - this.dog.flapAnimation * 0.3;
        this.ctx.scale(1, squash);
        
        // Super wag glow effect
        if (this.dog.superWagActive) {
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 20;
        }
        
        // Invulnerability flashing
        if (this.dog.invulnerable) {
            this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        }
        
        // Draw dog sprite or fallback
        const dogSprite = this.sprites.get('dog');
        if (dogSprite) {
            const frame = Math.floor(this.dog.flapAnimation * 3) % 3;
            this.ctx.drawImage(
                dogSprite,
                frame * 48, 0, 48, 32,
                -this.dog.width / 2, -this.dog.height / 2,
                this.dog.width, this.dog.height
            );
        } else {
            this.drawFallbackDog();
        }
        
        this.ctx.restore();
    }
    
    private drawFallbackDog(): void {
        // Fallback pixel dog drawing
        this.ctx.fillStyle = '#D2B48C'; // Dog brown
        this.ctx.fillRect(-24, -16, 48, 32);
        
        // Eye
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(8, -8, 8, 8);
        
        // Pupil
        this.ctx.fillStyle = '#000000';
        const blinkProgress = Math.max(0, 1 - Math.abs(this.dog.blinkTimer - 150) / 50);
        const eyeHeight = 4 * (1 - blinkProgress);
        this.ctx.fillRect(10, -6, 4, eyeHeight);
        
        // Nose
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(20, -2, 4, 4);
        
        // Ear
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(-20, -12, 12, 8);
    }
    
    private drawParticle(particle: any): void {
        this.ctx.save();
        
        const alpha = particle.life / particle.maxLife;
        this.ctx.globalAlpha = alpha;
        
        if (particle.color === 'rainbow') {
            const hue = (Date.now() * 0.5 + particle.position.x) % 360;
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        } else {
            this.ctx.fillStyle = particle.color;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    private drawUI(): void {
        this.ctx.save();
        this.ctx.font = '24px monospace';
        this.ctx.fillStyle = this.settings.highContrast ? '#FFFFFF' : '#000000';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        
        // Score
        const scoreText = `Score: ${this.score}`;
        this.ctx.strokeText(scoreText, 20, 40);
        this.ctx.fillText(scoreText, 20, 40);
        
        // Best score
        if (this.bestScore > 0) {
            const bestText = `Best: ${this.bestScore}`;
            this.ctx.strokeText(bestText, 20, 70);
            this.ctx.fillText(bestText, 20, 70);
        }
        
        // Super wag meter
        this.drawSuperWagMeter();
        
        // Dash cooldown
        if (this.dashCooldown > 0) {
            this.drawDashCooldown();
        }
        
        // Perfect beat streak in rhythm mode
        if (this.gameMode === 'rhythm' && this.perfectBeatStreak > 0) {
            this.drawBeatStreak();
        }
        
        // Bullet time indicator
        if (this.bulletTimeRemaining > 0) {
            this.drawBulletTimeIndicator();
        }
        
        this.ctx.restore();
    }
    
    private drawSuperWagMeter(): void {
        const x = GAME_WIDTH - 120;
        const y = 30;
        const width = 100;
        const height = 10;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x, y, width, height);
        
        // Fill
        const fillWidth = (this.superWagMeter / 100) * width;
        this.ctx.fillStyle = this.superWagMeter >= 100 ? '#FFD700' : '#FFA500';
        this.ctx.fillRect(x, y, fillWidth, height);
        
        // Border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Label
        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('SUPER WAG', x, y - 5);
    }
    
    private drawDashCooldown(): void {
        const x = GAME_WIDTH - 120;
        const y = 60;
        const progress = 1 - (this.dashCooldown / DASH_COOLDOWN);
        
        this.ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(x + 50, y, 15, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        this.ctx.lineTo(x + 50, y);
        this.ctx.fill();
        
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DASH', x + 50, y + 25);
        this.ctx.textAlign = 'left';
    }
    
    private drawBeatStreak(): void {
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#B8860B';
        this.ctx.lineWidth = 2;
        
        const text = `♪ ${this.perfectBeatStreak} STREAK ♪`;
        const x = GAME_WIDTH / 2 - this.ctx.measureText(text).width / 2;
        
        this.ctx.strokeText(text, x, 100);
        this.ctx.fillText(text, x, 100);
    }
    
    private drawBulletTimeIndicator(): void {
        const progress = this.bulletTimeRemaining / 2000;
        
        // Screen tint
        this.ctx.fillStyle = `rgba(255, 215, 0, ${0.1 * progress})`;
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Progress bar
        const x = 50;
        const y = GAME_HEIGHT - 50;
        const width = GAME_WIDTH - 100;
        const height = 8;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x, y, width * progress, height);
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Label
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText('BULLET TIME', x, y - 10);
    }
    
    private drawDebugInfo(): void {
        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = '#00FF00';
        
        const debugInfo = [
            `FPS: ${this.fps}`,
            `Difficulty: ${this.difficultyMultiplier.toFixed(2)}`,
            `Wind: ${this.wind ? this.wind.strength.toFixed(2) : 'None'}`,
            `Objects: ${this.obstacles.length + this.collectibles.length}`,
            `Particles: ${this.particles.length}`
        ];
        
        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 20, GAME_HEIGHT - 100 + (index * 15));
        });
    }
    
    private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    // Utility methods
    private isGliding(): boolean {
        return this.keys.has('Space') || this.mousePressed || this.touchPressed;
    }
    
    private isColliding(a: GameObject, b: GameObject): boolean {
        // Use forgiving hitboxes (1-2px overlap allowed)
        const tolerance = 2;
        return (
            a.position.x + tolerance < b.position.x + b.width &&
            a.position.x + a.width - tolerance > b.position.x &&
            a.position.y + tolerance < b.position.y + b.height &&
            a.position.y + a.height - tolerance > b.position.y
        );
    }
    
    private getDistance(a: Vector2, b: Vector2): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    private normalize(vector: Vector2): Vector2 {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: vector.x / length, y: vector.y / length };
    }
    
    private addParticles(position: Vector2, color: string, count: number): void {
        for (let i = 0; i < count; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                position: { ...position },
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                life: 500 + Math.random() * 1000,
                maxLife: 1500,
                color: color,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    private addScreenShake(intensity: number): void {
        if (!this.settings.screenShake || this.settings.motionReduced) return;
        
        // Simple screen shake implementation
        const shakeX = (Math.random() - 0.5) * intensity;
        const shakeY = (Math.random() - 0.5) * intensity;
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        // Reset after short duration
        setTimeout(() => {
            this.ctx.restore();
        }, 100);
    }
    
    private generateDailySeed(): void {
        const today = new Date();
        this.dailySeed = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    }
    
    private initializeQuests(): void {
        this._activeQuests = [
            {
                id: 'flap_master',
                description: 'Pass 10 gates without gliding',
                progress: 0,
                target: 10,
                completed: false,
                reward: 'Golden Collar'
            },
            {
                id: 'coin_collector',
                description: 'Collect 5 coins in one run',
                progress: 0,
                target: 5,
                completed: false,
                reward: 'Sparkle Trail'
            },
            {
                id: 'rhythm_master',
                description: 'Get 15 perfect beats in rhythm mode',
                progress: 0,
                target: 15,
                completed: false,
                reward: 'Beat Wings'
            }
        ];
    }
    
    private updateQuests(): void {
        // Update quest progress based on game events
        this._activeQuests.forEach(quest => {
            if (quest.completed) return;
            
            switch (quest.id) {
                case 'flap_master':
                    // Track gates passed without gliding
                    if (this.score >= quest.progress + 1 && !this.isGliding()) {
                        quest.progress = Math.min(quest.target, quest.progress + 1);
                    }
                    break;
                    
                case 'coin_collector':
                    // Track coins collected in current run
                    const coinsCollected = this.collectibles.filter(c => c.collected && c.type === 'coin').length;
                    quest.progress = Math.min(quest.target, coinsCollected);
                    break;
                    
                case 'rhythm_master':
                    // Track perfect beats in rhythm mode
                    if (this.gameMode === 'rhythm') {
                        quest.progress = Math.min(quest.target, this.perfectBeatStreak);
                    }
                    break;
            }
            
            // Check if quest is completed
            if (quest.progress >= quest.target && !quest.completed) {
                quest.completed = true;
                this.completeQuest(quest);
            }
        });
    }
    
    private completeQuest(quest: Quest): void {
        // Show completion notification
        this.uiManager.showToast(`🎉 Quest Complete: ${quest.reward}!`, 'success', 5000);
        
        // Unlock cosmetic reward
        this.uiManager.unlockCosmetic(quest.reward.toLowerCase().replace(' ', '_'));
        
        // Play completion sound
        this.audioManager.playSound('quest_complete');
        
        // Add celebration particles
        this.addParticles({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 }, 'rainbow', 20);
        
        // Save progress
        this.saveSettings();
    }
    
    private loadAssets(): void {
        console.log('Starting asset loading...');
        
        // Add a timeout to ensure loading doesn't hang forever
        setTimeout(() => {
            console.log('Asset loading timeout - forcing completion');
            this.onAssetsLoaded();
        }, 3000); // 3 second timeout
        
        const assetList = Object.keys(SPRITES);
        this.totalSprites = assetList.length;
        
        console.log(`Loading ${this.totalSprites} assets:`, assetList);
        
        // If no assets, load immediately
        if (this.totalSprites === 0) {
            console.log('No assets to load, proceeding immediately');
            this.onAssetsLoaded();
            return;
        }
        
        assetList.forEach(assetName => {
            const img = new Image();
            img.onload = () => {
                console.log(`Loaded asset: ${assetName}`);
                this.sprites.set(assetName, img);
                this.spritesLoaded++;
                
                if (this.spritesLoaded === this.totalSprites) {
                    console.log('All assets loaded successfully');
                    this.onAssetsLoaded();
                }
            };
            
            img.onerror = (error) => {
                console.warn(`Failed to load generated asset: ${assetName}`, error);
                this.spritesLoaded++;
                
                if (this.spritesLoaded === this.totalSprites) {
                    console.log('Asset loading complete (with some failures)');
                    this.onAssetsLoaded();
                }
            };
            
            // Use generated sprites
            try {
                img.src = SPRITES[assetName as keyof typeof SPRITES];
                console.log(`Set src for ${assetName}`);
            } catch (error) {
                console.error(`Error setting src for ${assetName}:`, error);
                this.spritesLoaded++;
                if (this.spritesLoaded === this.totalSprites) {
                    this.onAssetsLoaded();
                }
            }
        });
    }
    
    private onAssetsLoaded(): void {
        if (this.assetsLoadedCalled) {
            console.log('onAssetsLoaded already called, skipping');
            return;
        }
        this.assetsLoadedCalled = true;
        
        console.log('onAssetsLoaded called - initializing game');
        
        try {
            // Initialize managers with loaded assets
            // Audio manager initializes itself in constructor
            this.uiManager.initialize(this.canvas);
            this.leaderboardManager.initialize();
            
            // Hide loading screen and show game
            const loading = document.getElementById('loading');
            const overlay = document.getElementById('uiOverlay');
            
            if (loading) {
                loading.classList.add('hidden');
                console.log('Loading screen hidden');
            }
            
            this.canvas.classList.remove('hidden');
            console.log('Canvas shown');
            
            if (overlay) {
                overlay.classList.remove('hidden');
                console.log('UI overlay shown');
            }
            
            // Show main menu
            this.uiManager.showMenu();
            console.log('Main menu shown');
            
            // Start game loop
            this.gameLoop();
            console.log('Game loop started');
        } catch (error) {
            console.error('Error in onAssetsLoaded:', error);
        }
    }
    
    private loadSettings(): void {
        const saved = localStorage.getItem('flappydog-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        const savedBest = localStorage.getItem('flappydog-bestscore');
        if (savedBest) {
            this.bestScore = parseInt(savedBest, 10);
        }
    }
    
    private saveSettings(): void {
        localStorage.setItem('flappydog-settings', JSON.stringify(this.settings));
        localStorage.setItem('flappydog-bestscore', this.bestScore.toString());
    }
    
    private generateSocialImage(): void {
        // Generate OG image for social sharing
        const ogImageUrl = generateOGImage();
        
        // Update OG meta tag
        let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (ogImage) {
            ogImage.content = ogImageUrl;
        } else {
            ogImage = document.createElement('meta');
            ogImage.setAttribute('property', 'og:image');
            ogImage.content = ogImageUrl;
            document.head.appendChild(ogImage);
        }
        
        // Update Twitter card
        let twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
        if (twitterImage) {
            twitterImage.content = ogImageUrl;
        } else {
            twitterImage = document.createElement('meta');
            twitterImage.setAttribute('name', 'twitter:image');
            twitterImage.content = ogImageUrl;
            document.head.appendChild(twitterImage);
        }
    }
    
    private gameLoop = (currentTime: number = 0): void => {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent spiral of death
        this.deltaTime = Math.min(this.deltaTime, 50);
        
        // Update FPS counter
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1000 / (this.deltaTime || 16.67));
        }
        
        // Update game logic
        this.update(this.deltaTime);
        
        // Render frame
        this.render();
        
        // Schedule next frame
        requestAnimationFrame(this.gameLoop);
    };
    
    // Public methods for UI interaction
    public setGameMode(mode: GameMode): void {
        this.gameMode = mode;
    }
    
    public updateSettings(newSettings: Partial<GameSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }
    
    public getSettings(): GameSettings {
        return { ...this.settings };
    }
    
    public getDailyScore(): { score: number; seed: string } {
        return { score: this.score, seed: this.dailySeed };
    }
    
    public uploadCustomSprite(file: File): void {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.sprites.set('dog', img);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GameEngine();
});

// Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
