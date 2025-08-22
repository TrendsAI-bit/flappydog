/**
 * FlappyDog - Simple Main Entry Point
 * Just initialize the working game
 */

import './styles.css';
import { WorkingFlappyDog } from './working-game';

// Working initialization (based on reference)
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Working FlappyDog...');
    
    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
    
    // Create the working game (no assets needed)
    new WorkingFlappyDog();
    
    console.log('Working FlappyDog initialized successfully!');
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
