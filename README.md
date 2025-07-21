# Alex Straughan - Developer Portfolio

A Ruby Sinatra-based portfolio website featuring an interactive physics simulation and idle game with real-time WebSocket communication.

## Project Structure

### Backend (Ruby/Sinatra)
- `app.rb` - Main Sinatra application with API endpoints
- `websocket_server_simple.rb` - WebSocket server for real-time communication
- `views/index.erb` - Main HTML template

### Frontend (Modular JavaScript)
- `public/js/app.js` - Main application entry point and initialization
- `public/js/game.js` - Cookie clicker game logic and state management
- `public/js/websocket-client.js` - WebSocket client for real-time communication
- `public/js/chat-system.js` - Real-time chat functionality
- `public/js/leaderboard.js` - Live leaderboard updates
- `public/js/physics.js` - Physics simulation for floating elements
- `public/js/effects.js` - Visual effects and animations
- `public/js/ui.js` - UI management and interactions

### Styles
- `public/css/styles.css` - Main stylesheet with responsive design

## Setup

### Environment Variables
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your secure admin password:
   ```
   ADMIN_PASSWORD=your_very_secure_password_here
   ```

### Installation
1. Install Ruby dependencies:
   ```bash
   bundle install
   ```

2. Start the WebSocket server:
   ```bash
   ruby websocket_server.rb
   ```

3. Start the web server:
   ```bash
   ruby app.rb
   ```

4. Visit `http://localhost:4567`

### Admin Commands
Use the browser console to send admin commands:
```javascript
// Example admin commands (use your password from .env)
window.wsClient.sendMessage({
  type: 'admin_command',
  password: 'your_password_here',
  command: 'list_players'
});
```

## Features

### Interactive Portfolio
- Modern glassmorphism design
- Responsive layout
- Professional presentation

### Real-Time Multiplayer Game
- Server-side game state storage
- Live leaderboard updates
- Real-time chat system
- WebSocket-based communication

### Physics Simulation
- 45+ floating emoji elements with realistic physics
- Collision detection and response
- Mouse repulsion effects
- Special LinkedIn element with unique behavior

### Cookie Clicker Game
- Click-based point generation with critical hits
- 6 types of code generators (Junior Dev, Senior Dev, etc.)
- Generator-specific upgrade system
- Achievement system
- Progressive revelation (unlocks after 15 clicks)
- Auto-save functionality

### LinkedIn Integration
- Special floating LinkedIn element
- Clickable to open Alex's LinkedIn profile
- Affects other elements but isn't affected by them
- Higher z-index to stay above UI elements

## Technical Architecture

### Modular Design
- **Separation of Concerns**: Each system (game, physics, effects, UI) is in its own module
- **Class-Based Architecture**: Modern ES6 classes for better organization
- **Global Communication**: Systems communicate through window-scoped instances
- **Event-Driven**: Loose coupling between components

### Performance Optimizations
- Efficient DOM updates without full re-renders
- Smart collision detection for physics
- Optimized animation loops (60fps for physics, 10fps for game logic)
- Local storage for game state persistence

### Game Mechanics
- **Exponential Pricing**: Generator costs increase by 15% per purchase
- **Generator-Specific Upgrades**: Each generator type has its own upgrade tree
- **Critical Hit System**: Chance-based damage multipliers
- **Progressive Unlocking**: Features unlock as players progress
- **Modern UI**: Glass morphism effects and smooth animations

## Setup & Installation

1. **Install Dependencies**:
   ```bash
   bundle install
   ```

2. **Run the Application**:
   
   **Option 1: Start both servers automatically (Windows)**
   ```batch
   start_servers.bat
   ```
   
   **Option 2: Start servers manually**
   ```bash
   # Terminal 1: Start WebSocket server
   ruby websocket_server_simple.rb
   
   # Terminal 2: Start main app
   ruby app.rb
   ```

3. **Visit**: Open your browser to `http://localhost:4567`

## Server Architecture

- **Main App**: `http://localhost:4567` - Serves the web interface
- **WebSocket Server**: `ws://localhost:9292` - Handles real-time communication
- **Database**: SQLite database for persistent game state and chat storage

3. **Visit**: Open your browser to `http://localhost:4567`

## API Endpoints

- `GET /` - Main homepage
- `GET /api/greeting` - Returns a random greeting message
- `GET /api/skills` - Returns skills data with levels and icons

## Technologies Used

- **Backend**: Ruby + Sinatra
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Modern CSS with gradients, backdrop filters, and animations
- **Interactive Elements**: Fetch API for dynamic content loading

## Interactive Features

1. **Greeting Card**: Click to get a personalized random greeting
2. **Skills Reveal**: Button to animate and display technical skills
3. **Mouse Tracking**: Floating elements respond to mouse movement
4. **Hover Effects**: Cards lift and transform on interaction

Enjoy exploring the interactive experience!
