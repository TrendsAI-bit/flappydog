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

    // Game constants (exactly like reference)
    private readonly CANVAS_WIDTH = 800;
    private readonly CANVAS_HEIGHT = 600;
    private readonly DOG_SIZE = 30;
    private readonly OBSTACLE_WIDTH = 60;
    private readonly GAP_SIZE = 150;
    private readonly GRAVITY = 0.6;
    private readonly JUMP_STRENGTH = -12;
    private readonly OBSTACLE_SPEED = 3;

    constructor() {
        // Create canvas exactly like reference
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.CANVAS_WIDTH;
        this.canvas.height = this.CANVAS_HEIGHT;
        this.canvas.style.border = '3px solid #2c3e50';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.cursor = 'pointer';
        this.canvas.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        this.canvas.style.imageRendering = 'pixelated';
        
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
                <!-- Game Header -->
                <div style="
                    border: 2px solid #2c3e50;
                    border-radius: 8px 8px 0 0;
                    padding: 15px;
                    background: white;
                    width: 800px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    <h3 style="margin: 0; font-size: 18px; color: #2c3e50;">🐕 FlappyDog</h3>
                    <button id="resetBtn" style="
                        padding: 8px 16px;
                        background: #f39c12;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">🔄 Reset</button>
                </div>
                
                <!-- Game Canvas Container -->
                <div id="game-container" style="
                    border: 2px solid #2c3e50;
                    border-top: none;
                    border-bottom: none;
                    background: white;
                    padding: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 0 8px rgba(0,0,0,0.1);
                "></div>
                
                <!-- Instructions -->
                <div style="
                    border: 2px solid #2c3e50;
                    border-radius: 0 0 8px 8px;
                    padding: 15px;
                    background: white;
                    width: 800px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    <div id="instructions" style="
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 8px;
                    ">Click canvas or press Space to start flying!</div>
                    <div id="scoreDisplay" style="
                        font-size: 12px;
                        color: #999;
                    ">Current: ${this.score} • Best: ${this.highScore} • Navigate through the obstacles!</div>
                </div>
            </div>
        `;
        
        document.getElementById('game-container')!.appendChild(this.canvas);
        
        // Reset button handler
        document.getElementById('resetBtn')!.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Start game loop immediately (no asset loading needed)
        this.gameLoop();
        
        console.log('Working FlappyDog initialized successfully!');
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
                console.log('Score:', this.score);
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
        // Sky gradient (like reference)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        // Simple clouds (like reference)
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            const x = (i * 150) + 50;
            const y = 30 + (i * 30) % 80;
            this.ctx.fillRect(x, y, 60, 30);
            this.ctx.fillRect(x + 15, y - 15, 30, 30);
            this.ctx.fillRect(x + 30, y - 20, 20, 35);
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
        // Draw dog exactly like reference bird but as a dog
        this.ctx.fillStyle = '#D2B48C'; // Tan color for dog
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
        
        // Tail (wagging effect)
        const tailOffset = Math.sin(Date.now() * 0.01) * 2;
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.fillRect(x - 8 + tailOffset, y + 8, 8, 4);
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
