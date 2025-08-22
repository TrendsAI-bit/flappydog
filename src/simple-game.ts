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
    
    // Asset images
    private dogImage: HTMLImageElement | null = null;
    private logoImage: HTMLImageElement | null = null;
    private obstaclesImage: HTMLImageElement | null = null;
    private cloudsImage: HTMLImageElement | null = null;
    private assetsLoaded: boolean = false;

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
        this.canvas.style.border = '3px solid #2c3e50';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '20px auto';
        this.canvas.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 100%)';
        this.canvas.style.cursor = 'pointer';
        this.canvas.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
        
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
        
        // Add to page with better styling
        document.body.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
            ">
                <div style="text-align: center;">
                    <div id="game-container"></div>
                    <p style="
                        color: white;
                        margin-top: 20px;
                        font-size: 16px;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    ">Click or press SPACE to play</p>
                </div>
            </div>
        `;
        
        document.getElementById('game-container')!.appendChild(this.canvas);
        
        // Load assets
        this.loadAssets();
        
        console.log('FlappyDog initialized - loading assets...');
    }

    private loadAssets(): void {
        const assets = [
            { name: 'dog', path: '/assets/dog.png' },
            { name: 'logo', path: '/asset/logo.png' },
            { name: 'obstacles', path: '/assets/obstacles.png' },
            { name: 'clouds', path: '/assets/clouds.png' }
        ];

        let loadedCount = 0;
        const totalAssets = assets.length;

        const onAssetLoad = () => {
            loadedCount++;
            if (loadedCount === totalAssets) {
                this.assetsLoaded = true;
                console.log('All assets loaded!');
                this.gameLoop();
            }
        };

        // Load dog image
        this.dogImage = new Image();
        this.dogImage.onload = onAssetLoad;
        this.dogImage.onerror = () => {
            console.warn('Dog image failed to load');
            onAssetLoad();
        };
        this.dogImage.src = '/dog.png';

        // Load logo image
        this.logoImage = new Image();
        this.logoImage.onload = onAssetLoad;
        this.logoImage.onerror = () => {
            console.warn('Logo image failed to load');
            onAssetLoad();
        };
        this.logoImage.src = '/logo.png';

        // Load obstacles image
        this.obstaclesImage = new Image();
        this.obstaclesImage.onload = onAssetLoad;
        this.obstaclesImage.onerror = () => {
            console.warn('Obstacles image failed to load');
            onAssetLoad();
        };
        this.obstaclesImage.src = '/obstacles.png';

        // Load clouds image
        this.cloudsImage = new Image();
        this.cloudsImage.onload = onAssetLoad;
        this.cloudsImage.onerror = () => {
            console.warn('Clouds image failed to load');
            onAssetLoad();
        };
        this.cloudsImage.src = '/clouds.png';

        // Fallback timeout
        setTimeout(() => {
            if (!this.assetsLoaded) {
                console.log('Assets taking too long, starting anyway...');
                this.assetsLoaded = true;
                this.gameLoop();
            }
        }, 3000);
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
        if (!this.assetsLoaded) {
            // Show loading screen
            this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
            
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading FlappyDog...', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

        // Draw beautiful background
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
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98D8E8');
        gradient.addColorStop(1, '#B0E0E6');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

        // Draw clouds if available
        if (this.cloudsImage) {
            // Draw multiple cloud layers for parallax effect
            for (let i = 0; i < 3; i++) {
                const offset = (Date.now() * 0.01 * (i + 1)) % (this.CANVAS_WIDTH + 100);
                this.ctx.globalAlpha = 0.6 - (i * 0.1);
                this.ctx.drawImage(this.cloudsImage, offset - 100, 50 + i * 40, 100, 60);
                this.ctx.drawImage(this.cloudsImage, offset + 200, 100 + i * 30, 80, 50);
                this.ctx.drawImage(this.cloudsImage, offset + 400, 80 + i * 35, 120, 70);
            }
            this.ctx.globalAlpha = 1;
        }
    }

    private drawMenu(): void {
        // Draw logo if available
        if (this.logoImage) {
            const logoWidth = 300;
            const logoHeight = 120;
            const logoX = (this.CANVAS_WIDTH - logoWidth) / 2;
            const logoY = 80;
            
            // Add shadow effect
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;
            
            this.ctx.drawImage(this.logoImage, logoX, logoY, logoWidth, logoHeight);
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        } else {
            // Fallback text logo
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FlappyDog', this.CANVAS_WIDTH / 2, 150);
        }
        
        // Instructions with better styling
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click or Press Space to Start', this.CANVAS_WIDTH / 2, 280);
        
        // High score with styling
        this.ctx.fillStyle = '#34495e';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Best Score: ${this.highScore}`, this.CANVAS_WIDTH / 2, 320);

        // Draw sample dog with bounce animation
        const bounceY = 400 + Math.sin(Date.now() * 0.003) * 10;
        this.drawDog(150, bounceY);
        
        // Add play button visual
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
        this.ctx.fillRect(this.CANVAS_WIDTH / 2 - 100, 360, 200, 50);
        this.ctx.strokeStyle = '#2980b9';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 100, 360, 200, 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('PLAY', this.CANVAS_WIDTH / 2, 390);
    }

    private drawGame(): void {
        // Draw obstacles
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
        
        // Draw dog
        this.drawDog(100, this.dog.y);
        
        // Draw score with better styling
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(`${this.score}`, 30, 60);
        this.ctx.fillText(`${this.score}`, 30, 60);
        
        // Draw current high score indicator
        if (this.score > 0) {
            this.ctx.fillStyle = '#f39c12';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Best: ${this.highScore}`, this.CANVAS_WIDTH - 20, 30);
        }
    }

    private drawGameOver(): void {
        // Draw obstacles and dog (frozen)
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
        this.drawDog(100, this.dog.y);
        
        // Draw game over overlay with gradient
        const gradient = this.ctx.createRadialGradient(
            this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2, 0,
            this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2, this.CANVAS_WIDTH / 2
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        // Game Over title with glow effect
        this.ctx.shadowColor = '#e74c3c';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.CANVAS_WIDTH / 2, 180);
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        
        // Score display with better styling
        const isNewRecord = this.score === this.highScore && this.score > 0;
        
        if (isNewRecord) {
            this.ctx.fillStyle = '#f39c12';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('NEW RECORD!', this.CANVAS_WIDTH / 2, 220);
        }
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '32px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.CANVAS_WIDTH / 2, 260);
        
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Best: ${this.highScore}`, this.CANVAS_WIDTH / 2, 290);
        
        // Restart button
        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
        this.ctx.fillRect(this.CANVAS_WIDTH / 2 - 120, 320, 240, 50);
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 120, 320, 240, 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('PLAY AGAIN', this.CANVAS_WIDTH / 2, 350);
    }

    private drawDog(x: number, y: number): void {
        if (this.dogImage) {
            // Use the actual dog sprite
            const dogWidth = this.DOG_SIZE + 20;
            const dogHeight = this.DOG_SIZE + 15;
            
            // Add subtle rotation based on velocity for playing state
            if (this.gameState === 'playing') {
                this.ctx.save();
                this.ctx.translate(x + dogWidth/2, y + dogHeight/2);
                const rotation = Math.max(-0.5, Math.min(0.5, this.dog.velocity * 0.05));
                this.ctx.rotate(rotation);
                this.ctx.drawImage(this.dogImage, -dogWidth/2, -dogHeight/2, dogWidth, dogHeight);
                this.ctx.restore();
            } else {
                // Static dog for menu
                this.ctx.drawImage(this.dogImage, x, y, dogWidth, dogHeight);
            }
        } else {
            // Fallback pixel dog
            this.ctx.fillStyle = '#D2B48C';
            this.ctx.fillRect(x, y, this.DOG_SIZE, this.DOG_SIZE);
            
            this.ctx.fillStyle = '#DDB892';
            this.ctx.fillRect(x + 10, y - 10, 25, 25);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(x + 20, y - 5, 8, 8);
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x + 22, y - 3, 4, 4);
            
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x + 30, y + 2, 3, 2);
            
            this.ctx.fillStyle = '#D2B48C';
            this.ctx.fillRect(x - 8, y + 5, 10, 5);
        }
    }

    private drawObstacle(obstacle: Obstacle): void {
        if (this.obstaclesImage && this.obstaclesImage.complete) {
            try {
                // Use the actual obstacles sprite
                // Top obstacle (flipped)
                this.ctx.save();
                this.ctx.translate(obstacle.x + this.OBSTACLE_WIDTH/2, obstacle.gapY);
                this.ctx.scale(1, -1);
                this.ctx.drawImage(this.obstaclesImage, -this.OBSTACLE_WIDTH/2, 0, this.OBSTACLE_WIDTH, obstacle.gapY);
                this.ctx.restore();
                
                // Bottom obstacle
                this.ctx.drawImage(
                    this.obstaclesImage, 
                    obstacle.x, 
                    obstacle.gapY + this.GAP_SIZE, 
                    this.OBSTACLE_WIDTH, 
                    this.CANVAS_HEIGHT - obstacle.gapY - this.GAP_SIZE
                );
                return;
            } catch (error) {
                console.warn('Error drawing obstacle image:', error);
            }
        }
        
        // Fallback rectangular obstacles
        this.ctx.fillStyle = '#34495e';
        
        // Top obstacle
        this.ctx.fillRect(obstacle.x, 0, this.OBSTACLE_WIDTH, obstacle.gapY);
        
        // Bottom obstacle
        this.ctx.fillRect(
            obstacle.x, 
            obstacle.gapY + this.GAP_SIZE, 
            this.OBSTACLE_WIDTH, 
            this.CANVAS_HEIGHT - obstacle.gapY - this.GAP_SIZE
        );
        
        // Obstacle caps with better styling
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(obstacle.x - 5, obstacle.gapY - 25, this.OBSTACLE_WIDTH + 10, 25);
        this.ctx.fillRect(obstacle.x - 5, obstacle.gapY + this.GAP_SIZE, this.OBSTACLE_WIDTH + 10, 25);
        
        // Add some detail lines
        this.ctx.strokeStyle = '#1a252f';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + 5, 0);
        this.ctx.lineTo(obstacle.x + 5, obstacle.gapY);
        this.ctx.moveTo(obstacle.x + this.OBSTACLE_WIDTH - 5, 0);
        this.ctx.lineTo(obstacle.x + this.OBSTACLE_WIDTH - 5, obstacle.gapY);
        this.ctx.stroke();
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
