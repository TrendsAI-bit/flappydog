/**
 * FlappyDog - Simple Main Entry Point
 * Just initialize the working game
 */

import './styles.css';
import { SimpleFlappyDog } from './simple-game';

// Simple initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Simple FlappyDog...');
    
    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
    
    // Create the game
    new SimpleFlappyDog();
    
    console.log('Simple FlappyDog initialized successfully!');
});

// Service worker registration (optional)
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
