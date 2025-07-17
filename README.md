# Alex Straughan - Developer Portfolio

A Ruby Sinatra-based portfolio website featuring an interactive physics simulation and idle game.

## Project Structure

### Backend (Ruby/Sinatra)
- `app.rb` - Main Sinatra application with API endpoints
- `views/index.erb` - Main HTML template

### Frontend (Modular JavaScript)
- `public/js/app.js` - Main application entry point and initialization
- `public/js/game.js` - Cookie clicker game logic and state management
- `public/js/physics.js` - Physics simulation for floating elements
- `public/js/effects.js` - Visual effects and animations
- `public/js/ui.js` - UI management and interactions

### Styles
- `public/css/styles.css` - Main stylesheet with responsive design

## Features

### Interactive Portfolio
- Modern glassmorphism design
- Responsive layout
- Professional presentation

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
   ```bash
   ruby app.rb
   ```

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
