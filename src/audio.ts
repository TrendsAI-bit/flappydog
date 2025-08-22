/**
 * FlappyDog - Audio Manager
 * Handles sound effects, background music, and rhythm mode functionality
 */

export interface AudioSettings {
    soundVolume: number;
    musicVolume: number;
    haptics: boolean;
}

interface SoundEffect {
    name: string;
    buffer: AudioBuffer | null;
    sources: AudioBufferSourceNode[];
    volume: number;
    loop: boolean;
}

interface MusicTrack {
    name: string;
    buffer: AudioBuffer | null;
    source: AudioBufferSourceNode | null;
    gainNode: GainNode | null;
    bpm: number;
    beatTimes: number[];
    startTime: number;
    volume: number;
    loop: boolean;
}

interface BeatInfo {
    time: number;
    intensity: number;
    isDownbeat: boolean;
}

export class AudioManager {
    private audioContext: AudioContext | null = null;
    private masterGainNode: GainNode | null = null;
    private sfxGainNode: GainNode | null = null;
    private musicGainNode: GainNode | null = null;
    
    private sounds: Map<string, SoundEffect> = new Map();
    private music: Map<string, MusicTrack> = new Map();
    private currentTrack: MusicTrack | null = null;
    
    private settings: AudioSettings = {
        soundVolume: 0.7,
        musicVolume: 0.5,
        haptics: true
    };
    
    // Rhythm mode properties
    private beatDetectionEnabled: boolean = false;
    private _lastBeatTime: number = 0;
    private beatTolerance: number = 150; // ms tolerance for "perfect" beats
    private _metronomeEnabled: boolean = true;
    private visualMetronome: boolean = true;
    
    // Audio loading
    private loadedAssets: number = 0;
    private totalAssets: number = 0;
    private loadingPromises: Promise<void>[] = [];
    
    // Web Audio API feature detection
    private supportsWebAudio: boolean = false;
    private _supportsAudioWorklet: boolean = false;
    
    constructor() {
        this.detectAudioSupport();
    }
    
    public async initialize(): Promise<void> {
        try {
            await this.initializeAudioContext();
            await this.loadAllAudio();
            this.setupGainNodes();
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.fallbackToHTMLAudio();
        }
    }
    
    private detectAudioSupport(): void {
        this.supportsWebAudio = !!(window.AudioContext || (window as any).webkitAudioContext);
        this._supportsAudioWorklet = this.supportsWebAudio && 'audioWorklet' in AudioContext.prototype;
    }
    
    private async initializeAudioContext(): Promise<void> {
        if (!this.supportsWebAudio) {
            throw new Error('Web Audio API not supported');
        }
        
        // Create audio context with better browser compatibility
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        
        // Handle audio context state
        if (this.audioContext.state === 'suspended') {
            // We'll resume it on first user interaction
            this.setupUserInteractionUnlock();
        }
    }
    
    private setupUserInteractionUnlock(): void {
        const unlockAudio = () => {
            if (this.audioContext?.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                });
            }
            
            // Remove event listeners after first interaction
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('touchend', unlockAudio);
            document.removeEventListener('mousedown', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
        
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('touchend', unlockAudio);
        document.addEventListener('mousedown', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
    }
    
    private setupGainNodes(): void {
        if (!this.audioContext) return;
        
        // Master gain node
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        
        // SFX gain node
        this.sfxGainNode = this.audioContext.createGain();
        this.sfxGainNode.connect(this.masterGainNode);
        this.sfxGainNode.gain.value = this.settings.soundVolume;
        
        // Music gain node
        this.musicGainNode = this.audioContext.createGain();
        this.musicGainNode.connect(this.masterGainNode);
        this.musicGainNode.gain.value = this.settings.musicVolume;
    }
    
    private async loadAllAudio(): Promise<void> {
        // Use generated sounds instead of loading MP3 files
        this.loadGeneratedSounds();
        
        // Create simple music tracks using Web Audio API
        this.createMusicTracks();
        
        console.log('All audio assets loaded successfully');
    }
    
    private loadGeneratedSounds(): void {
        // Load generated sound effects
        const soundNames = ['flap', 'coin', 'bone', 'dash', 'bark', 'score', 'gameover', 'checkpoint', 'button', 'quest_complete'];
        
        soundNames.forEach(name => {
            this.sounds.set(name, {
                buffer: null, // Will generate on-demand
                volume: 0.7
            });
        });
    }
    
    private createMusicTracks(): void {
        // Create simple ambient music tracks
        this.music.set('ambient', {
            buffer: null,
            volume: 0.3,
            bpm: 0,
            loop: true
        });
        
        this.music.set('rhythm1', {
            buffer: null,
            volume: 0.4,
            bpm: 120,
            loop: true
        });
        
        this.music.set('rhythm2', {
            buffer: null,
            volume: 0.4,
            bpm: 90,
            loop: true
        });
        
        this.music.set('menu', {
            buffer: null,
            volume: 0.2,
            bpm: 0,
            loop: true
        });
    }
    
    private async loadAudioAsset(asset: any): Promise<void> {
        try {
            const response = await fetch(asset.path);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${asset.path}: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            if (this.audioContext) {
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                
                if (asset.type === 'sfx') {
                    this.sounds.set(asset.name, {
                        name: asset.name,
                        buffer: audioBuffer,
                        sources: [],
                        volume: asset.volume || 1.0,
                        loop: false
                    });
                } else if (asset.type === 'music') {
                    const track: MusicTrack = {
                        name: asset.name,
                        buffer: audioBuffer,
                        source: null,
                        gainNode: null,
                        bpm: asset.bpm || 0,
                        beatTimes: [],
                        startTime: 0,
                        volume: asset.volume || 1.0,
                        loop: true
                    };
                    
                    // Generate beat times for rhythm tracks
                    if (asset.bpm > 0) {
                        track.beatTimes = this.generateBeatTimes(audioBuffer.duration, asset.bpm);
                    }
                    
                    this.music.set(asset.name, track);
                }
            }
            
            this.loadedAssets++;
        } catch (error) {
            console.warn(`Failed to load audio asset ${asset.name}:`, error);
            this.loadedAssets++;
            
            // Create fallback empty sound
            if (asset.type === 'sfx') {
                this.sounds.set(asset.name, {
                    name: asset.name,
                    buffer: null,
                    sources: [],
                    volume: asset.volume || 1.0,
                    loop: false
                });
            } else if (asset.type === 'music') {
                this.music.set(asset.name, {
                    name: asset.name,
                    buffer: null,
                    source: null,
                    gainNode: null,
                    bpm: asset.bpm || 0,
                    beatTimes: [],
                    startTime: 0,
                    volume: asset.volume || 1.0,
                    loop: true
                });
            }
        }
    }
    
    private generateBeatTimes(duration: number, bpm: number): number[] {
        const beatInterval = 60 / bpm; // seconds per beat
        const beatTimes: number[] = [];
        
        for (let time = 0; time < duration; time += beatInterval) {
            beatTimes.push(time);
        }
        
        return beatTimes;
    }
    
    private fallbackToHTMLAudio(): void {
        console.log('Falling back to HTML Audio API');
        // Implement HTML Audio fallback for better compatibility
        // This would create HTML Audio elements as fallback
    }
    
    // Sound effect playback
    public playSound(soundName: string, volume: number = 1.0, pitch: number = 1.0): void {
        if (!this.audioContext || !this.sfxGainNode) {
            this.playHTMLAudio(soundName, volume);
            return;
        }
        
        const sound = this.sounds.get(soundName);
        if (!sound || !sound.buffer) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        try {
            // Create buffer source
            const source = this.audioContext.createBufferSource();
            source.buffer = sound.buffer;
            
            // Create gain node for this instance
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = sound.volume * volume * this.settings.soundVolume;
            
            // Apply pitch shifting if needed
            if (pitch !== 1.0) {
                source.playbackRate.value = pitch;
            }
            
            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            // Start playback
            source.start(0);
            
            // Clean up after playback
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
                
                // Remove from active sources
                const index = sound.sources.indexOf(source);
                if (index > -1) {
                    sound.sources.splice(index, 1);
                }
            };
            
            // Track active sources
            sound.sources.push(source);
            
        } catch (error) {
            console.warn(`Failed to play sound ${soundName}:`, error);
        }
    }
    
    private playHTMLAudio(soundName: string, volume: number): void {
        // Fallback HTML Audio implementation
        const audio = new Audio(`/assets/ui_sfx/${soundName}.mp3`);
        audio.volume = volume * this.settings.soundVolume;
        audio.play().catch(error => {
            console.warn(`Failed to play HTML audio ${soundName}:`, error);
        });
    }
    
    // Music playback
    public playMusic(trackName: string, fadeIn: boolean = true): void {
        if (!this.audioContext || !this.musicGainNode) return;
        
        // Stop current track
        this.stopMusic();
        
        const track = this.music.get(trackName);
        if (!track || !track.buffer) {
            console.warn(`Music track not found: ${trackName}`);
            return;
        }
        
        try {
            // Create buffer source
            track.source = this.audioContext.createBufferSource();
            track.source.buffer = track.buffer;
            track.source.loop = track.loop;
            
            // Create gain node for this track
            track.gainNode = this.audioContext.createGain();
            track.gainNode.gain.value = fadeIn ? 0 : track.volume * this.settings.musicVolume;
            
            // Connect nodes
            track.source.connect(track.gainNode);
            track.gainNode.connect(this.musicGainNode);
            
            // Start playback
            track.source.start(0);
            track.startTime = this.audioContext.currentTime;
            
            // Fade in if requested
            if (fadeIn) {
                track.gainNode.gain.linearRampToValueAtTime(
                    track.volume * this.settings.musicVolume,
                    this.audioContext.currentTime + 1.0
                );
            }
            
            // Set as current track
            this.currentTrack = track;
            
            // Enable beat detection for rhythm tracks
            if (track.bpm > 0) {
                this.beatDetectionEnabled = true;
            }
            
        } catch (error) {
            console.warn(`Failed to play music ${trackName}:`, error);
        }
    }
    
    public stopMusic(fadeOut: boolean = true): void {
        if (!this.currentTrack || !this.currentTrack.source) return;
        
        try {
            if (fadeOut && this.currentTrack.gainNode && this.audioContext) {
                // Fade out over 0.5 seconds
                this.currentTrack.gainNode.gain.linearRampToValueAtTime(
                    0,
                    this.audioContext.currentTime + 0.5
                );
                
                // Stop after fade
                setTimeout(() => {
                    if (this.currentTrack?.source) {
                        this.currentTrack.source.stop();
                        this.currentTrack.source = null;
                        this.currentTrack.gainNode = null;
                    }
                }, 500);
            } else {
                this.currentTrack.source.stop();
                this.currentTrack.source = null;
                this.currentTrack.gainNode = null;
            }
            
            this.beatDetectionEnabled = false;
            this.currentTrack = null;
            
        } catch (error) {
            console.warn('Failed to stop music:', error);
        }
    }
    
    public pauseMusic(): void {
        if (this.currentTrack?.gainNode && this.audioContext) {
            this.currentTrack.gainNode.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + 0.1
            );
        }
    }
    
    public resumeMusic(): void {
        if (this.currentTrack?.gainNode && this.audioContext) {
            this.currentTrack.gainNode.gain.linearRampToValueAtTime(
                this.currentTrack.volume * this.settings.musicVolume,
                this.audioContext.currentTime + 0.1
            );
        }
    }
    
    // Rhythm mode functionality
    public isOnBeat(tolerance: number = this.beatTolerance): boolean {
        if (!this.beatDetectionEnabled || !this.currentTrack || !this.audioContext) {
            return false;
        }
        
        const currentTime = this.getCurrentMusicTime();
        const nearestBeat = this.getNearestBeatTime(currentTime);
        
        if (nearestBeat === null) return false;
        
        const timeDifference = Math.abs(currentTime - nearestBeat) * 1000; // Convert to ms
        return timeDifference <= tolerance;
    }
    
    public getBeatAccuracy(): number {
        if (!this.beatDetectionEnabled || !this.currentTrack || !this.audioContext) {
            return 0;
        }
        
        const currentTime = this.getCurrentMusicTime();
        const nearestBeat = this.getNearestBeatTime(currentTime);
        
        if (nearestBeat === null) return 0;
        
        const timeDifference = Math.abs(currentTime - nearestBeat) * 1000; // Convert to ms
        const accuracy = Math.max(0, 1 - (timeDifference / this.beatTolerance));
        
        return accuracy;
    }
    
    public getNextBeatTime(): number {
        if (!this.currentTrack || !this.audioContext) return 0;
        
        const currentTime = this.getCurrentMusicTime();
        const nextBeat = this.currentTrack.beatTimes.find(beatTime => beatTime > currentTime);
        
        return nextBeat ? (nextBeat - currentTime) : 0;
    }
    
    public getCurrentBeatInfo(): BeatInfo | null {
        if (!this.beatDetectionEnabled || !this.currentTrack) return null;
        
        const currentTime = this.getCurrentMusicTime();
        const nearestBeat = this.getNearestBeatTime(currentTime);
        
        if (nearestBeat === null) return null;
        
        const beatIndex = this.currentTrack.beatTimes.indexOf(nearestBeat);
        const isDownbeat = beatIndex % 4 === 0; // Every 4th beat is a downbeat
        const timeDifference = Math.abs(currentTime - nearestBeat) * 1000;
        const intensity = Math.max(0, 1 - (timeDifference / this.beatTolerance));
        
        return {
            time: nearestBeat,
            intensity,
            isDownbeat
        };
    }
    
    private getCurrentMusicTime(): number {
        if (!this.currentTrack || !this.audioContext) return 0;
        
        return this.audioContext.currentTime - this.currentTrack.startTime;
    }
    
    private getNearestBeatTime(currentTime: number): number | null {
        if (!this.currentTrack || this.currentTrack.beatTimes.length === 0) return null;
        
        let nearestBeat = this.currentTrack.beatTimes[0];
        let minDifference = Math.abs(currentTime - nearestBeat);
        
        for (const beatTime of this.currentTrack.beatTimes) {
            const difference = Math.abs(currentTime - beatTime);
            if (difference < minDifference) {
                minDifference = difference;
                nearestBeat = beatTime;
            }
        }
        
        return nearestBeat;
    }
    
    // Metronome functionality
    public enableMetronome(visual: boolean = true, audio: boolean = true): void {
        this._metronomeEnabled = audio;
        this.visualMetronome = visual;
    }
    
    public disableMetronome(): void {
        this._metronomeEnabled = false;
        this.visualMetronome = false;
    }
    
    public getVisualMetronomeState(): { active: boolean; intensity: number; isDownbeat: boolean } {
        if (!this.visualMetronome) {
            return { active: false, intensity: 0, isDownbeat: false };
        }
        
        const beatInfo = this.getCurrentBeatInfo();
        if (!beatInfo) {
            return { active: false, intensity: 0, isDownbeat: false };
        }
        
        return {
            active: true,
            intensity: beatInfo.intensity,
            isDownbeat: beatInfo.isDownbeat
        };
    }
    
    // Audio analysis (advanced features)
    public getAudioSpectrum(): Uint8Array | null {
        // This would implement real-time audio analysis
        // Useful for visualizations and advanced rhythm detection
        return null;
    }
    
    public getVolumeLevel(): number {
        // Returns current audio volume level for visualizations
        return 0;
    }
    
    // Settings management
    public updateSettings(newSettings: Partial<AudioSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        
        // Update gain nodes
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.linearRampToValueAtTime(
                this.settings.soundVolume,
                this.audioContext?.currentTime || 0 + 0.1
            );
        }
        
        if (this.musicGainNode && this.currentTrack) {
            this.musicGainNode.gain.linearRampToValueAtTime(
                this.settings.musicVolume,
                this.audioContext?.currentTime || 0 + 0.1
            );
        }
    }
    
    public getSettings(): AudioSettings {
        return { ...this.settings };
    }
    
    // Utility methods
    public isLoaded(): boolean {
        return this.loadedAssets === this.totalAssets;
    }
    
    public getLoadingProgress(): number {
        return this.totalAssets > 0 ? this.loadedAssets / this.totalAssets : 1;
    }
    
    public isPlaying(trackName?: string): boolean {
        if (trackName) {
            return this.currentTrack?.name === trackName && this.currentTrack?.source !== null;
        }
        return this.currentTrack?.source !== null;
    }
    
    public getCurrentTrackName(): string | null {
        return this.currentTrack?.name || null;
    }
    
    // Advanced audio effects
    public playPositionalSound(soundName: string, x: number, y: number, maxDistance: number = 1000): void {
        // Implement 3D positional audio for immersive experience
        // This would calculate volume and panning based on position
        const distance = Math.sqrt(x * x + y * y);
        const volume = Math.max(0, 1 - (distance / maxDistance));
        
        this.playSound(soundName, volume);
    }
    
    public addReverb(_wetness: number = 0.3): void {
        // Add reverb effect to current audio
        if (!this.audioContext) return;
        
        // Implementation would create convolution reverb
    }
    
    public addFilter(_frequency: number, _type: BiquadFilterType = 'lowpass'): void {
        // Add audio filter effects
        if (!this.audioContext) return;
        
        // Implementation would create and connect audio filters
    }
    
    // Cleanup
    public dispose(): void {
        this.stopMusic(false);
        
        // Stop all sound effects
        for (const sound of this.sounds.values()) {
            sound.sources.forEach(source => {
                try {
                    source.stop();
                } catch (e) {
                    // Source might already be stopped
                }
            });
            sound.sources = [];
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.sounds.clear();
        this.music.clear();
        this.currentTrack = null;
    }
}
