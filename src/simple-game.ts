/**
 * FlappyDog - Simple Working Game
 * Based on the working reference implementation
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

export class SimpleFlappyDog {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameState: 'menu' | 'playing' | 'gameOver' = 'menu';
    private score: number = 0;
    private highScore: number = 0;
    private dog: Dog = { y: 150, velocity: 0 };
    private obstacles: Obstacle[] = [];
    private animationId: number | null = null;

    // Game constants
    private readonly CANVAS_WIDTH = 800;
    private readonly CANVAS_HEIGHT = 600;
    private readonly DOG_SIZE = 30;
    private readonly OBSTACLE_WIDTH = 60;
    private readonly GAP_SIZE = 150;
    private readonly GRAVITY = 0.6;
    private readonly JUMP_STRENGTH = -12;
    private readonly OBSTACLE_SPEED = 3;

    constructor() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.CANVAS_WIDTH;
        this.canvas.height = this.CANVAS_HEIGHT;
        this.canvas.style.border = '2px solid #333';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.background = '#87CEEB';
        this.canvas.style.cursor = 'pointer';
        
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
        
        // Add to page
        document.body.innerHTML = '';
        document.body.appendChild(this.canvas);
        
        // Start game loop
        this.gameLoop();
        
        console.log('Simple FlappyDog initialized');
    }

    private handleInput(): void {
        if (this.gameState === 'menu') {
            this.startGame();
        } else if (this.gameState === 'playing') {
            this.jump();
        } else if (this.gameState === 'gameOver') {
            this.resetGame();
        }
    }

    private startGame(): void {
        this.gameState = 'playing';
        this.score = 0;
        this.dog = { y: this.CANVAS_HEIGHT / 2, velocity: 0 };
        this.obstacles = [];
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
    }

    private updateGame(): void {
        if (this.gameState !== 'playing') return;

        // Update dog
        this.dog.velocity += this.GRAVITY;
        this.dog.y += this.dog.velocity;

        // Update obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x -= this.OBSTACLE_SPEED;
            
            // Check for score
            if (!obstacle.passed && obstacle.x + this.OBSTACLE_WIDTH < 100) {
                obstacle.passed = true;
                this.score++;
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
    }

    private draw(): void {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

        // Draw background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

        if (this.gameState === 'menu') {
            this.drawMenu();
        } else if (this.gameState === 'playing') {
            this.drawGame();
        } else if (this.gameState === 'gameOver') {
            this.drawGameOver();
        }
    }

    private drawMenu(): void {
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐕 FlappyDog', this.CANVAS_WIDTH / 2, 200);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Click or Press Space to Start', this.CANVAS_WIDTH / 2, 300);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`High Score: ${this.highScore}`, this.CANVAS_WIDTH / 2, 350);

        // Draw sample dog
        this.drawDog(150, 400);
    }

    private drawGame(): void {
        // Draw obstacles
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
        
        // Draw dog
        this.drawDog(100, this.dog.y);
        
        // Draw score
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 50);
    }

    private drawGameOver(): void {
        // Draw obstacles and dog (frozen)
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
        this.drawDog(100, this.dog.y);
        
        // Draw game over overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.CANVAS_WIDTH / 2, 200);
        
        this.ctx.font = '32px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.CANVAS_WIDTH / 2, 260);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.CANVAS_WIDTH / 2, 300);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Click or Press Space to Restart', this.CANVAS_WIDTH / 2, 400);
    }

    private drawDog(x: number, y: number): void {
        // Body
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.fillRect(x, y, this.DOG_SIZE, this.DOG_SIZE);
        
        // Head
        this.ctx.fillStyle = '#DDB892';
        this.ctx.fillRect(x + 10, y - 10, 25, 25);
        
        // Eye
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x + 20, y - 5, 8, 8);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + 22, y - 3, 4, 4);
        
        // Nose
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + 30, y + 2, 3, 2);
        
        // Tail
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.fillRect(x - 8, y + 5, 10, 5);
    }

    private drawObstacle(obstacle: Obstacle): void {
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
        
        // Obstacle caps
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
