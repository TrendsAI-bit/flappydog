/**
 * FlappyDog - Asset Generator
 * Creates pixel art sprites as data URLs for immediate use
 */

export class AssetGenerator {
    
    // Create a simple pixel art dog sprite (48x32, 3 frames)
    public static createDogSprite(): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 144; // 48 * 3 frames
        canvas.height = 32;
        
        // Clear with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Define colors
        const dogBrown = '#D2B48C';
        const dogDark = '#A0522D';
        const white = '#FFFFFF';
        const black = '#000000';
        const pink = '#FFB6C1';
        
        // Helper function to draw pixel
        const drawPixel = (x: number, y: number, color: string, frameOffset: number = 0) => {
            ctx.fillStyle = color;
            ctx.fillRect(x + frameOffset, y, 1, 1);
        };
        
        // Draw three frames of the dog
        for (let frame = 0; frame < 3; frame++) {
            const offsetX = frame * 48;
            
            // Frame-specific wing positions
            const wingY = frame === 1 ? 14 : (frame === 2 ? 18 : 16);
            
            // Body (main oval)
            for (let x = 8; x < 40; x++) {
                for (let y = 8; y < 24; y++) {
                    const centerX = 24;
                    const centerY = 16;
                    const distX = (x - centerX) / 16;
                    const distY = (y - centerY) / 8;
                    if (distX * distX + distY * distY < 1) {
                        drawPixel(x, y, dogBrown, offsetX);
                    }
                }
            }
            
            // Head (circle)
            for (let x = 20; x < 44; x++) {
                for (let y = 4; y < 20; y++) {
                    const centerX = 32;
                    const centerY = 12;
                    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    if (dist < 10) {
                        drawPixel(x, y, dogBrown, offsetX);
                    }
                }
            }
            
            // Ear (triangle)
            for (let x = 20; x < 28; x++) {
                for (let y = 2; y < 12; y++) {
                    if (x - 20 >= y - 2) {
                        drawPixel(x, y, dogDark, offsetX);
                    }
                }
            }
            
            // Eye (white circle with black pupil)
            for (let x = 28; x < 36; x++) {
                for (let y = 8; y < 16; y++) {
                    const dist = Math.sqrt((x - 32) ** 2 + (y - 12) ** 2);
                    if (dist < 3) {
                        drawPixel(x, y, white, offsetX);
                    }
                    if (dist < 1.5) {
                        drawPixel(x, y, black, offsetX);
                    }
                }
            }
            
            // Nose (small black triangle)
            drawPixel(38, 12, black, offsetX);
            drawPixel(39, 12, black, offsetX);
            drawPixel(38, 13, black, offsetX);
            
            // Mouth (small curve)
            drawPixel(37, 14, black, offsetX);
            drawPixel(38, 15, black, offsetX);
            
            // Tail (curved)
            const tailPixels = [
                [6, 16], [5, 17], [4, 18], [4, 19], [5, 20], [6, 21], [7, 22]
            ];
            tailPixels.forEach(([x, y]) => drawPixel(x, y, dogDark, offsetX));
            
            // Wings/flap animation
            const wingPixels = frame === 0 ? [
                [12, wingY], [13, wingY], [14, wingY],
                [11, wingY + 1], [12, wingY + 1], [13, wingY + 1]
            ] : frame === 1 ? [
                [10, wingY], [11, wingY], [12, wingY], [13, wingY],
                [9, wingY + 1], [10, wingY + 1], [11, wingY + 1]
            ] : [
                [12, wingY], [13, wingY], [14, wingY], [15, wingY],
                [13, wingY + 1], [14, wingY + 1], [15, wingY + 1]
            ];
            
            wingPixels.forEach(([x, y]) => drawPixel(x, y, dogDark, offsetX));
            
            // Paws
            drawPixel(16, 22, dogDark, offsetX);
            drawPixel(17, 23, dogDark, offsetX);
            drawPixel(24, 22, dogDark, offsetX);
            drawPixel(25, 23, dogDark, offsetX);
        }
        
        return canvas.toDataURL('image/png');
    }
    
    // Create obstacle sprites (cloud-like gates)
    public static createObstacleSprite(): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 80;
        canvas.height = 400;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cloudColor = '#87CEEB';
        const cloudDark = '#4682B4';
        
        // Draw fluffy cloud texture
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) + 
                             Math.sin(x * 0.05) * Math.cos(y * 0.05);
                
                if (noise > 0.3) {
                    const alpha = Math.min(1, noise);
                    ctx.fillStyle = cloudColor;
                    ctx.globalAlpha = alpha;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        ctx.globalAlpha = 1;
        
        // Add cloud outline
        ctx.strokeStyle = cloudDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Create wavy outline
        for (let y = 0; y < canvas.height; y += 2) {
            const leftX = 5 + Math.sin(y * 0.02) * 3;
            const rightX = canvas.width - 5 - Math.sin(y * 0.02) * 3;
            
            if (y === 0) {
                ctx.moveTo(leftX, y);
            } else {
                ctx.lineTo(leftX, y);
            }
        }
        
        for (let y = canvas.height; y > 0; y -= 2) {
            const rightX = canvas.width - 5 - Math.sin(y * 0.02) * 3;
            ctx.lineTo(rightX, y);
        }
        
        ctx.closePath();
        ctx.stroke();
        
        return canvas.toDataURL('image/png');
    }
    
    // Create bone collectible sprite
    public static createBoneSprite(): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 24;
        canvas.height = 24;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const boneColor = '#FFF8DC';
        const boneDark = '#DDD';
        
        // Draw bone shape
        ctx.fillStyle = boneColor;
        ctx.strokeStyle = boneDark;
        ctx.lineWidth = 1;
        
        // Main shaft
        ctx.fillRect(6, 10, 12, 4);
        ctx.strokeRect(6, 10, 12, 4);
        
        // Left end
        ctx.beginPath();
        ctx.ellipse(6, 8, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(6, 16, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Right end
        ctx.beginPath();
        ctx.ellipse(18, 8, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(18, 16, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        return canvas.toDataURL('image/png');
    }
    
    // Create coin sprite
    public static createCoinSprite(): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 24;
        canvas.height = 24;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Gold gradient
        const gradient = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        
        // Draw coin
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(12, 12, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(8, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Dollar sign or star
        ctx.fillStyle = '#B8860B';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 12, 12);
        
        return canvas.toDataURL('image/png');
    }
    
    // Create cloud background sprites
    public static createCloudSprite(): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 120;
        canvas.height = 60;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cloudColor = 'rgba(255, 255, 255, 0.8)';
        
        // Draw fluffy cloud
        ctx.fillStyle = cloudColor;
        
        // Main cloud body
        ctx.beginPath();
        ctx.arc(30, 35, 20, 0, Math.PI * 2);
        ctx.arc(50, 30, 25, 0, Math.PI * 2);
        ctx.arc(70, 35, 20, 0, Math.PI * 2);
        ctx.arc(90, 40, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some puffs
        ctx.beginPath();
        ctx.arc(25, 25, 12, 0, Math.PI * 2);
        ctx.arc(75, 25, 15, 0, Math.PI * 2);
        ctx.arc(95, 30, 10, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas.toDataURL('image/png');
    }
    
    // Create PWA icons
    public static createPWAIcon(size: number): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = size;
        canvas.height = size;
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#4682B4');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Draw simplified dog head
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.3;
        
        // Head
        ctx.fillStyle = '#D2B48C';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ear
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.5, centerY - radius * 0.5, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.2, centerY - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.2, centerY - radius * 0.2, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.4, centerY, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas.toDataURL('image/png');
    }
}

// Generate and export sprites
export const SPRITES = {
    dog: AssetGenerator.createDogSprite(),
    obstacle: AssetGenerator.createObstacleSprite(),
    bone: AssetGenerator.createBoneSprite(),
    coin: AssetGenerator.createCoinSprite(),
    cloud: AssetGenerator.createCloudSprite()
};

// Generate PWA icons
export const PWA_ICONS = {
    icon192: AssetGenerator.createPWAIcon(192),
    icon512: AssetGenerator.createPWAIcon(512),
    favicon: AssetGenerator.createPWAIcon(32)
};
