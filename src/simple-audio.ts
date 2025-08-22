/**
 * FlappyDog - Simple Audio System
 * Generates sounds using Web Audio API without external files
 */

export class SimpleAudioManager {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private soundVolume: number = 0.5;
    private musicVolume: number = 0.3;
    
    constructor() {
        this.initialize();
    }
    
    private async initialize(): Promise<void> {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.7;
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }
    
    private async ensureAudioContext(): Promise<void> {
        if (!this.audioContext) {
            await this.initialize();
        }
        
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    public async playSound(soundName: string): Promise<void> {
        await this.ensureAudioContext();
        
        if (!this.audioContext || !this.masterGain) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            const now = this.audioContext.currentTime;
            const volume = this.soundVolume;
            
            // Different sound patterns
            switch (soundName) {
                case 'flap':
                    oscillator.frequency.setValueAtTime(800, now);
                    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                    gainNode.gain.setValueAtTime(volume * 0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    oscillator.type = 'square';
                    oscillator.start(now);
                    oscillator.stop(now + 0.1);
                    break;
                    
                case 'coin':
                    oscillator.frequency.setValueAtTime(523, now);
                    gainNode.gain.setValueAtTime(volume * 0.4, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    oscillator.type = 'sine';
                    oscillator.start(now);
                    oscillator.stop(now + 0.2);
                    break;
                    
                case 'score':
                    oscillator.frequency.setValueAtTime(523, now);
                    oscillator.frequency.setValueAtTime(659, now + 0.1);
                    gainNode.gain.setValueAtTime(volume * 0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    oscillator.type = 'triangle';
                    oscillator.start(now);
                    oscillator.stop(now + 0.3);
                    break;
                    
                case 'gameover':
                    oscillator.frequency.setValueAtTime(440, now);
                    oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.5);
                    gainNode.gain.setValueAtTime(volume * 0.2, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                    oscillator.type = 'sawtooth';
                    oscillator.start(now);
                    oscillator.stop(now + 0.5);
                    break;
                    
                default:
                    // Simple beep
                    oscillator.frequency.setValueAtTime(440, now);
                    gainNode.gain.setValueAtTime(volume * 0.2, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    oscillator.type = 'sine';
                    oscillator.start(now);
                    oscillator.stop(now + 0.1);
                    break;
            }
        } catch (error) {
            // Silently handle audio errors
        }
    }
    
    public playMusic(trackName: string): void {
        // Simple ambient tone for background music
        if (!this.audioContext || !this.masterGain) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.frequency.setValueAtTime(220, 0); // Low ambient tone
            gainNode.gain.setValueAtTime(this.musicVolume * 0.1, 0);
            oscillator.type = 'sine';
            
            // Very quiet ambient sound
            oscillator.start();
            
            // Stop after 10 seconds to avoid continuous sound
            setTimeout(() => {
                try {
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 1);
                    oscillator.stop(this.audioContext!.currentTime + 1);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }, 10000);
        } catch (error) {
            // Silently handle music errors
        }
    }
    
    public stopMusic(): void {
        // Music will stop automatically after timeout
    }
    
    public setSoundVolume(volume: number): void {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }
    
    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
    
    public isOnBeat(): boolean {
        // Simple rhythm detection - return true occasionally for rhythm mode
        return Math.random() < 0.3;
    }
    
    public pauseMusic(): void {
        // Music pausing not implemented in simple version
    }
    
    public resumeMusic(): void {
        // Music resuming not implemented in simple version
    }
    
    public getNextBeatTime(): number {
        // Return current time + random interval for rhythm mode
        return Date.now() + Math.random() * 1000 + 500;
    }
}
