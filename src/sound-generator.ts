/**
 * FlappyDog - Sound Generator
 * Creates basic sound effects using Web Audio API synthesis
 */

export class SoundGenerator {
    private static audioContext: AudioContext | null = null;
    
    private static getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }
    
    // Create flap sound - quick chirp
    public static createFlapSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 0.1; // 100ms
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const frequency = 800 - (t * 600); // Descending chirp
            const envelope = Math.exp(-t * 20); // Quick decay
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create coin collect sound - pleasant ding
    public static createCoinSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 0.2;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8);
            
            // Harmonics for richer sound
            const fundamental = Math.sin(2 * Math.PI * 523 * t); // C5
            const harmonic = Math.sin(2 * Math.PI * 659 * t) * 0.5; // E5
            const harmonic2 = Math.sin(2 * Math.PI * 784 * t) * 0.3; // G5
            
            data[i] = (fundamental + harmonic + harmonic2) * envelope * 0.2;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create bone collect sound - soft chime
    public static createBoneSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 0.15;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10);
            
            // Warm, mellow tone
            const tone = Math.sin(2 * Math.PI * 220 * t) + 
                        Math.sin(2 * Math.PI * 440 * t) * 0.3;
            
            data[i] = tone * envelope * 0.15;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create dash sound - whoosh
    public static createDashSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 0.3;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 5);
            
            // Noise-based whoosh
            const noise = (Math.random() - 0.5) * 2;
            const lowpass = Math.sin(2 * Math.PI * (100 + t * 200) * t);
            
            data[i] = (noise * 0.3 + lowpass * 0.7) * envelope * 0.2;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create bark sound - sharp bark
    public static createBarkSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 0.4;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = t < 0.05 ? t * 20 : Math.exp(-(t - 0.05) * 8);
            
            // Complex waveform for bark-like sound
            const fundamental = Math.sin(2 * Math.PI * 150 * t);
            const growl = Math.sin(2 * Math.PI * 80 * t) * 0.6;
            const noise = (Math.random() - 0.5) * 0.4;
            
            data[i] = (fundamental + growl + noise) * envelope * 0.25;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create score sound - success chime
    public static createScoreSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 0.5;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 4);
            
            // Major chord progression
            let signal = 0;
            if (t < 0.15) {
                signal = Math.sin(2 * Math.PI * 523 * t); // C
            } else if (t < 0.3) {
                signal = Math.sin(2 * Math.PI * 659 * t); // E
            } else {
                signal = Math.sin(2 * Math.PI * 784 * t); // G
            }
            
            data[i] = signal * envelope * 0.2;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create game over sound - descending sad tone
    public static createGameOverSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 1.0;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 2);
            
            // Descending minor chord
            const frequency = 440 - (t * 200); // A to G
            const minor = Math.sin(2 * Math.PI * frequency * t) + 
                         Math.sin(2 * Math.PI * (frequency * 1.2) * t) * 0.5;
            
            data[i] = minor * envelope * 0.15;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create checkpoint sound - magical chime
    public static createCheckpointSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 0.8;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 3);
            
            // Magical ascending arpeggio
            const note1 = Math.sin(2 * Math.PI * 523 * t) * (t < 0.2 ? 1 : 0); // C
            const note2 = Math.sin(2 * Math.PI * 659 * t) * (t >= 0.2 && t < 0.4 ? 1 : 0); // E
            const note3 = Math.sin(2 * Math.PI * 784 * t) * (t >= 0.4 && t < 0.6 ? 1 : 0); // G
            const note4 = Math.sin(2 * Math.PI * 1047 * t) * (t >= 0.6 ? 1 : 0); // C octave
            
            data[i] = (note1 + note2 + note3 + note4) * envelope * 0.2;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create button click sound - subtle click
    public static createButtonSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 0.05;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 50);
            
            // Sharp click
            const click = Math.sin(2 * Math.PI * 1200 * t) + 
                         Math.sin(2 * Math.PI * 2400 * t) * 0.5;
            
            data[i] = click * envelope * 0.1;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    // Create quest complete sound - triumph fanfare
    public static createQuestCompleteSound(): ArrayBuffer {
        const ctx = this.getAudioContext();
        const sampleRate = ctx.sampleRate;
        const duration = 1.5;
        const samples = Math.floor(sampleRate * duration);
        
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 1.5);
            
            // Triumphant fanfare
            let signal = 0;
            if (t < 0.3) {
                signal = Math.sin(2 * Math.PI * 523 * t); // C
            } else if (t < 0.6) {
                signal = Math.sin(2 * Math.PI * 659 * t); // E
            } else if (t < 0.9) {
                signal = Math.sin(2 * Math.PI * 784 * t); // G
            } else {
                signal = Math.sin(2 * Math.PI * 1047 * t); // C octave
            }
            
            // Add harmonics
            signal += Math.sin(2 * Math.PI * (signal * 1000 + 200) * t) * 0.3;
            
            data[i] = signal * envelope * 0.25;
        }
        
        return this.bufferToArrayBuffer(buffer);
    }
    
    private static bufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
        // Convert AudioBuffer to ArrayBuffer for storage
        const samples = audioBuffer.getChannelData(0);
        const arrayBuffer = new ArrayBuffer(samples.length * 4);
        const view = new Float32Array(arrayBuffer);
        view.set(samples);
        return arrayBuffer;
    }
}

// Generate all sounds and export as data URLs
export const SOUNDS = {
    flap: SoundGenerator.createFlapSound(),
    coin: SoundGenerator.createCoinSound(),
    bone: SoundGenerator.createBoneSound(),
    dash: SoundGenerator.createDashSound(),
    bark: SoundGenerator.createBarkSound(),
    score: SoundGenerator.createScoreSound(),
    gameover: SoundGenerator.createGameOverSound(),
    checkpoint: SoundGenerator.createCheckpointSound(),
    button: SoundGenerator.createButtonSound(),
    quest_complete: SoundGenerator.createQuestCompleteSound()
};
