class v{constructor(){this._canvas=null,this.gameInstance=null,this.currentMenu="main",this.settings={soundVolume:.7,musicVolume:.5,haptics:!0,colorblind:!1,highContrast:!1,leftHandMode:!1,motionReduced:!1,screenShake:!0,rhythmAssist:!0},this.cosmetics=[{id:"basic_collar",name:"Basic Collar",type:"collar",unlocked:!0,equipped:!0},{id:"golden_collar",name:"Golden Collar",type:"collar",unlocked:!1,equipped:!1},{id:"sparkle_trail",name:"Sparkle Trail",type:"trail",unlocked:!1,equipped:!1},{id:"beat_wings",name:"Beat Wings",type:"hat",unlocked:!1,equipped:!1},{id:"happy_bark",name:"Happy Bark",type:"emote",unlocked:!1,equipped:!1}],this.toasts=[],this.overlay=document.getElementById("uiOverlay"),this.setupEventListeners(),this.loadSettings()}initialize(e,t){this._canvas=e,this.gameInstance=t,this.createMainMenu()}setupEventListeners(){window.addEventListener("resize",()=>{this.handleResize()}),document.addEventListener("keydown",e=>{this.handleKeyboardShortcuts(e)}),"share"in navigator&&this.setupWebShare()}handleResize(){const e=window.innerWidth<768;this.overlay.classList.toggle("mobile-layout",e),this.settings.leftHandMode&&this.overlay.classList.add("left-hand-mode")}handleKeyboardShortcuts(e){if(e.code==="Escape"&&this.currentMenu!=="main"&&this.showMenu(),e.code==="KeyS"&&e.ctrlKey&&(e.preventDefault(),this.showSettings()),e.code==="KeyL"&&e.ctrlKey&&(e.preventDefault(),this.showLeaderboard()),(e.code==="ArrowDown"||e.code==="ArrowUp")&&this.handleArrowKeyNavigation(e.code==="ArrowDown"?1:-1),e.code==="Enter"||e.code==="Space"){const t=document.activeElement;t&&t.tagName==="BUTTON"&&t.click()}}handleArrowKeyNavigation(e){const t=this.overlay.querySelectorAll('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(t.length===0)return;let a=Array.from(t).indexOf(document.activeElement)+e;a<0&&(a=t.length-1),a>=t.length&&(a=0),t[a].focus()}showMenu(){this.currentMenu="main",this.overlay.innerHTML=this.createMainMenuHTML(),this.bindMainMenuEvents(),this.overlay.classList.remove("hidden")}createMainMenu(){this.showMenu()}createMainMenuHTML(){const e=this.settings.leftHandMode?"left-hand-mode":"",t=this.settings.highContrast?"high-contrast":"",s=this.settings.colorblind?"colorblind-safe":"";return`
            <div class="menu-container ${e} ${t} ${s}">
                <div class="main-menu">
                    <!-- Game Logo -->
                    <div class="game-logo">
                        <h1 class="logo-text animate-bounce-gentle">🐕 FlappyDog</h1>
                        <p class="tagline">The Ultimate Flappy Experience</p>
                    </div>
                    
                    <!-- Main Buttons -->
                    <div class="button-group" role="group" aria-label="Game Mode Selection">
                        <button id="start-classic" class="menu-btn primary-btn animate-float" 
                                aria-label="Start Classic Mode - Traditional Flappy gameplay">
                            <span class="btn-icon" aria-hidden="true">🎮</span>
                            <span class="btn-text">Classic Mode</span>
                        </button>
                        
                        <button id="start-rhythm" class="menu-btn secondary-btn animate-float" 
                                style="animation-delay: 0.1s"
                                aria-label="Start Rhythm Mode - Obstacles sync to music beats">
                            <span class="btn-icon" aria-hidden="true">🎵</span>
                            <span class="btn-text">Rhythm Mode</span>
                        </button>
                        
                        <button id="start-checkpoint" class="menu-btn secondary-btn animate-float" 
                                style="animation-delay: 0.2s"
                                aria-label="Start Checkpoint Mode - Save progress every 30 points">
                            <span class="btn-icon" aria-hidden="true">🏁</span>
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
        `}bindMainMenuEvents(){var e,t,s,a,i,c,o,n,r,u;(e=document.getElementById("start-classic"))==null||e.addEventListener("click",()=>{this.startGame("classic")}),(t=document.getElementById("start-rhythm"))==null||t.addEventListener("click",()=>{this.startGame("rhythm")}),(s=document.getElementById("start-checkpoint"))==null||s.addEventListener("click",()=>{this.startGame("checkpoint")}),(a=document.getElementById("start-daily"))==null||a.addEventListener("click",()=>{this.startGame("daily")}),(i=document.getElementById("show-leaderboard"))==null||i.addEventListener("click",()=>{this.showLeaderboard()}),(c=document.getElementById("show-cosmetics"))==null||c.addEventListener("click",()=>{this.showCosmetics()}),(o=document.getElementById("show-quests"))==null||o.addEventListener("click",()=>{this.showQuests()}),(n=document.getElementById("show-settings"))==null||n.addEventListener("click",()=>{this.showSettings()}),(r=document.getElementById("sprite-upload"))==null||r.addEventListener("change",d=>{this.handleSpriteUpload(d)}),(u=document.getElementById("share-game"))==null||u.addEventListener("click",()=>{this.shareGame()})}startGame(e){this.overlay.classList.add("hidden"),this.gameInstance&&(this.gameInstance.setGameMode(e),this.gameInstance.startGame()),this.playButtonSound(),this.addButtonPressEffect()}showGameOver(e,t){this.currentMenu="gameover",this.overlay.innerHTML=this.createGameOverHTML(e,t),this.bindGameOverEvents(),this.overlay.classList.remove("hidden")}createGameOverHTML(e,t){const s=e>t;return`
            <div class="menu-container gameover-container ${s?"new-record":""}">
                <div class="gameover-menu">
                    ${s?'<div class="confetti-animation"></div>':""}
                    
                    <div class="gameover-header">
                        <h2 class="gameover-title ${s?"animate-pulse-glow":""}">
                            ${s?"🏆 NEW RECORD!":"💀 Game Over"}
                        </h2>
                    </div>
                    
                    <div class="score-display">
                        <div class="score-card current-score">
                            <h3>Score</h3>
                            <div class="score-number">${e}</div>
                        </div>
                        
                        <div class="score-card best-score">
                            <h3>Best</h3>
                            <div class="score-number">${t}</div>
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
        `}bindGameOverEvents(){var e,t,s,a;(e=document.getElementById("restart-game"))==null||e.addEventListener("click",()=>{this.startGame("classic")}),(t=document.getElementById("watch-replay"))==null||t.addEventListener("click",()=>{this.watchReplay()}),(s=document.getElementById("share-score"))==null||s.addEventListener("click",()=>{this.shareScore()}),(a=document.getElementById("back-to-menu"))==null||a.addEventListener("click",()=>{this.showMenu()})}showPauseMenu(){this.currentMenu="pause",this.overlay.innerHTML=this.createPauseMenuHTML(),this.bindPauseMenuEvents(),this.overlay.classList.remove("hidden")}createPauseMenuHTML(){return`
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
        `}bindPauseMenuEvents(){var e,t,s,a;(e=document.getElementById("resume-game"))==null||e.addEventListener("click",()=>{this.resumeGame()}),(t=document.getElementById("pause-settings"))==null||t.addEventListener("click",()=>{this.showSettings()}),(s=document.getElementById("pause-restart"))==null||s.addEventListener("click",()=>{this.startGame("classic")}),(a=document.getElementById("pause-menu"))==null||a.addEventListener("click",()=>{this.showMenu()})}showSettings(){this.currentMenu="settings",this.overlay.innerHTML=this.createSettingsHTML(),this.bindSettingsEvents(),this.overlay.classList.remove("hidden")}createSettingsHTML(){return`
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
                                    <span class="slider-value">${Math.round(this.settings.soundVolume*100)}%</span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="music-volume">Music Volume</label>
                                <div class="slider-container">
                                    <input type="range" id="music-volume" min="0" max="1" step="0.1" value="${this.settings.musicVolume}">
                                    <span class="slider-value">${Math.round(this.settings.musicVolume*100)}%</span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="haptics">Haptic Feedback</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="haptics" ${this.settings.haptics?"checked":""}>
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
                                    <input type="checkbox" id="colorblind" ${this.settings.colorblind?"checked":""}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="high-contrast">High Contrast</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="high-contrast" ${this.settings.highContrast?"checked":""}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="screen-shake">Screen Shake</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="screen-shake" ${this.settings.screenShake?"checked":""}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="motion-reduced">Reduce Motion</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="motion-reduced" ${this.settings.motionReduced?"checked":""}>
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
                                    <input type="checkbox" id="left-hand-mode" ${this.settings.leftHandMode?"checked":""}>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="rhythm-assist">Rhythm Assist</label>
                                <div class="toggle-container">
                                    <input type="checkbox" id="rhythm-assist" ${this.settings.rhythmAssist?"checked":""}>
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
        `}bindSettingsEvents(){var a,i,c,o,n,r,u;(a=document.getElementById("close-settings"))==null||a.addEventListener("click",()=>{this.showMenu()});const e=document.getElementById("sound-volume");e==null||e.addEventListener("input",d=>{const l=parseFloat(d.target.value);this.settings.soundVolume=l,this.updateSliderDisplay("sound-volume",l)});const t=document.getElementById("music-volume");t==null||t.addEventListener("input",d=>{const l=parseFloat(d.target.value);this.settings.musicVolume=l,this.updateSliderDisplay("music-volume",l)}),["haptics","colorblind","high-contrast","screen-shake","motion-reduced","left-hand-mode","rhythm-assist"].forEach(d=>{var l;(l=document.getElementById(d))==null||l.addEventListener("change",h=>{const m=h.target.checked;this.updateSetting(d,m)})}),(i=document.getElementById("reset-scores"))==null||i.addEventListener("click",()=>{this.resetScores()}),(c=document.getElementById("reset-cosmetics"))==null||c.addEventListener("click",()=>{this.resetCosmetics()}),(o=document.getElementById("export-data"))==null||o.addEventListener("click",()=>{this.exportData()}),(n=document.getElementById("import-data"))==null||n.addEventListener("click",()=>{this.importData()}),(r=document.getElementById("reset-defaults"))==null||r.addEventListener("click",()=>{this.resetToDefaults()}),(u=document.getElementById("save-settings"))==null||u.addEventListener("click",()=>{this.saveSettings(),this.showToast("Settings saved!","success"),this.showMenu()})}showLeaderboard(){this.currentMenu="leaderboard",this.overlay.innerHTML=this.createLeaderboardHTML(),this.bindLeaderboardEvents(),this.overlay.classList.remove("hidden")}createLeaderboardHTML(){return`
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
        `}bindLeaderboardEvents(){var e,t,s,a,i;(e=document.getElementById("close-leaderboard"))==null||e.addEventListener("click",()=>{this.showMenu()}),(t=document.getElementById("tab-daily"))==null||t.addEventListener("click",()=>{this.switchLeaderboardTab("daily")}),(s=document.getElementById("tab-alltime"))==null||s.addEventListener("click",()=>{this.switchLeaderboardTab("alltime")}),(a=document.getElementById("refresh-leaderboard"))==null||a.addEventListener("click",()=>{this.refreshLeaderboard()}),(i=document.getElementById("back-from-leaderboard"))==null||i.addEventListener("click",()=>{this.showMenu()})}showCosmetics(){this.currentMenu="cosmetics",this.overlay.innerHTML=this.createCosmeticsHTML(),this.bindCosmeticsEvents(),this.overlay.classList.remove("hidden")}createCosmeticsHTML(){const e=this.cosmetics.reduce((s,a)=>(s[a.type]||(s[a.type]=[]),s[a.type].push(a),s),{});let t="";return Object.entries(e).forEach(([s,a])=>{const i=this.getCosmeticTypeIcon(s),c=s.charAt(0).toUpperCase()+s.slice(1)+"s";t+=`
                <div class="cosmetic-category">
                    <h3>${i} ${c}</h3>
                    <div class="cosmetic-grid">
                        ${a.map(o=>this.createCosmeticItemHTML(o)).join("")}
                    </div>
                </div>
            `}),`
            <div class="menu-container cosmetics-container">
                <div class="cosmetics-menu">
                    <div class="cosmetics-header">
                        <h2 class="cosmetics-title">👑 Cosmetics</h2>
                        <button id="close-cosmetics" class="close-btn">✕</button>
                    </div>
                    
                    <div class="cosmetics-content">
                        ${t}
                    </div>
                    
                    <div class="cosmetics-footer">
                        <p class="unlock-hint">Complete quests to unlock new cosmetics!</p>
                        <button id="back-from-cosmetics" class="primary-btn">Back</button>
                    </div>
                </div>
            </div>
        `}createCosmeticItemHTML(e){const t=e.unlocked?"":"locked",s=e.equipped?"equipped":"",a=this.getCosmeticIcon(e.id);return`
            <div class="cosmetic-item ${t} ${s}" data-cosmetic-id="${e.id}">
                <div class="cosmetic-icon">${a}</div>
                <div class="cosmetic-name">${e.name}</div>
                ${e.unlocked?`<button class="cosmetic-btn ${e.equipped?"equipped":"equip"}" data-cosmetic-id="${e.id}">
                        ${e.equipped?"✓ Equipped":"Equip"}
                    </button>`:'<div class="cosmetic-locked">🔒 Locked</div>'}
            </div>
        `}bindCosmeticsEvents(){var e,t;(e=document.getElementById("close-cosmetics"))==null||e.addEventListener("click",()=>{this.showMenu()}),(t=document.getElementById("back-from-cosmetics"))==null||t.addEventListener("click",()=>{this.showMenu()}),document.querySelectorAll(".cosmetic-btn").forEach(s=>{s.addEventListener("click",a=>{const i=a.target.dataset.cosmeticId;i&&this.equipCosmetic(i)})})}showQuests(){this.currentMenu="quests",this.overlay.innerHTML=this.createQuestsHTML(),this.bindQuestsEvents(),this.overlay.classList.remove("hidden")}createQuestsHTML(){return`
            <div class="menu-container quests-container">
                <div class="quests-menu">
                    <div class="quests-header">
                        <h2 class="quests-title">📋 Quests</h2>
                        <button id="close-quests" class="close-btn">✕</button>
                    </div>
                    
                    <div class="quests-content">
                        <div class="quests-list">
                            ${[{id:"1",description:"Pass 10 gates without gliding",progress:3,target:10,completed:!1,reward:"Golden Collar"},{id:"2",description:"Collect 5 coins in one run",progress:5,target:5,completed:!0,reward:"Sparkle Trail"},{id:"3",description:"Get 15 perfect beats in rhythm mode",progress:8,target:15,completed:!1,reward:"Beat Wings"}].map(s=>`
            <div class="quest-item ${s.completed?"completed":""}">
                <div class="quest-icon">${s.completed?"✅":"📋"}</div>
                <div class="quest-content">
                    <div class="quest-description">${s.description}</div>
                    <div class="quest-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${s.progress/s.target*100}%"></div>
                        </div>
                        <span class="progress-text">${s.progress}/${s.target}</span>
                    </div>
                    <div class="quest-reward">Reward: ${s.reward}</div>
                </div>
                ${s.completed?'<button class="claim-btn">Claim</button>':""}
            </div>
        `).join("")}
                        </div>
                    </div>
                    
                    <div class="quests-footer">
                        <p class="quests-hint">Complete quests to unlock cosmetics and earn rewards!</p>
                        <button id="back-from-quests" class="primary-btn">Back</button>
                    </div>
                </div>
            </div>
        `}bindQuestsEvents(){var e,t;(e=document.getElementById("close-quests"))==null||e.addEventListener("click",()=>{this.showMenu()}),(t=document.getElementById("back-from-quests"))==null||t.addEventListener("click",()=>{this.showMenu()}),document.querySelectorAll(".claim-btn").forEach(s=>{s.addEventListener("click",a=>{this.claimQuestReward(a.target)})})}showToast(e,t="info",s=3e3){const a={id:Math.random().toString(36).substr(2,9),message:e,type:t,duration:s,createdAt:Date.now()};this.toasts.push(a),this.renderToasts(),setTimeout(()=>{this.removeToast(a.id)},s)}renderToasts(){const e=document.getElementById("toast-container");e&&(e.innerHTML=this.toasts.map(t=>`
            <div class="toast toast-${t.type}" data-toast-id="${t.id}">
                <div class="toast-icon">${this.getToastIcon(t.type)}</div>
                <div class="toast-message">${t.message}</div>
                <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
            </div>
        `).join(""))}removeToast(e){this.toasts=this.toasts.filter(s=>s.id!==e);const t=document.querySelector(`[data-toast-id="${e}"]`);t&&(t.classList.add("toast-fadeout"),setTimeout(()=>t.remove(),300))}getToastIcon(e){const t={success:"✅",info:"ℹ️",warning:"⚠️",error:"❌"};return t[e]||t.info}getDailySeed(){const e=new Date;return`${e.getFullYear()}${(e.getMonth()+1).toString().padStart(2,"0")}${e.getDate().toString().padStart(2,"0")}`}getCosmeticTypeIcon(e){return{collar:"🎀",trail:"✨",hat:"🎩",emote:"😊"}[e]||"🎨"}getCosmeticIcon(e){return{basic_collar:"🎀",golden_collar:"👑",sparkle_trail:"✨",beat_wings:"🎵",happy_bark:"😊"}[e]||"🎨"}updateSliderDisplay(e,t){const s=document.querySelector(`#${e} + .slider-container .slider-value`);s&&(s.textContent=`${Math.round(t*100)}%`)}updateSetting(e,t){const s=e.replace("-","");s in this.settings&&(this.settings[s]=t)}resumeGame(){this.overlay.classList.add("hidden"),this.gameInstance&&this.gameInstance.resumeGame()}watchReplay(){this.showToast("Replay feature coming soon!","info")}shareScore(){"share"in navigator?navigator.share({title:"FlappyDog Score",text:`I just scored ${this.getLastScore()} points in FlappyDog!`,url:window.location.href}):(this.copyToClipboard(`I just scored ${this.getLastScore()} points in FlappyDog! Play at ${window.location.href}`),this.showToast("Score copied to clipboard!","success"))}shareGame(){"share"in navigator?navigator.share({title:"FlappyDog - The Ultimate Flappy Game",text:"Check out this amazing Flappy-style game with rhythm mode and awesome features!",url:window.location.href}):(this.copyToClipboard(`Check out FlappyDog - The Ultimate Flappy Game! ${window.location.href}`),this.showToast("Game link copied to clipboard!","success"))}handleSpriteUpload(e){var s;const t=(s=e.target.files)==null?void 0:s[0];t&&this.gameInstance&&(this.gameInstance.uploadCustomSprite(t),this.showToast("Custom sprite uploaded!","success"))}switchLeaderboardTab(e){var t,s;document.querySelectorAll(".tab-btn").forEach(a=>a.classList.remove("active")),document.querySelectorAll(".leaderboard-tab").forEach(a=>a.classList.remove("active")),(t=document.getElementById(`tab-${e}`))==null||t.classList.add("active"),(s=document.getElementById(`${e}-leaderboard`))==null||s.classList.add("active")}refreshLeaderboard(){this.showToast("Leaderboard refreshed!","success")}equipCosmetic(e){const t=this.cosmetics.find(s=>s.id===e);t&&t.unlocked&&(this.cosmetics.forEach(s=>{s.type===t.type&&(s.equipped=!1)}),t.equipped=!0,this.saveCosmetics(),this.showToast(`${t.name} equipped!`,"success"),this.showCosmetics())}claimQuestReward(e){e.textContent="Claimed!",e.disabled=!0,this.showToast("Quest reward claimed!","success")}resetScores(){confirm("Are you sure you want to reset all scores? This cannot be undone.")&&(localStorage.removeItem("flappydog-bestscore"),localStorage.removeItem("flappydog-leaderboard"),this.showToast("All scores reset!","success"))}resetCosmetics(){confirm("Are you sure you want to reset all cosmetics? This cannot be undone.")&&(this.cosmetics.forEach(e=>{e.unlocked=e.id==="basic_collar",e.equipped=e.id==="basic_collar"}),this.saveCosmetics(),this.showToast("Cosmetics reset!","success"))}exportData(){const e={settings:this.settings,cosmetics:this.cosmetics,bestScore:localStorage.getItem("flappydog-bestscore")},t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),s=URL.createObjectURL(t),a=document.createElement("a");a.href=s,a.download="flappydog-data.json",a.click(),URL.revokeObjectURL(s),this.showToast("Data exported!","success")}importData(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=t=>{var a;const s=(a=t.target.files)==null?void 0:a[0];if(s){const i=new FileReader;i.onload=c=>{var o;try{const n=JSON.parse((o=c.target)==null?void 0:o.result);n.settings&&(this.settings=n.settings),n.cosmetics&&(this.cosmetics=n.cosmetics),n.bestScore&&localStorage.setItem("flappydog-bestscore",n.bestScore),this.saveSettings(),this.saveCosmetics(),this.showToast("Data imported!","success")}catch(n){this.showToast("Invalid data file!","error")}},i.readAsText(s)}},e.click()}resetToDefaults(){confirm("Reset all settings to default values?")&&(this.settings={soundVolume:.7,musicVolume:.5,haptics:!0,colorblind:!1,highContrast:!1,leftHandMode:!1,motionReduced:!1,screenShake:!0,rhythmAssist:!0},this.showSettings(),this.showToast("Settings reset to defaults!","success"))}playButtonSound(){}addButtonPressEffect(){}copyToClipboard(e){if(navigator.clipboard)navigator.clipboard.writeText(e);else{const t=document.createElement("textarea");t.value=e,document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}}getLastScore(){return 0}setupWebShare(){}loadSettings(){const e=localStorage.getItem("flappydog-settings");e&&(this.settings={...this.settings,...JSON.parse(e)});const t=localStorage.getItem("flappydog-cosmetics");t&&(this.cosmetics=JSON.parse(t))}saveSettings(){localStorage.setItem("flappydog-settings",JSON.stringify(this.settings)),this.gameInstance&&this.gameInstance.updateSettings(this.settings)}saveCosmetics(){localStorage.setItem("flappydog-cosmetics",JSON.stringify(this.cosmetics))}getSettings(){return{...this.settings}}updateQuest(e,t){}unlockCosmetic(e){const t=this.cosmetics.find(s=>s.id===e);t&&!t.unlocked&&(t.unlocked=!0,this.saveCosmetics(),this.showToast(`🎉 Unlocked: ${t.name}!`,"success",5e3))}}export{v as U};
