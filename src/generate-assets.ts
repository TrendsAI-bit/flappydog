/**
 * FlappyDog - Asset Generation Script
 * Generates and saves actual image files from the asset generator
 */

import { PWA_ICONS } from './assets';

// Function to download data URL as file
function downloadDataUrl(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to convert data URL to blob and create object URL
function dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// Generate and save PWA icons
export function generatePWAIcons() {
    // Generate favicon
    const faviconBlob = dataUrlToBlob(PWA_ICONS.favicon);
    const faviconUrl = URL.createObjectURL(faviconBlob);
    
    // Generate 192x192 icon
    const icon192Blob = dataUrlToBlob(PWA_ICONS.icon192);
    const icon192Url = URL.createObjectURL(icon192Blob);
    
    // Generate 512x512 icon
    const icon512Blob = dataUrlToBlob(PWA_ICONS.icon512);
    const icon512Url = URL.createObjectURL(icon512Blob);
    
    console.log('Generated PWA icons:');
    console.log('Favicon:', faviconUrl);
    console.log('192x192:', icon192Url);
    console.log('512x512:', icon512Url);
    
    // Auto-download for development
    if (process.env.NODE_ENV === 'development') {
        downloadDataUrl(PWA_ICONS.favicon, 'favicon.ico');
        downloadDataUrl(PWA_ICONS.icon192, 'pwa-192x192.png');
        downloadDataUrl(PWA_ICONS.icon512, 'pwa-512x512.png');
    }
    
    return {
        favicon: faviconUrl,
        icon192: icon192Url,
        icon512: icon512Url
    };
}

// Update favicon dynamically
export function updateFavicon() {
    const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (faviconLink) {
        faviconLink.href = PWA_ICONS.favicon;
    } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.type = 'image/png';
        newFavicon.href = PWA_ICONS.favicon;
        document.head.appendChild(newFavicon);
    }
}

// Generate OG image for social sharing
export function generateOGImage(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1200;
    canvas.height = 630;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#4682B4');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    
    const title = '🐕 FlappyDog';
    ctx.strokeText(title, canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 50);
    
    // Subtitle
    ctx.font = 'bold 48px Arial';
    const subtitle = 'The Ultimate Flappy Experience';
    ctx.strokeText(subtitle, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 50);
    
    // Features
    ctx.font = '32px Arial';
    ctx.fillStyle = '#FFD700';
    const features = '🎵 Rhythm Mode • 🌪️ Wind System • 🏆 Daily Challenges • 📱 PWA';
    ctx.fillText(features, canvas.width / 2, canvas.height / 2 + 150);
    
    return canvas.toDataURL('image/png');
}
