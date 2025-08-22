/**
 * FlappyDog - UI Manager
 * Handles all UI elements, menus, modals, and user interactions
 */

export interface GameSettings {
    soundVolume: number;
    musicVolume: number;
    haptics: boolean;
    colorblind: boolean;
    highContrast: boolean;
    leftHandMode: boolean;
    motionReduced: boolean;
    screenShake: boolean;
    rhythmAssist: boolean;
}

export interface Quest {
    id: string;
    description: string;
    progress: number;
    target: number;
    completed: boolean;
    reward: string;
}

export interface Cosmetic {
    id: string;
    name: string;
    type: 'collar' | 'trail' | 'hat' | 'emote';
    unlocked: boolean;
    equipped: boolean;
}

export class UIManager {
    private overlay: HTMLElement;
    private canvas: HTMLCanvasElement | null = null;
    private gameInstance: any = null;
    private currentMenu: string = 'main';
    
    // UI State
    private settings: GameSettings = {
        soundVolume: 0.7,
        musicVolume: 0.5,
        haptics: true,
        colorblind: false,
        highContrast: false,
        leftHandMode: false,
        motionReduced: false,
        screenShake: true,
        rhythmAssist: true
    };
    
    private cosmetics: Cosmetic[] = [
        { id: 'basic_collar', name: 'Basic Collar', type: 'collar', unlocked: true, equipped: true },
        { id: 'golden_collar', name: 'Golden Collar', type: 'collar', unlocked: false, equipped: false },
        { id: 'sparkle_trail', name: 'Sparkle Trail', type: 'trail', unlocked: false, equipped: false },
        { id: 'beat_wings', name: 'Beat Wings', type: 'hat', unlocked: false, equipped: false },
        { id: 'happy_bark', name: 'Happy Bark', type: 'emote', unlocked: false, equipped: false }
    ];
    
    private toasts: Array<{
        id: string;
        message: string;
        type: 'success' | 'info' | 'warning' | 'error';
        duration: number;
        createdAt: number;
    }> = [];
    
    constructor() {
        this.overlay = document.getElementById('uiOverlay')!;
        this.setupEventListeners();
        this.loadSettings();
    }
    
    public initialize(canvas: HTMLCanvasElement, gameInstance?: any): void {
        this.canvas = canvas;
        this.gameInstance = gameInstance;
        this.createMainMenu();
    }
    
    private setupEventListeners(): void {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Handle Web Share API
        if ('share' in navigator) {
            this.setupWebShare();
        }
    }
    
    private handleResize(): void {
        // Adjust UI for different screen sizes
        const isMobile = window.innerWidth < 768;
        this.overlay.classList.toggle('mobile-layout', isMobile);
        
        if (this.settings.leftHandMode) {
            this.overlay.classList.add('left-hand-mode');
        }
    }
    
    private handleKeyboardShortcuts(e: KeyboardEvent): void {
        if (e.code === 'Escape') {
            if (this.currentMenu !== 'main') {
                this.showMenu();
            }
        }
        
        if (e.code === 'KeyS' && e.ctrlKey) {
            e.preventDefault();
            this.showSettings();
        }
        
        if (e.code === 'KeyL' && e.ctrlKey) {
            e.preventDefault();
            this.showLeaderboard();
        }
    }
    
    public showMenu(): void {
        this.currentMenu = 'main';
        this.overlay.innerHTML = this.createMainMenuHTML();
        this.bindMainMenuEvents();
        this.overlay.classList.remove('hidden');
    }
    
    private createMainMenu(): void {
        this.showMenu();
    }
    
    private createMainMenuHTML(): string {
        const leftHandClass = this.settings.leftHandMode ? 'left-hand-mode' : '';
        const highContrastClass = this.settings.highContrast ? 'high-contrast' : '';
        const colorblindClass = this.settings.colorblind ? 'colorblind-safe' : '';
        
        return `
            <div class="menu-container ${leftHandClass} ${highContrastClass} ${colorblindClass}">
                <div class="main-menu">
                    <!-- Game Logo -->
                    <div class="game-logo">
                        <h1 class="logo-text animate-bounce-gentle">🐕 FlappyDog</h1>
                        <p class="tagline">The Ultimate Flappy Experience</p>
                    </div>
                    
                    <!-- Main Buttons -->
                    <div class="button-group">
                        <button id="start-classic" class="menu-btn primary-btn animate-float">
                            <span class="btn-icon">🎮</span>
                            <span class="btn-text">Classic Mode</span>
                        </button>
                        
                        <button id="start-rhythm" class="menu-btn secondary-btn animate-float" style="animation-delay: 0.1s">
                            <span class="btn-icon">🎵</span>
                            <span class="btn-text">Rhythm Mode</span>
                        </button>
                        
                        <button id="start-checkpoint" class="menu-btn secondary-btn animate-float" style="animation-delay: 0.2s">
                            <span class="btn-icon">🏁</span>
                            <span class="btn-text">Checkpoint Mode</span>
                        </button>
                    </div>
                    
                    <!-- Secondary Buttons -->
                    <div class="button-group secondary">
                        <button id="show-leaderboard" class="menu-btn tertiary-btn">
                            <span class="btn-icon">🏆</span>
                            <span class="btn-text">Leaderboard</span>
                        </button>
                        
                        <button id="show-cosmetics" class="menu-btn tertiary-btn">
                            <span class="btn-icon">👑</span>
                            <span class="btn-text">Cosmetics</span>
                        </button>
                        
                        <button id="show-quests" class="menu-btn tertiary-btn">
                            <span class="btn-icon">📋</span>
                            <span class="btn-text">Quests</span>
                        </button>
                        
                        <button id="show-settings" class="menu-btn tertiary-btn">
                            <span class="btn-icon">⚙️</span>
                            <span class="btn-text">Settings</span>
                        </button>
                    </div>
                    
                    <!-- Upload Custom Sprite -->
                    <div class="custom-sprite-section">
                        <label for="sprite-upload" class="upload-btn">
                            <span class="btn-icon">🎨</span>
                            <span class="btn-text">Upload Custom Dog</span>
                            <input type="file" id="sprite-upload" accept="image/png,image/jpg,image/jpeg" hidden>
                        </label>
                    </div>
                    
                    <!-- Daily Challenge -->
                    <div class="daily-challenge">
                        <div class="challenge-card">
                            <h3>🌟 Daily Challenge</h3>
                            <p id="daily-seed">Seed: ${this.getDailySeed()}</p>
                            <button id="start-daily" class="challenge-btn">Play Daily</button>
                        </div>
                    </div>
                    
                    <!-- Version & Links -->
                    <div class="footer-info">
                        <p class="version">FlappyDog v1.0.0</p>
                        <div class="social-links">
                            <button id="share-game" class="link-btn">Share Game</button>
                            <a href="https://github.com/TrendsAI-bit/flappydog" target="_blank" class="link-btn">GitHub</a>
                        </div>
                    </div>
                </div>
                
                <!-- Toast Container -->
                <div id="toast-container" class="toast-container"></div>
            </div>
        `;
    }
    
    private bindMainMenuEvents(): void {
        // Game mode buttons
        document.getElementById('start-classic')?.addEventListener('click', () => {
            this.startGame('classic');
        });
        
        document.getElementById('start-rhythm')?.addEventListener('click', () => {
            this.startGame('rhythm');
        });
        
        document.getElementById('start-checkpoint')?.addEventListener('click', () => {
            this.startGame('checkpoint');
        });
        
        document.getElementById('start-daily')?.addEventListener('click', () => {
            this.startGame('daily');
        });
        
        // Menu navigation
        document.getElementById('show-leaderboard')?.addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        document.getElementById('show-cosmetics')?.addEventListener('click', () => {
            this.showCosmetics();
        });
        
        document.getElementById('show-quests')?.addEventListener('click', () => {
            this.showQuests();
        });
        
        document.getElementById('show-settings')?.addEventListener('click', () => {
            this.showSettings();
        });
        
        // Custom sprite upload
        document.getElementById('sprite-upload')?.addEventListener('change', (e) => {
            this.handleSpriteUpload(e as Event);
        });
        
        // Share game
        document.getElementById('share-game')?.addEventListener('click', () => {
            this.shareGame();
        });
    }
    
    private startGame(mode: string): void {
        this.overlay.classList.add('hidden');
        
        if (this.gameInstance) {
            this.gameInstance.setGameMode(mode);
            this.gameInstance.startGame();
        }
        
        // Add button press effect
        this.playButtonSound();
        this.addButtonPressEffect();
    }
    
    public showGameOver(score: number, bestScore: number): void {
        this.currentMenu = 'gameover';
        this.overlay.innerHTML = this.createGameOverHTML(score, bestScore);
        this.bindGameOverEvents();
        this.overlay.classList.remove('hidden');
    }
    
    private createGameOverHTML(score: number, bestScore: number): string {
        const isNewRecord = score > bestScore;
        const recordClass = isNewRecord ? 'new-record' : '';
        
        return `
            <div class="menu-container gameover-container ${recordClass}">
                <div class="gameover-menu">
                    ${isNewRecord ? '<div class="confetti-animation"></div>' : ''}
                    
                    <div class="gameover-header">
                        <h2 class="gameover-title ${isNewRecord ? 'animate-pulse-glow' : ''}">
                            ${isNewRecord ? '🏆 NEW RECORD!' : '💀 Game Over'}
                        </h2>
                    </div>
                    
                    <div class="score-display">
                        <div class="score-card current-score">
                            <h3>Score</h3>
                            <div class="score-number">${score}</div>
                        </div>
                        
                        <div class="score-card best-score">
                            <h3>Best</h3>
                            <div class="score-number">${bestScore}</div>
                        </div>
                    </div>
                    
                    <div class="gameover-actions">
                        <button id="restart-game" class="menu-btn primary-btn">
                            <span class="btn-icon">🔄</span>
                            <span class="btn-text">Play Again</span>
                        </button>
                        
                        <button id="watch-replay" class="menu-btn secondary-btn">
                            <span class="btn-icon">👁️</span>
                            <span class="btn-text">Watch Replay</span>
                        </button>
                        
                        <button id="share-score" class="menu-btn secondary-btn">
                            <span class="btn-icon">📱</span>
                            <span class="btn-text">Share Score</span>
                        </button>
                        
                        <button id="back-to-menu" class="menu-btn tertiary-btn">
                            <span class="btn-icon">🏠</span>
                            <span class="btn-text">Main Menu</span>
                        </button>
                    </div>
                    
                    <div class="quest-progress">
                        <h4>Quest Progress</h4>
                        <div id="quest-updates"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    private bindGameOverEvents(): void {
        document.getElementById('restart-game')?.addEventListener('click', () => {
            this.startGame('classic');
        });
        
        document.getElementById('watch-replay')?.addEventListener('click', () => {
            this.watchReplay();
        });
        
        document.getElementById('share-score')?.addEventListener('click', () => {
            this.shareScore();
        });
        
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMenu();
        });
    }
    
    public showPauseMenu(): void {
        this.currentMenu = 'pause';
        this.overlay.innerHTML = this.createPauseMenuHTML();
        this.bindPauseMenuEvents();
        this.overlay.classList.remove('hidden');
    }
    
    private createPauseMenuHTML(): string {
        return `
            <div class="menu-container pause-container">
                <div class="pause-menu">
                    <h2 class="pause-title">⏸️ Paused</h2>
                    
                    <div class="pause-actions">
                        <button id="resume-game" class="menu-btn primary-btn">
                            <span class="btn-icon">▶️</span>
                            <span class="btn-text">Resume</span>
                        </button>
                        
                        <button id="pause-settings" class="menu-btn secondary-btn">
                            <span class="btn-icon">⚙️</span>
                            <span class="btn-text">Settings</span>
                        </button>
                        
                        <button id="pause-restart" class="menu-btn secondary-btn">
                            <span class="btn-icon">🔄</span>
                            <span class="btn-text">Restart</span>
                        </button>
                        
                        <button id="pause-menu" class="menu-btn tertiary-btn">
                            <span class="btn-icon">🏠</span>
                            <span class="btn-text">Main Menu</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    private bindPauseMenuEvents(): void {
        document.getElementById('resume-game')?.addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('pause-settings')?.addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('pause-restart')?.addEventListener('click', () => {
            this.startGame('classic');
        });
        
        document.getElementById('pause-menu')?.addEventListener('click', () => {
            this.showMenu();
        });
    }
    
    public showSettings(): void {
        this.currentMenu = 'settings';
        this.overlay.innerHTML = this.createSettingsHTML();
        this.bindSettingsEvents();
        this.overlay.classList.remove('hidden');
    }
    
    private createSettingsHTML(): string {
        return `
            <div class="menu-container settings-container">
                <div class="settings-menu">
                    <div class="settings-header">
                        <h2 class="settings-title">⚙️ Settings</h2>
                        <button id="close-settings" class="close-btn">✕</button>
                    </div>
                    
                    <div class="settings-content">
                        <!-- Audio Settings -->
                        <div class="settings-section">
                            <h3>🔊 Audio</h3>
                            
                            <div class="setting-item">
                                <label for="sound-volume">Sound Volume</label>
                                <div class="slider-container">
                                    <input type="range" id="sound-volume" min="0" max="1" step="0.1" value="${this.settings.soundVolume}">
                                    <span class="slider-value">${Math.round(this.settings.soundVolume * 100)}%</span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="music-volume">Music Volume</label>
                                <div class="slider-container">
                                    <input type="range" id="music-volume" min="0" max="1" step="0.1" value="${this.settings.musicVolume}">
                                    <span class="slider-value">${Math.round(this.settings.musicVolume * 100)}%</span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="haptics">Haptic Feedback</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="haptics" ${this.settings.haptics ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Visual Settings -->
                        <div class="settings-section">
                            <h3>👁️ Visual</h3>
                            
                            <div class="setting-item">
                                <label for="colorblind">Colorblind Safe</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="colorblind" ${this.settings.colorblind ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="high-contrast">High Contrast</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="high-contrast" ${this.settings.highContrast ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="screen-shake">Screen Shake</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="screen-shake" ${this.settings.screenShake ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="motion-reduced">Reduce Motion</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="motion-reduced" ${this.settings.motionReduced ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Accessibility Settings -->
                        <div class="settings-section">
                            <h3>♿ Accessibility</h3>
                            
                            <div class="setting-item">
                                <label for="left-hand-mode">Left Hand Mode</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="left-hand-mode" ${this.settings.leftHandMode ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="rhythm-assist">Rhythm Assist</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="rhythm-assist" ${this.settings.rhythmAssist ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Data Settings -->
                        <div class="settings-section">
                            <h3>💾 Data</h3>
                            
                            <div class="setting-item">
                                <button id="reset-scores" class="danger-btn">Reset All Scores</button>
                            </div>
                            
                            <div class="setting-item">
                                <button id="reset-cosmetics" class="danger-btn">Reset Cosmetics</button>
                            </div>
                            
                            <div class="setting-item">
                                <button id="export-data" class="secondary-btn">Export Data</button>
                                <button id="import-data" class="secondary-btn">Import Data</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-footer">
                        <button id="reset-defaults" class="tertiary-btn">Reset to Defaults</button>
                        <button id="save-settings" class="primary-btn">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    private bindSettingsEvents(): void {
        // Close button
        document.getElementById('close-settings')?.addEventListener('click', () => {
            this.showMenu();
        });
        
        // Audio settings
        const soundVolumeSlider = document.getElementById('sound-volume') as HTMLInputElement;
        soundVolumeSlider?.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value);
            this.settings.soundVolume = value;
            this.updateSliderDisplay('sound-volume', value);
        });
        
        const musicVolumeSlider = document.getElementById('music-volume') as HTMLInputElement;
        musicVolumeSlider?.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value);
            this.settings.musicVolume = value;
            this.updateSliderDisplay('music-volume', value);
        });
        
        // Toggle settings
        const toggles = ['haptics', 'colorblind', 'high-contrast', 'screen-shake', 'motion-reduced', 'left-hand-mode', 'rhythm-assist'];
        toggles.forEach(toggleId => {
            document.getElementById(toggleId)?.addEventListener('change', (e) => {
                const checked = (e.target as HTMLInputElement).checked;
                this.updateSetting(toggleId, checked);
            });
        });
        
        // Data actions
        document.getElementById('reset-scores')?.addEventListener('click', () => {
            this.resetScores();
        });
        
        document.getElementById('reset-cosmetics')?.addEventListener('click', () => {
            this.resetCosmetics();
        });
        
        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-data')?.addEventListener('click', () => {
            this.importData();
        });
        
        // Footer actions
        document.getElementById('reset-defaults')?.addEventListener('click', () => {
            this.resetToDefaults();
        });
        
        document.getElementById('save-settings')?.addEventListener('click', () => {
            this.saveSettings();
            this.showToast('Settings saved!', 'success');
            this.showMenu();
        });
    }
    
    public showLeaderboard(): void {
        this.currentMenu = 'leaderboard';
        this.overlay.innerHTML = this.createLeaderboardHTML();
        this.bindLeaderboardEvents();
        this.overlay.classList.remove('hidden');
    }
    
    private createLeaderboardHTML(): string {
        return `
            <div class="menu-container leaderboard-container">
                <div class="leaderboard-menu">
                    <div class="leaderboard-header">
                        <h2 class="leaderboard-title">🏆 Leaderboard</h2>
                        <button id="close-leaderboard" class="close-btn">✕</button>
                    </div>
                    
                    <div class="leaderboard-tabs">
                        <button id="tab-daily" class="tab-btn active">Daily</button>
                        <button id="tab-alltime" class="tab-btn">All Time</button>
                    </div>
                    
                    <div class="leaderboard-content">
                        <div id="daily-leaderboard" class="leaderboard-tab active">
                            <div class="leaderboard-list">
                                <div class="loading-placeholder">Loading daily scores...</div>
                            </div>
                        </div>
                        
                        <div id="alltime-leaderboard" class="leaderboard-tab">
                            <div class="leaderboard-list">
                                <div class="loading-placeholder">Loading all-time scores...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="leaderboard-footer">
                        <button id="refresh-leaderboard" class="secondary-btn">🔄 Refresh</button>
                        <button id="back-from-leaderboard" class="primary-btn">Back</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    private bindLeaderboardEvents(): void {
        document.getElementById('close-leaderboard')?.addEventListener('click', () => {
            this.showMenu();
        });
        
        document.getElementById('tab-daily')?.addEventListener('click', () => {
            this.switchLeaderboardTab('daily');
        });
        
        document.getElementById('tab-alltime')?.addEventListener('click', () => {
            this.switchLeaderboardTab('alltime');
        });
        
        document.getElementById('refresh-leaderboard')?.addEventListener('click', () => {
            this.refreshLeaderboard();
        });
        
        document.getElementById('back-from-leaderboard')?.addEventListener('click', () => {
            this.showMenu();
        });
    }
    
    public showCosmetics(): void {
        this.currentMenu = 'cosmetics';
        this.overlay.innerHTML = this.createCosmeticsHTML();
        this.bindCosmeticsEvents();
        this.overlay.classList.remove('hidden');
    }
    
    private createCosmeticsHTML(): string {
        const cosmeticsByType = this.cosmetics.reduce((acc, cosmetic) => {
            if (!acc[cosmetic.type]) acc[cosmetic.type] = [];
            acc[cosmetic.type].push(cosmetic);
            return acc;
        }, {} as Record<string, Cosmetic[]>);
        
        let cosmeticsHTML = '';
        Object.entries(cosmeticsByType).forEach(([type, items]) => {
            const typeIcon = this.getCosmeticTypeIcon(type);
            const typeName = type.charAt(0).toUpperCase() + type.slice(1) + 's';
            
            cosmeticsHTML += `
                <div class="cosmetic-category">
                    <h3>${typeIcon} ${typeName}</h3>
                    <div class="cosmetic-grid">
                        ${items.map(item => this.createCosmeticItemHTML(item)).join('')}
                    </div>
                </div>
            `;
        });
        
        return `
            <div class="menu-container cosmetics-container">
                <div class="cosmetics-menu">
                    <div class="cosmetics-header">
                        <h2 class="cosmetics-title">👑 Cosmetics</h2>
                        <button id="close-cosmetics" class="close-btn">✕</button>
                    </div>
                    
                    <div class="cosmetics-content">
                        ${cosmeticsHTML}
                    </div>
                    
                    <div class="cosmetics-footer">
                        <p class="unlock-hint">Complete quests to unlock new cosmetics!</p>
                        <button id="back-from-cosmetics" class="primary-btn">Back</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    private createCosmeticItemHTML(cosmetic: Cosmetic): string {
        const lockedClass = !cosmetic.unlocked ? 'locked' : '';
        const equippedClass = cosmetic.equipped ? 'equipped' : '';
        const icon = this.getCosmeticIcon(cosmetic.id);
        
        return `
            <div class="cosmetic-item ${lockedClass} ${equippedClass}" data-cosmetic-id="${cosmetic.id}">
                <div class="cosmetic-icon">${icon}</div>
                <div class="cosmetic-name">${cosmetic.name}</div>
                ${cosmetic.unlocked ? 
                    `<button class="cosmetic-btn ${cosmetic.equipped ? 'equipped' : 'equip'}" data-cosmetic-id="${cosmetic.id}">
                        ${cosmetic.equipped ? '✓ Equipped' : 'Equip'}
                    </button>` :
                    '<div class="cosmetic-locked">🔒 Locked</div>'
                }
            </div>
        `;
    }
    
    private bindCosmeticsEvents(): void {
        document.getElementById('close-cosmetics')?.addEventListener('click', () => {
            this.showMenu();
        });
        
        document.getElementById('back-from-cosmetics')?.addEventListener('click', () => {
            this.showMenu();
        });
        
        // Cosmetic equip buttons
        document.querySelectorAll('.cosmetic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cosmeticId = (e.target as HTMLElement).dataset.cosmeticId;
                if (cosmeticId) {
                    this.equipCosmetic(cosmeticId);
                }
            });
        });
    }
    
    public showQuests(): void {
        this.currentMenu = 'quests';
        this.overlay.innerHTML = this.createQuestsHTML();
        this.bindQuestsEvents();
        this.overlay.classList.remove('hidden');
    }
    
    private createQuestsHTML(): string {
        // This would be populated with actual quest data
        const mockQuests = [
            { id: '1', description: 'Pass 10 gates without gliding', progress: 3, target: 10, completed: false, reward: 'Golden Collar' },
            { id: '2', description: 'Collect 5 coins in one run', progress: 5, target: 5, completed: true, reward: 'Sparkle Trail' },
            { id: '3', description: 'Get 15 perfect beats in rhythm mode', progress: 8, target: 15, completed: false, reward: 'Beat Wings' }
        ];
        
        const questsHTML = mockQuests.map(quest => `
            <div class="quest-item ${quest.completed ? 'completed' : ''}">
                <div class="quest-icon">${quest.completed ? '✅' : '📋'}</div>
                <div class="quest-content">
                    <div class="quest-description">${quest.description}</div>
                    <div class="quest-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(quest.progress / quest.target) * 100}%"></div>
                        </div>
                        <span class="progress-text">${quest.progress}/${quest.target}</span>
                    </div>
                    <div class="quest-reward">Reward: ${quest.reward}</div>
                </div>
                ${quest.completed ? '<button class="claim-btn">Claim</button>' : ''}
            </div>
        `).join('');
        
        return `
            <div class="menu-container quests-container">
                <div class="quests-menu">
                    <div class="quests-header">
                        <h2 class="quests-title">📋 Quests</h2>
                        <button id="close-quests" class="close-btn">✕</button>
                    </div>
                    
                    <div class="quests-content">
                        <div class="quests-list">
                            ${questsHTML}
                        </div>
                    </div>
                    
                    <div class="quests-footer">
                        <p class="quests-hint">Complete quests to unlock cosmetics and earn rewards!</p>
                        <button id="back-from-quests" class="primary-btn">Back</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    private bindQuestsEvents(): void {
        document.getElementById('close-quests')?.addEventListener('click', () => {
            this.showMenu();
        });
        
        document.getElementById('back-from-quests')?.addEventListener('click', () => {
            this.showMenu();
        });
        
        // Claim buttons
        document.querySelectorAll('.claim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.claimQuestReward(e.target as HTMLElement);
            });
        });
    }
    
    // Toast system
    public showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', duration: number = 3000): void {
        const toast = {
            id: Math.random().toString(36).substr(2, 9),
            message,
            type,
            duration,
            createdAt: Date.now()
        };
        
        this.toasts.push(toast);
        this.renderToasts();
        
        setTimeout(() => {
            this.removeToast(toast.id);
        }, duration);
    }
    
    private renderToasts(): void {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        container.innerHTML = this.toasts.map(toast => `
            <div class="toast toast-${toast.type}" data-toast-id="${toast.id}">
                <div class="toast-icon">${this.getToastIcon(toast.type)}</div>
                <div class="toast-message">${toast.message}</div>
                <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
            </div>
        `).join('');
    }
    
    private removeToast(id: string): void {
        this.toasts = this.toasts.filter(toast => toast.id !== id);
        const toastElement = document.querySelector(`[data-toast-id="${id}"]`);
        if (toastElement) {
            toastElement.classList.add('toast-fadeout');
            setTimeout(() => toastElement.remove(), 300);
        }
    }
    
    private getToastIcon(type: string): string {
        const icons = {
            success: '✅',
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type as keyof typeof icons] || icons.info;
    }
    
    // Utility methods
    private getDailySeed(): string {
        const today = new Date();
        return `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    }
    
    private getCosmeticTypeIcon(type: string): string {
        const icons = {
            collar: '🎀',
            trail: '✨',
            hat: '🎩',
            emote: '😊'
        };
        return icons[type as keyof typeof icons] || '🎨';
    }
    
    private getCosmeticIcon(id: string): string {
        const icons: Record<string, string> = {
            basic_collar: '🎀',
            golden_collar: '👑',
            sparkle_trail: '✨',
            beat_wings: '🎵',
            happy_bark: '😊'
        };
        return icons[id] || '🎨';
    }
    
    private updateSliderDisplay(sliderId: string, value: number): void {
        const valueDisplay = document.querySelector(`#${sliderId} + .slider-container .slider-value`);
        if (valueDisplay) {
            valueDisplay.textContent = `${Math.round(value * 100)}%`;
        }
    }
    
    private updateSetting(settingKey: string, value: boolean): void {
        const key = settingKey.replace('-', '') as keyof GameSettings;
        if (key in this.settings) {
            (this.settings as any)[key] = value;
        }
    }
    
    // Event handlers
    private resumeGame(): void {
        this.overlay.classList.add('hidden');
        if (this.gameInstance) {
            this.gameInstance.resumeGame();
        }
    }
    
    private watchReplay(): void {
        this.showToast('Replay feature coming soon!', 'info');
    }
    
    private shareScore(): void {
        if ('share' in navigator) {
            navigator.share({
                title: 'FlappyDog Score',
                text: `I just scored ${this.getLastScore()} points in FlappyDog!`,
                url: window.location.href
            });
        } else {
            this.copyToClipboard(`I just scored ${this.getLastScore()} points in FlappyDog! Play at ${window.location.href}`);
            this.showToast('Score copied to clipboard!', 'success');
        }
    }
    
    private shareGame(): void {
        if ('share' in navigator) {
            navigator.share({
                title: 'FlappyDog - The Ultimate Flappy Game',
                text: 'Check out this amazing Flappy-style game with rhythm mode and awesome features!',
                url: window.location.href
            });
        } else {
            this.copyToClipboard(`Check out FlappyDog - The Ultimate Flappy Game! ${window.location.href}`);
            this.showToast('Game link copied to clipboard!', 'success');
        }
    }
    
    private handleSpriteUpload(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file && this.gameInstance) {
            this.gameInstance.uploadCustomSprite(file);
            this.showToast('Custom sprite uploaded!', 'success');
        }
    }
    
    private switchLeaderboardTab(tab: string): void {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.leaderboard-tab').forEach(tab => tab.classList.remove('active'));
        
        document.getElementById(`tab-${tab}`)?.classList.add('active');
        document.getElementById(`${tab}-leaderboard`)?.classList.add('active');
    }
    
    private refreshLeaderboard(): void {
        this.showToast('Leaderboard refreshed!', 'success');
        // Implementation would refresh leaderboard data
    }
    
    private equipCosmetic(cosmeticId: string): void {
        const cosmetic = this.cosmetics.find(c => c.id === cosmeticId);
        if (cosmetic && cosmetic.unlocked) {
            // Unequip other items of the same type
            this.cosmetics.forEach(c => {
                if (c.type === cosmetic.type) {
                    c.equipped = false;
                }
            });
            
            // Equip the selected item
            cosmetic.equipped = true;
            this.saveCosmetics();
            this.showToast(`${cosmetic.name} equipped!`, 'success');
            this.showCosmetics(); // Refresh the cosmetics view
        }
    }
    
    private claimQuestReward(button: HTMLElement): void {
        button.textContent = 'Claimed!';
        button.disabled = true;
        this.showToast('Quest reward claimed!', 'success');
    }
    
    private resetScores(): void {
        if (confirm('Are you sure you want to reset all scores? This cannot be undone.')) {
            localStorage.removeItem('flappydog-bestscore');
            localStorage.removeItem('flappydog-leaderboard');
            this.showToast('All scores reset!', 'success');
        }
    }
    
    private resetCosmetics(): void {
        if (confirm('Are you sure you want to reset all cosmetics? This cannot be undone.')) {
            this.cosmetics.forEach(cosmetic => {
                cosmetic.unlocked = cosmetic.id === 'basic_collar';
                cosmetic.equipped = cosmetic.id === 'basic_collar';
            });
            this.saveCosmetics();
            this.showToast('Cosmetics reset!', 'success');
        }
    }
    
    private exportData(): void {
        const data = {
            settings: this.settings,
            cosmetics: this.cosmetics,
            bestScore: localStorage.getItem('flappydog-bestscore')
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flappydog-data.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported!', 'success');
    }
    
    private importData(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target?.result as string);
                        if (data.settings) this.settings = data.settings;
                        if (data.cosmetics) this.cosmetics = data.cosmetics;
                        if (data.bestScore) localStorage.setItem('flappydog-bestscore', data.bestScore);
                        
                        this.saveSettings();
                        this.saveCosmetics();
                        this.showToast('Data imported!', 'success');
                    } catch (error) {
                        this.showToast('Invalid data file!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    private resetToDefaults(): void {
        if (confirm('Reset all settings to default values?')) {
            this.settings = {
                soundVolume: 0.7,
                musicVolume: 0.5,
                haptics: true,
                colorblind: false,
                highContrast: false,
                leftHandMode: false,
                motionReduced: false,
                screenShake: true,
                rhythmAssist: true
            };
            this.showSettings(); // Refresh the settings view
            this.showToast('Settings reset to defaults!', 'success');
        }
    }
    
    private playButtonSound(): void {
        // Play button press sound if available
    }
    
    private addButtonPressEffect(): void {
        // Add visual button press effect
    }
    
    private copyToClipboard(text: string): void {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
    
    private getLastScore(): number {
        // This would get the last game score
        return 0;
    }
    
    private setupWebShare(): void {
        // Setup Web Share API if available
    }
    
    // Data persistence
    private loadSettings(): void {
        const saved = localStorage.getItem('flappydog-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        const savedCosmetics = localStorage.getItem('flappydog-cosmetics');
        if (savedCosmetics) {
            this.cosmetics = JSON.parse(savedCosmetics);
        }
    }
    
    private saveSettings(): void {
        localStorage.setItem('flappydog-settings', JSON.stringify(this.settings));
        
        if (this.gameInstance) {
            this.gameInstance.updateSettings(this.settings);
        }
    }
    
    private saveCosmetics(): void {
        localStorage.setItem('flappydog-cosmetics', JSON.stringify(this.cosmetics));
    }
    
    // Public API
    public getSettings(): GameSettings {
        return { ...this.settings };
    }
    
    public updateQuest(questId: string, progress: number): void {
        // Update quest progress and show toast if completed
    }
    
    public unlockCosmetic(cosmeticId: string): void {
        const cosmetic = this.cosmetics.find(c => c.id === cosmeticId);
        if (cosmetic && !cosmetic.unlocked) {
            cosmetic.unlocked = true;
            this.saveCosmetics();
            this.showToast(`🎉 Unlocked: ${cosmetic.name}!`, 'success', 5000);
        }
    }
}
