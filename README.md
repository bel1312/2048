# 🎮 2048 Game Clone

A modern, feature-rich implementation of the popular 2048 puzzle game with enhanced gameplay, smooth animations, and immersive sound effects.

## ✨ Features

### 🎯 Core Gameplay

- **Classic 2048 mechanics** - Slide numbered tiles to combine them and reach 2048
- **Smooth tile animations** - Fluid sliding and merging effects
- **Responsive design** - Works perfectly on desktop and mobile devices
- **Touch controls** - Swipe gestures for mobile play

### 🎵 Enhanced Experience

- **🔊 Sound Effects** - Audio feedback for moves, merges, wins, and game over
- **🎨 Visual Feedback** - Score gain animations and grid shake for invalid moves
- **🏆 Score Tracking** - Real-time score, best score, and move counter
- **💫 Special Effects** - Pulsing animation for the winning 2048 tile

### ⚡ Advanced Features

- **↩️ Undo Functionality** - Undo your last 3 moves (Press 'U')
- **🔄 Quick Restart** - Instant game restart with confirmation (Press 'R')
- **📱 Mobile Optimized** - Perfect touch controls and responsive layout
- **💾 Local Storage** - Your best score is automatically saved
- **🎯 Smart Hints** - Helpful tips for new players

## 🕹️ How to Play

### 🎮 Controls

| Action           | Desktop    | Mobile          |
| ---------------- | ---------- | --------------- |
| Move tiles       | Arrow Keys | Swipe           |
| Restart          | `R` key    | New Game button |
| Undo move        | `U` key    | -               |
| Dismiss messages | `Space`    | Tap             |

### 📋 Rules

1. **Move tiles** using arrow keys or swipe gestures
2. **Combine tiles** with the same number to create larger numbers
3. **Reach 2048** to win the game!
4. **Game over** when no more moves are possible

### 💡 Strategy Tips

- Keep your highest tile in a corner
- Build numbers in one direction
- Don't fill up the board randomly
- Use the undo feature strategically

## 🛠️ Technical Implementation

### 📋 Technologies Used

- **HTML5** - Semantic structure and accessibility
- **CSS3** - Modern styling with animations and grid layout
- **Vanilla JavaScript** - ES6+ features and Web Audio API
- **Local Storage** - Persistent best score saving

### 🎨 Key Features Implementation

- **Grid System** - CSS Grid and Flexbox for perfect alignment
- **Animations** - CSS keyframes for smooth transitions
- **Audio** - Web Audio API for dynamic sound generation
- **State Management** - Game history for undo functionality
- **Responsive Design** - Mobile-first approach with media queries

### 📁 File Structure

```
2048-game/
├── index.html          # Main HTML structure
├── style.css           # Styling and animations
├── script.js           # Game logic and interactions
└── README.md           # Project documentation
```

## 🚀 Getting Started

### 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/bel1312/2048.git
   cd 2048
   ```

2. **Open the game**

   - Simply open `index.html` in your web browser
   - Or use a local server for development:

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx http-server
   ```

3. **Start playing!**
   - No build process required
   - Works offline once loaded

### 🔧 Development

The game is built with vanilla web technologies, making it easy to modify and extend:

- **Add new tile values** - Extend the CSS classes in `style.css`
- **Modify game logic** - Update the movement functions in `script.js`
- **Change styling** - Customize colors and animations in `style.css`
- **Add features** - Extend the Game2048 class with new methods

## 🎯 Game Statistics

Track your performance with built-in metrics:

- **Current Score** - Points from tile combinations
- **Best Score** - Highest score achieved (saved locally)
- **Move Counter** - Number of moves in current game
- **Undo History** - Last 3 moves available for undo

## 🌟 Achievements

Try to achieve these milestones:

- 🥉 **Bronze**: Reach 512
- 🥈 **Silver**: Reach 1024
- 🥇 **Gold**: Reach 2048
- 💎 **Diamond**: Reach 4096+

## 📱 Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

1. **🐛 Bug Reports** - Found a bug? Open an issue!
2. **💡 Feature Requests** - Have an idea? We'd love to hear it!
3. **🔧 Pull Requests** - Ready to contribute code? Please do!
4. **📖 Documentation** - Help improve the README or add comments

### 🔄 Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Original 2048** - Inspired by Gabriele Cirulli's 2048
- **Design** - Modern UI/UX improvements
- **Sound Design** - Web Audio API implementation
- **Community** - Thanks to all contributors and players!

## 📞 Contact

- **GitHub**: [@bel1312](https://github.com/bel1312)
- **Repository**: [2048 Game](https://github.com/bel1312/2048)
- **Issues**: [Report a Bug](https://github.com/bel1312/2048/issues)

---

**🎮 Ready to play? [Start the game now!](https://bel1312.github.io/2048/)**

_Made with ❤️ and lots of ☕_
