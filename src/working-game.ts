/**
 * FlappyDog - Working Game (Based on Reference)
 * No external assets, all canvas drawing like the reference
 */

interface Dog {
    y: number;
    velocity: number;
}

interface Obstacle {
    x: number;
    gapY: number;
    passed: boolean;
}

export class WorkingFlappyDog {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameState: 'menu' | 'playing' | 'gameOver' = 'menu';
    private score: number = 0;
    private highScore: number = 0;
    private dog: Dog = { y: 150, velocity: 0 };
    private obstacles: Obstacle[] = [];
    private animationId: number | null = null;
    
    // Pixel dog sprite
    private pixelDogImage: HTMLImageElement | null = null;
    private dogImageLoaded: boolean = false;
    
    // Sound effects
    private sounds: { [key: string]: HTMLAudioElement } = {};
    private soundEnabled: boolean = true;

    // Game constants (exactly like reference)
    private readonly CANVAS_WIDTH = 800;
    private readonly CANVAS_HEIGHT = 600;
    private readonly DOG_SIZE = 50; // Made bigger!
    private readonly OBSTACLE_WIDTH = 60;
    private readonly GAP_SIZE = 150;
    private readonly GRAVITY = 0.6;
    private readonly JUMP_STRENGTH = -12;
    private readonly OBSTACLE_SPEED = 3;

    constructor() {
        // Create retro pixel canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.CANVAS_WIDTH;
        this.canvas.height = this.CANVAS_HEIGHT;
        this.canvas.style.border = '4px solid #2c3e50';
        this.canvas.style.borderRadius = '0px'; // No rounded corners for pixel style
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.cursor = 'pointer';
        this.canvas.style.boxShadow = `
            inset 2px 2px 0px #ffffff,
            inset -2px -2px 0px #adb5bd,
            4px 4px 0px #2c3e50
        `;
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 100%)';
        
        this.ctx = this.canvas.getContext('2d')!;
        
        // Load high score
        const saved = localStorage.getItem('flappydog-highscore');
        if (saved) {
            this.highScore = parseInt(saved, 10);
        }
        
        // Set up event listeners
        this.canvas.addEventListener('click', () => this.handleInput());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        // Create beautiful page layout like reference
        document.body.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
            ">
                <!-- Retro Pixel Game Header -->
                <div style="
                    border: 4px solid #2c3e50;
                    border-style: solid;
                    border-image: none;
                    padding: 15px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    width: 800px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 
                        inset 2px 2px 0px #ffffff,
                        inset -2px -2px 0px #adb5bd,
                        4px 4px 0px #2c3e50;
                    image-rendering: pixelated;
                    font-family: 'Courier New', monospace;
                ">
                    <h3 style="
                        margin: 0; 
                        font-size: 20px; 
                        color: #2c3e50; 
                        font-weight: bold;
                        font-family: 'Courier New', monospace;
                        text-shadow: 
                            1px 1px 0px #ffffff,
                            2px 2px 0px #adb5bd;
                        letter-spacing: 2px;
                    ">FLAPPY DOG</h3>
                    <div style="display: flex; gap: 8px;">
                        <button id="soundBtn" style="
                            padding: 10px 14px;
                            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                            color: white;
                            border: 3px solid #1e8449;
                            border-style: solid;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: bold;
                            font-family: 'Courier New', monospace;
                            text-shadow: 1px 1px 0px #1e8449;
                            box-shadow: 
                                inset 1px 1px 0px rgba(255,255,255,0.3),
                                inset -1px -1px 0px rgba(0,0,0,0.3),
                                2px 2px 0px #1e8449;
                            image-rendering: pixelated;
                            letter-spacing: 1px;
                        ">🔊 SOUND</button>
                        <button id="resetBtn" style="
                            padding: 10px 14px;
                            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                            color: white;
                            border: 3px solid #a93226;
                            border-style: solid;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: bold;
                            font-family: 'Courier New', monospace;
                            text-shadow: 1px 1px 0px #a93226;
                            box-shadow: 
                                inset 1px 1px 0px rgba(255,255,255,0.3),
                                inset -1px -1px 0px rgba(0,0,0,0.3),
                                2px 2px 0px #a93226;
                            image-rendering: pixelated;
                            letter-spacing: 1px;
                        ">RESET</button>
                    </div>
                </div>
                
                <!-- Retro Pixel Game Canvas Container -->
                <div id="game-container" style="
                    border: 4px solid #2c3e50;
                    border-top: none;
                    border-bottom: none;
                    background: linear-gradient(45deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 12px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 
                        inset 2px 2px 0px #ffffff,
                        inset -2px -2px 0px #adb5bd;
                    image-rendering: pixelated;
                "></div>
                
                <!-- Retro Pixel Instructions Footer -->
                <div style="
                    border: 4px solid #2c3e50;
                    padding: 15px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    width: 800px;
                    text-align: center;
                    box-shadow: 
                        inset 2px 2px 0px #ffffff,
                        inset -2px -2px 0px #adb5bd,
                        4px 4px 0px #2c3e50;
                    image-rendering: pixelated;
                    font-family: 'Courier New', monospace;
                ">
                    <div id="instructions" style="
                        font-size: 14px;
                        color: #2c3e50;
                        margin-bottom: 8px;
                        font-weight: bold;
                        font-family: 'Courier New', monospace;
                        text-shadow: 1px 1px 0px #ffffff;
                        letter-spacing: 1px;
                    ">CLICK CANVAS OR PRESS SPACE TO START FLYING!</div>
                    <div id="scoreDisplay" style="
                        font-size: 12px;
                        color: #495057;
                        font-family: 'Courier New', monospace;
                        font-weight: bold;
                        text-shadow: 1px 1px 0px #ffffff;
                        letter-spacing: 1px;
                    ">CURRENT: ${this.score} • BEST: ${this.highScore} • NAVIGATE THROUGH THE OBSTACLES!</div>
                </div>
                
                <!-- 🏆 CHALLENGE BANNER 🏆 -->
                <div style="
                    border: 4px solid #f39c12;
                    background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
                    padding: 20px;
                    margin-top: 20px;
                    width: 800px;
                    text-align: center;
                    box-shadow: 
                        inset 2px 2px 0px rgba(255,255,255,0.4),
                        inset -2px -2px 0px rgba(0,0,0,0.2),
                        4px 4px 0px #e67e22;
                    image-rendering: pixelated;
                    font-family: 'Courier New', monospace;
                    animation: glow 2s ease-in-out infinite alternate;
                ">
                    <div style="
                        font-size: 18px;
                        font-weight: bold;
                        color: #2c3e50;
                        text-shadow: 2px 2px 0px rgba(255,255,255,0.7);
                        letter-spacing: 2px;
                        margin-bottom: 15px;
                    ">🏆 CHALLENGE: FIRST TO GET TO 100 GETS 100 SOL! 🏆</div>
                    
                    <div style="
                        background: rgba(44, 62, 80, 0.9);
                        border: 2px solid #2c3e50;
                        border-radius: 4px;
                        padding: 12px;
                        margin: 10px auto;
                        max-width: 700px;
                        box-shadow: inset 1px 1px 0px rgba(255,255,255,0.1);
                    ">
                        <div style="
                            font-size: 14px;
                            color: #f39c12;
                            font-weight: bold;
                            margin-bottom: 8px;
                            letter-spacing: 1px;
                        ">🪙 TOKEN ADDRESS:</div>
                        <div style="
                            font-size: 16px;
                            color: #ffffff;
                            font-weight: bold;
                            word-break: break-all;
                            line-height: 1.4;
                            text-shadow: 1px 1px 0px rgba(0,0,0,0.8);
                            letter-spacing: 1px;
                        ">2sdmMFgmV2oue7Wri4Ums3FJm6T4ASWJTu2uMh3Rpump</div>
                    </div>
                    
                    <div style="
                        font-size: 14px;
                        color: #2c3e50;
                        font-weight: bold;
                        text-shadow: 1px 1px 0px rgba(255,255,255,0.7);
                        letter-spacing: 1px;
                        margin-top: 10px;
                    ">🎮 REACH SCORE 100 TO WIN 100 SOL! 🎮</div>
                </div>
                
                <style>
                    @keyframes glow {
                        from { box-shadow: 
                            inset 2px 2px 0px rgba(255,255,255,0.4),
                            inset -2px -2px 0px rgba(0,0,0,0.2),
                            4px 4px 0px #e67e22,
                            0 0 20px rgba(243, 156, 18, 0.5); }
                        to { box-shadow: 
                            inset 2px 2px 0px rgba(255,255,255,0.4),
                            inset -2px -2px 0px rgba(0,0,0,0.2),
                            4px 4px 0px #e67e22,
                            0 0 30px rgba(243, 156, 18, 0.8); }
                    }
                </style>
            </div>
        `;
        
        document.getElementById('game-container')!.appendChild(this.canvas);
        
        // Reset button handler
        document.getElementById('resetBtn')!.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Sound toggle button handler
        document.getElementById('soundBtn')!.addEventListener('click', () => {
            this.toggleSound();
        });
        
        // Load the pixel dog sprite
        this.loadPixelDog();
        
        // Initialize sounds
        this.initializeSounds();
        
        // Start game loop immediately
        this.gameLoop();
        
        console.log('Working FlappyDog initialized successfully!');
    }

    private loadPixelDog(): void {
        this.pixelDogImage = new Image();
        this.pixelDogImage.onload = () => {
            this.dogImageLoaded = true;
            console.log('Pixel dog sprite loaded!');
        };
        this.pixelDogImage.onerror = () => {
            console.warn('Pixel dog sprite failed to load, using fallback');
            this.dogImageLoaded = false;
        };
        this.pixelDogImage.src = '/pixeldog.png';
    }

    private initializeSounds(): void {
        // Create simple audio context for generating sounds
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Generate simple sound effects
            this.generateSound('flap', audioContext, 200, 0.1, 'sine');
            this.generateSound('score', audioContext, 400, 0.2, 'sine');
            this.generateSound('gameover', audioContext, 150, 0.5, 'sawtooth');
            
            console.log('Sounds initialized successfully!');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.soundEnabled = false;
        }
    }

    private generateSound(name: string, audioContext: AudioContext, frequency: number, duration: number, type: OscillatorType): void {
        // Create a data URL for the generated sound
        const sampleRate = audioContext.sampleRate;
        const numSamples = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            if (type === 'sine') {
                sample = Math.sin(2 * Math.PI * frequency * t);
            } else if (type === 'sawtooth') {
                sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
            }
            
            // Apply envelope
            const envelope = Math.exp(-t * 3);
            channelData[i] = sample * envelope * 0.3;
        }

        // Convert to audio element (simplified approach)
        const audio = new Audio();
        audio.volume = 0.3;
        this.sounds[name] = audio;
    }

    private playSound(soundName: string): void {
        if (!this.soundEnabled) return;
        
        try {
            // Cute 8-bit sounds using Web Audio API (like reference)
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Cute 8-bit square wave sounds like reference
            oscillator.type = 'square'; // 8-bit square wave
            
            switch(soundName) {
                case 'flap':
                    // Cute upward chirp sound
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.08);
                    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.08);
                    break;
                    
                case 'score':
                    // Happy musical chord progression like reference success sound
                    oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08); // E5
                    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16); // G5
                    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.25);
                    break;
                    
                case 'gameover':
                    // Sad descending sound like reference error
                    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.4);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.4);
                    break;
            }
        } catch (error) {
            // Fallback: no sound
            console.warn('Could not play sound:', error);
        }
    }

    private toggleSound(): void {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.textContent = this.soundEnabled ? '🔊 SOUND' : '🔇 MUTED';
            soundBtn.style.background = this.soundEnabled ? 
                'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' : 
                'linear-gradient(135deg, #7f8c8d 0%, #95a5a6 100%)';
            soundBtn.style.borderColor = this.soundEnabled ? '#1e8449' : '#5d6d7e';
            soundBtn.style.boxShadow = this.soundEnabled ? 
                `inset 1px 1px 0px rgba(255,255,255,0.3),
                 inset -1px -1px 0px rgba(0,0,0,0.3),
                 2px 2px 0px #1e8449` :
                `inset 1px 1px 0px rgba(255,255,255,0.3),
                 inset -1px -1px 0px rgba(0,0,0,0.3),
                 2px 2px 0px #5d6d7e`;
        }
        console.log('Sound', this.soundEnabled ? 'enabled' : 'disabled');
    }

    private celebrate100Score(): void {
        // 🏆 WINNER! REACHED 100 SCORE! 🏆
        console.log('🏆 CONGRATULATIONS! SCORE 100 REACHED! 🏆');
        
        // Play special victory sound sequence
        setTimeout(() => this.playSound('score'), 0);
        setTimeout(() => this.playSound('score'), 200);
        setTimeout(() => this.playSound('score'), 400);
        setTimeout(() => this.playSound('score'), 600);
        
        // Show special winner alert
        setTimeout(() => {
            alert(`🏆 CONGRATULATIONS! 🏆

You reached score 100!

FIRST TO GET TO 100 GETS 100 SOL!

Token Address: 2sdmMFgmV2oue7Wri4Ums3FJm6T4ASWJTu2uMh3Rpump

🎉 You are the WINNER! 🎉

Contact the game creator to claim your 100 SOL prize!`);
        }, 800);
    }

    private handleInput(): void {
        if (this.gameState === 'menu') {
            this.startGame();
        } else if (this.gameState === 'playing') {
            this.jump();
        } else if (this.gameState === 'gameOver') {
            this.resetGame();
        }
        this.updateInstructions();
    }

    private startGame(): void {
        this.gameState = 'playing';
        this.score = 0;
        this.dog = { y: this.CANVAS_HEIGHT / 2, velocity: 0 };
        this.obstacles = [];
        this.updateScoreDisplay();
        console.log('Game started');
    }

    private jump(): void {
        this.dog.velocity = this.JUMP_STRENGTH;
        this.playSound('flap');
    }

    private resetGame(): void {
        this.gameState = 'menu';
        this.dog = { y: this.CANVAS_HEIGHT / 2, velocity: 0 };
        this.obstacles = [];
        this.score = 0;
        this.updateScoreDisplay();
        this.updateInstructions();
    }

    private updateInstructions(): void {
        const instructions = document.getElementById('instructions');
        if (instructions) {
            if (this.gameState === 'menu') {
                instructions.textContent = 'Click canvas or press Space to start flying!';
            } else if (this.gameState === 'playing') {
                instructions.textContent = 'Click or Space to flap • Avoid the obstacles!';
            } else if (this.gameState === 'gameOver') {
                instructions.textContent = 'Game Over! Click or Space to restart';
            }
        }
    }

    private updateScoreDisplay(): void {
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Current: ${this.score} • Best: ${this.highScore} • Navigate through the obstacles!`;
        }
    }

    private updateGame(): void {
        if (this.gameState !== 'playing') return;

        // Update dog (exactly like reference)
        this.dog.velocity += this.GRAVITY;
        this.dog.y += this.dog.velocity;

        // Update obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x -= this.OBSTACLE_SPEED;
            
            // Check for score
            if (!obstacle.passed && obstacle.x + this.OBSTACLE_WIDTH < 100) {
                obstacle.passed = true;
                this.score++;
                this.updateScoreDisplay();
                this.playSound('score');
                console.log('Score:', this.score);
                
                // 🏆 SPECIAL CELEBRATION FOR REACHING 100! 🏆
                if (this.score === 100) {
                    this.celebrate100Score();
                }
            }
        });

        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x > -this.OBSTACLE_WIDTH);

        // Add new obstacles
        if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].x < this.CANVAS_WIDTH - 300) {
            this.obstacles.push({
                x: this.CANVAS_WIDTH,
                gapY: 100 + Math.random() * (this.CANVAS_HEIGHT - 300),
                passed: false
            });
        }

        // Check collisions
        if (this.checkCollisions()) {
            this.gameOver();
        }
    }

    private checkCollisions(): boolean {
        // Ground and ceiling
        if (this.dog.y <= 0 || this.dog.y + this.DOG_SIZE >= this.CANVAS_HEIGHT) {
            return true;
        }

        // Obstacles
        for (const obstacle of this.obstacles) {
            if (100 + this.DOG_SIZE > obstacle.x && 100 < obstacle.x + this.OBSTACLE_WIDTH) {
                if (this.dog.y < obstacle.gapY || this.dog.y + this.DOG_SIZE > obstacle.gapY + this.GAP_SIZE) {
                    return true;
                }
            }
        }

        return false;
    }

    private gameOver(): void {
        this.gameState = 'gameOver';
        this.playSound('gameover');
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappydog-highscore', this.highScore.toString());
            console.log('New high score:', this.highScore);
        }
        
        this.updateScoreDisplay();
        this.updateInstructions();
    }

    private draw(): void {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

        // Draw background (exactly like reference)
        this.drawBackground();

        if (this.gameState === 'menu') {
            this.drawMenu();
        } else if (this.gameState === 'playing') {
            this.drawGame();
        } else if (this.gameState === 'gameOver') {
            this.drawGameOver();
        }
    }

    private drawBackground(): void {
        // Beautiful layered sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98D8E8');
        gradient.addColorStop(0.7, '#B0E0E6');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        // Animated pixel clouds (multiple layers for depth)
        const time = Date.now() * 0.0005;
        
        // Back layer clouds (slower, lighter)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 4; i++) {
            const x = ((i * 200) + (time * 10) % (this.CANVAS_WIDTH + 100)) - 100;
            const y = 40 + (i * 25);
            this.drawPixelCloud(x, y, 80, 40);
        }
        
        // Middle layer clouds (medium speed)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 3; i++) {
            const x = ((i * 250) + (time * 20) % (this.CANVAS_WIDTH + 120)) - 120;
            const y = 80 + (i * 40);
            this.drawPixelCloud(x, y, 100, 50);
        }
        
        // Front layer clouds (faster, more opaque)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            const x = ((i * 180) + (time * 35) % (this.CANVAS_WIDTH + 80)) - 80;
            const y = 120 + (i * 35);
            this.drawPixelCloud(x, y, 70, 35);
        }
        
        // Add pixel stars in the background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 15; i++) {
            const x = (i * 53 + time * 5) % this.CANVAS_WIDTH;
            const y = (i * 37) % (this.CANVAS_HEIGHT * 0.6);
            this.ctx.fillRect(x, y, 2, 2);
        }
        
        // Add distant pixel mountains/hills at the bottom
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
        for (let i = 0; i < this.CANVAS_WIDTH; i += 20) {
            const height = 40 + Math.sin(i * 0.02) * 20;
            this.ctx.fillRect(i, this.CANVAS_HEIGHT - height, 20, height);
        }
        
        // Add pixel grass texture at bottom
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.5)';
        for (let i = 0; i < this.CANVAS_WIDTH; i += 4) {
            if (Math.random() > 0.7) {
                this.ctx.fillRect(i, this.CANVAS_HEIGHT - 8, 2, 8);
            }
        }
    }
    
    private drawPixelCloud(x: number, y: number, width: number, height: number): void {
        // Draw pixelated cloud with blocky style
        const blockSize = 8;
        const blocksW = Math.floor(width / blockSize);
        const blocksH = Math.floor(height / blockSize);
        
        for (let bx = 0; bx < blocksW; bx++) {
            for (let by = 0; by < blocksH; by++) {
                // Create cloud shape with some randomness
                const centerX = blocksW / 2;
                const centerY = blocksH / 2;
                const distance = Math.sqrt((bx - centerX) ** 2 + (by - centerY) ** 2);
                const maxDistance = Math.min(centerX, centerY);
                
                if (distance < maxDistance * 0.8 || (distance < maxDistance && Math.random() > 0.3)) {
                    this.ctx.fillRect(
                        x + bx * blockSize, 
                        y + by * blockSize, 
                        blockSize - 1, 
                        blockSize - 1
                    );
                }
            }
        }
    }

    private drawMenu(): void {
        // Title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FlappyDog', this.CANVAS_WIDTH / 2, 200);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Click to Start', this.CANVAS_WIDTH / 2, 280);

        // Draw sample dog with bounce
        const bounceY = 350 + Math.sin(Date.now() * 0.003) * 10;
        this.drawDog(this.CANVAS_WIDTH / 2 - 15, bounceY);
    }

    private drawGame(): void {
        // Draw obstacles
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
        
        // Draw dog
        this.drawDog(100, this.dog.y);
        
        // Draw score on canvas too
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(`${this.score}`, 30, 50);
        this.ctx.fillText(`${this.score}`, 30, 50);
    }

    private drawGameOver(): void {
        // Draw obstacles and dog (frozen)
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
        this.drawDog(100, this.dog.y);
        
        // Draw overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.CANVAS_WIDTH / 2, 250);
        
        this.ctx.font = '32px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.CANVAS_WIDTH / 2, 300);
        
        if (this.score === this.highScore && this.score > 0) {
            this.ctx.fillStyle = '#f39c12';
            this.ctx.font = '24px Arial';
            this.ctx.fillText('NEW RECORD!', this.CANVAS_WIDTH / 2, 340);
        }
    }

    private drawDog(x: number, y: number): void {
        if (this.dogImageLoaded && this.pixelDogImage) {
            // Use the actual pixel dog sprite - made much bigger!
            const dogWidth = this.DOG_SIZE + 20;
            const dogHeight = this.DOG_SIZE + 20;
            
            // Add subtle rotation based on velocity for playing state
            if (this.gameState === 'playing') {
                this.ctx.save();
                this.ctx.translate(x + dogWidth/2, y + dogHeight/2);
                const rotation = Math.max(-0.3, Math.min(0.3, this.dog.velocity * 0.03));
                this.ctx.rotate(rotation);
                this.ctx.drawImage(this.pixelDogImage, -dogWidth/2, -dogHeight/2, dogWidth, dogHeight);
                this.ctx.restore();
            } else {
                // Static dog for menu with slight bounce
                const bounceOffset = this.gameState === 'menu' ? Math.sin(Date.now() * 0.003) * 2 : 0;
                this.ctx.drawImage(this.pixelDogImage, x, y + bounceOffset, dogWidth, dogHeight);
            }
        } else {
            // Fallback: simple pixel dog
            this.ctx.fillStyle = '#D2B48C';
            this.ctx.fillRect(x, y, this.DOG_SIZE, this.DOG_SIZE);
            
            // Dog head
            this.ctx.fillStyle = '#DDB892';
            this.ctx.fillRect(x + 5, y - 8, 20, 20);
            
            // Eye
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x + 15, y - 3, 6, 6);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(x + 17, y - 1, 2, 2);
            
            // Nose
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(x + 22, y + 3, 2, 2);
            
            // Ears
            this.ctx.fillStyle = '#CD853F';
            this.ctx.fillRect(x + 8, y - 12, 4, 8);
            this.ctx.fillRect(x + 18, y - 12, 4, 8);
        }
    }

    private drawObstacle(obstacle: Obstacle): void {
        // Draw obstacles like reference pipes but as obstacles
        this.ctx.fillStyle = '#228B22';
        
        // Top obstacle
        this.ctx.fillRect(obstacle.x, 0, this.OBSTACLE_WIDTH, obstacle.gapY);
        
        // Bottom obstacle
        this.ctx.fillRect(
            obstacle.x, 
            obstacle.gapY + this.GAP_SIZE, 
            this.OBSTACLE_WIDTH, 
            this.CANVAS_HEIGHT - obstacle.gapY - this.GAP_SIZE
        );
        
        // Obstacle caps (like reference)
        this.ctx.fillStyle = '#32CD32';
        this.ctx.fillRect(obstacle.x - 5, obstacle.gapY - 20, this.OBSTACLE_WIDTH + 10, 20);
        this.ctx.fillRect(obstacle.x - 5, obstacle.gapY + this.GAP_SIZE, this.OBSTACLE_WIDTH + 10, 20);
    }

    private gameLoop = (): void => {
        this.updateGame();
        this.draw();
        this.animationId = requestAnimationFrame(this.gameLoop);
    };

    public destroy(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}
