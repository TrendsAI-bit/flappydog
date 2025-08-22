# 🐕 FlappyDog - The Ultimate Flappy Game

A next-level Flappy-style web game with rhythm gameplay, adaptive difficulty, and cozy polish. Built as a PWA with offline capabilities and deployed on Vercel.

![FlappyDog Screenshot](./public/og-image.png)

## 🌟 Features

### Core Gameplay
- **Classic Mode**: Traditional Flappy gameplay with enhanced physics
- **Rhythm Mode**: Obstacles spawn on beat with 2 music tracks (90 & 120 BPM)
- **Checkpoint Mode**: Save progress every 30 points with balloon checkpoints

### Unique Mechanics
- **Wind & Weather**: Procedural wind gusts with visual particle indicators
- **Treat Combos**: Collect bones to charge Super Wag meter for bullet-time mode
- **Bark Pulse**: Emit circular "bark" to nudge obstacles and attract coins
- **Double-tap Dash**: Horizontal burst on 8-second cooldown
- **Adaptive Difficulty**: Game adjusts based on recent performance

### Social Features
- **Daily Challenges**: Fixed RNG seed with ghost races
- **Leaderboards**: Daily and all-time with anti-cheat validation
- **Ghost Races**: Race against translucent replays of best runs
- **Mini-Quests**: Bite-sized objectives that unlock cosmetics

### Accessibility & Polish
- **PWA Support**: Installable, offline-first with service worker
- **Colorblind Safe**: Alternative color palettes
- **High Contrast Mode**: Enhanced visibility options
- **Left-hand Mode**: UI mirroring for left-handed players
- **Motion Reduction**: Reduced animations for motion sensitivity
- **Haptic Feedback**: Mobile vibration with toggle
- **Screen Reader Support**: ARIA labels and semantic HTML

### Technical Features
- **60fps Performance**: Optimized for mid-range phones
- **<20ms Input Latency**: Responsive controls
- **Offline Play**: Full game functionality without internet
- **Custom Sprites**: Upload your own dog sprite via file picker
- **Real-time Audio**: Web Audio API with rhythm detection
- **Canvas 2D**: Pure JavaScript, no game engine dependencies

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Deployment to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Or connect to GitHub for automatic deployments
vercel --prod
```

## 🎮 How to Play

### Basic Controls
- **Tap/Click/Space/Up Arrow**: Flap (short impulse)
- **Hold**: Glide (reduced gravity)
- **Double-tap**: Dash (horizontal burst, 8s cooldown)
- **Escape**: Pause game

### Advanced Techniques
- **Super Wag**: Fill the meter by collecting bones, then tap for bullet-time + invulnerability
- **Bark Pulse**: When Super Wag is full, emit a bark to push obstacles and attract coins
- **Perfect Beats**: In rhythm mode, flap on beat for score multipliers and glow trails
- **Risk/Reward**: Coins near obstacles are worth more points

### Game Modes
- **Classic**: Traditional endless gameplay
- **Rhythm**: Obstacles sync to music beats
- **Checkpoint**: Save progress with balloon checkpoints
- **Daily Challenge**: Compete on seeded runs with ghost races

## 🛠️ Technical Architecture

### Frontend Stack
- **TypeScript**: Strict typing for reliability
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling with custom components
- **Canvas 2D**: Hardware-accelerated graphics
- **Web Audio API**: Low-latency sound and music

### Backend Stack
- **Vercel Functions**: Serverless API endpoints
- **Node.js**: Runtime for API functions
- **TypeScript**: End-to-end type safety

### PWA Features
- **Service Worker**: Caches game assets for offline play
- **Web App Manifest**: Installable with app-like experience
- **Background Sync**: Syncs scores when connection returns
- **Push Notifications**: Future feature for daily challenges

### Anti-Cheat System
- **Session Validation**: HMAC signatures with nonces
- **Ghost Data Analysis**: Validates movement patterns and timing
- **Rate Limiting**: Prevents spam submissions
- **Replay Verification**: Checks for impossible movements

## 📁 Project Structure

```
flappydog/
├── src/
│   ├── main.ts          # Game engine and core loop
│   ├── ui.ts            # UI system and menus
│   ├── audio.ts         # Audio manager and rhythm detection
│   ├── leaderboard.ts   # Score submission and ghost system
│   └── styles.css       # Tailwind + custom styles
├── assets/
│   ├── dog.png          # Dog sprite sheet
│   ├── obstacles.png    # Obstacle sprites
│   ├── ui_sfx/          # Sound effects
│   └── music/           # Background music
├── api/
│   ├── session.ts       # Session management
│   ├── submit-score.ts  # Score submission
│   ├── leaderboard.ts   # Leaderboard data
│   ├── daily-challenge.ts # Daily challenges
│   └── ghost-race.ts    # Ghost race data
├── public/
│   ├── manifest.json    # PWA manifest
│   ├── sw.js           # Service worker
│   └── *.png           # PWA icons
└── index.html          # Main HTML file
```

## 🎨 Asset Guidelines

### Sprites
- **Format**: PNG with transparent background
- **Style**: Pixel art with strong outlines and 1px shadows
- **Dog Sprite**: 48x32px, 3 frames for flap animation
- **Colors**: Bright, readable with colorblind-safe alternatives

### Audio
- **Format**: MP3 for compatibility
- **SFX**: Short (< 1s), pleasant sounds
- **Music**: Looped tracks, 8-bit style for rhythm mode
- **Size**: < 1MB total for fast loading

### Performance Requirements
- **Initial Load**: < 1MB
- **60fps**: Maintain on mid-range phones
- **Battery**: 30fps when tab unfocused
- **Memory**: Reuse objects, avoid GC spikes

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom API endpoint
VITE_API_ENDPOINT=https://your-api.com

# Optional: Analytics
VITE_ANALYTICS_ID=your-analytics-id
```

### Build Configuration
- **Target**: ES2018 for broad compatibility
- **Output**: Optimized for Vercel deployment
- **PWA**: Automatic service worker generation
- **Assets**: Optimized and cached with long-term headers

## 🏆 Scoring System

### Base Points
- **Gate Pass**: +1 point
- **Perfect Beat**: +1 bonus (rhythm mode)
- **Coin Collection**: +1-3 points (more near obstacles)
- **Combo Bonus**: +10 every 10 perfect beats

### Multipliers
- **Rhythm Streak**: Up to 2x for consecutive perfect beats
- **Risk Bonus**: Extra points for near-miss maneuvers
- **Daily Challenge**: Special scoring rules per day

## 🎵 Audio System

### Sound Effects
- **Flap**: Wing flapping sound
- **Coin**: Collectible pickup
- **Score**: Gate pass confirmation
- **Bark**: Super ability activation
- **Dash**: Movement ability
- **Game Over**: Failure sound

### Music Tracks
- **Menu**: Ambient background music
- **Rhythm 1**: 120 BPM electronic track
- **Rhythm 2**: 90 BPM chiptune track
- **Ambient**: Peaceful background for classic mode

### Rhythm Detection
- **Beat Tracking**: Real-time BPM analysis
- **Tolerance Window**: ±150ms for "perfect" timing
- **Visual Feedback**: Metronome and beat indicators
- **Audio Cues**: Subtle beat emphasis sounds

## 📱 Mobile Optimization

### Touch Controls
- **Responsive**: Large, accessible touch targets
- **Haptics**: Vibration feedback with settings toggle
- **Gestures**: Double-tap for dash, hold for glide
- **Prevention**: Disabled zoom, selection, context menu

### Performance
- **Rendering**: Optimized canvas operations
- **Memory**: Object pooling for game entities
- **Battery**: Reduced framerate when backgrounded
- **Network**: Offline-first with smart caching

## 🔐 Security & Privacy

### Data Protection
- **Local Storage**: Settings and scores stored locally
- **No Tracking**: No personal data collection
- **Optional**: Leaderboard participation is opt-in
- **Encryption**: Score signatures prevent tampering

### Content Security
- **CSP Headers**: Prevents XSS attacks
- **HTTPS Only**: Secure connections required
- **Input Validation**: Sanitized user inputs
- **Rate Limiting**: Prevents abuse

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code quality
- **Prettier**: Consistent formatting
- **Comments**: Document complex logic

### Asset Contributions
- Follow the asset guidelines above
- Ensure proper licensing
- Test on multiple devices
- Maintain performance standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the original Flappy Bird by Dong Nguyen
- Built with modern web technologies
- Community feedback and testing
- Open source libraries and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/TrendsAI-bit/flappydog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TrendsAI-bit/flappydog/discussions)
- **Email**: support@flappydog.com

---

Made with ❤️ by the FlappyDog team. Happy flapping! 🐕✨
