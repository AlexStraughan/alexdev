// Floating Player Avatars - Shows icons for active players
class PlayerAvatars {
    constructor() {
        this.players = new Map();
        this.container = null;
        this.updateInterval = null;
        this.lastPlayerCount = 0;
        
        this.init();
    }
    
    init() {
        this.createContainer();
        this.startPlayerTracking();
        this.setupEventListeners();
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'player-avatars-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 5;
            overflow: hidden;
        `;
        document.body.appendChild(this.container);
    }
    
    async fetchActivePlayers() {
        // Only fetch if player tracking is enabled
        if (window.playerTracker && !window.playerTracker.isTracking) {
            return [];
        }
        
        try {
            const response = await fetch('/api/active-players');
            const data = await response.json();
            return data.players || [];
        } catch (error) {
            console.error('Error fetching active players:', error);
            return [];
        }
    }
    
    generatePlayerIcon(player) {
        const avatarEmojis = [
            '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🔬',
            '👨‍🎨', '👩‍🎨', '🧑‍🎨', '👨‍🏫', '👩‍🏫', '🧑‍🏫',
            '🤖', '👽', '🦾', '🧠', '⚡', '🔥', '✨', '🚀'
        ];
        
        // Use player ID or name to consistently assign same emoji
        const hash = this.hashString(player.id || player.name);
        return avatarEmojis[hash % avatarEmojis.length];
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    createPlayerAvatar(player) {
        const avatar = document.createElement('div');
        avatar.className = 'player-avatar';
        avatar.dataset.playerId = player.id;
        
        const icon = this.generatePlayerIcon(player);
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'
        ];
        const color = colors[this.hashString(player.id || player.name) % colors.length];
        
        // Check if this is the current player
        const currentPlayerName = localStorage.getItem('playerName');
        const isCurrentPlayer = currentPlayerName && player.name === currentPlayerName;
        const playerNameDisplay = isCurrentPlayer ? `${player.name || 'Anonymous'} (You)` : (player.name || 'Anonymous');
        
        // Add special styling for current player
        const borderColor = isCurrentPlayer ? '#FFD700' : 'rgba(255, 255, 255, 0.3)';
        const boxShadow = isCurrentPlayer ? '0 4px 15px rgba(255, 215, 0, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)';
        
        avatar.style.cssText = `
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${color}, ${color}dd);
            border: 2px solid ${borderColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            box-shadow: ${boxShadow};
            backdrop-filter: blur(10px);
            pointer-events: auto;
            z-index: 10;
        `;
        
        avatar.innerHTML = `
            <span class="avatar-icon">${icon}</span>
            <div class="player-tooltip" style="
                position: absolute;
                bottom: 45px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            ">${playerNameDisplay}</div>
        `;
        
        // Add hover effects
        avatar.addEventListener('mouseenter', () => {
            avatar.style.transition = 'transform 0.3s ease'; // Only transition transform
            avatar.style.transform = 'scale(1.2)';
            avatar.querySelector('.player-tooltip').style.opacity = '1';
        });
        
        avatar.addEventListener('mouseleave', () => {
            avatar.style.transition = 'transform 0.3s ease'; // Only transition transform
            avatar.style.transform = 'scale(1)';
            avatar.querySelector('.player-tooltip').style.opacity = '0';
        });
        
        // Random starting position
        const startX = Math.random() * (window.innerWidth - 40);
        const startY = Math.random() * (window.innerHeight - 40);
        avatar.style.left = startX + 'px';
        avatar.style.top = startY + 'px';
        
        console.log(`Avatar created at position: ${startX}, ${startY}`);
        console.log(`Avatar style.left: ${avatar.style.left}, style.top: ${avatar.style.top}`);
        
        // Don't start animation here - start it after avatar is added to DOM
        
        return avatar;
    }
    
    animateAvatar(avatar, player) {
        let x = parseFloat(avatar.style.left);
        let y = window.innerHeight - 60; // Start near bottom of screen
        let vx = (Math.random() - 0.5) * 2; // Slow horizontal movement
        let vy = 0;
        
        // Set initial position to bottom of screen
        avatar.style.top = y + 'px';
        
        const animate = () => {
            if (!this.container.contains(avatar)) {
                return;
            }
            
            // Check if physics is paused
            const isPaused = window.physics && window.physics.isPaused;
            
            if (!isPaused) {
                // Simple horizontal movement
                x += vx;
                
                // Bounce off left and right edges
                if (x <= 0 || x >= window.innerWidth - 40) {
                    vx = -vx;
                    x = Math.max(0, Math.min(window.innerWidth - 40, x));
                }
                
                // Keep avatar at bottom of screen
                y = window.innerHeight - 60;
                
                avatar.style.left = x + 'px';
                avatar.style.top = y + 'px';
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    async updatePlayers() {
        const activePlayers = await this.fetchActivePlayers();
        console.log('Active players:', activePlayers);
        
        // If tracking is disabled, clear all avatars
        if (window.playerTracker && !window.playerTracker.isTracking) {
            console.log('Player tracking disabled, clearing avatars');
            this.players.forEach((avatar, playerId) => {
                avatar.style.transition = 'all 0.5s ease';
                avatar.style.opacity = '0';
                avatar.style.transform = 'scale(0)';
                setTimeout(() => {
                    if (this.container.contains(avatar)) {
                        this.container.removeChild(avatar);
                    }
                }, 500);
                this.players.delete(playerId);
            });
            return;
        }
        
        // Remove avatars for players no longer active
        const currentPlayerIds = new Set(activePlayers.map(p => p.id));
        this.players.forEach((avatar, playerId) => {
            if (!currentPlayerIds.has(playerId)) {
                console.log(`Removing avatar for player ${playerId}`);
                
                avatar.style.transition = 'all 0.5s ease';
                avatar.style.opacity = '0';
                avatar.style.transform = 'scale(0)';
                setTimeout(() => {
                    if (this.container.contains(avatar)) {
                        this.container.removeChild(avatar);
                    }
                }, 500);
                this.players.delete(playerId);
            }
        });
        
        // Add avatars for new players
        activePlayers.forEach(player => {
            if (!this.players.has(player.id)) {
                console.log(`Creating avatar for new player:`, player);
                const avatar = this.createPlayerAvatar(player);
                this.container.appendChild(avatar);
                this.players.set(player.id, avatar);
                
                console.log(`Avatar added to DOM. Container has ${this.container.children.length} children`);
                console.log(`Avatar is in container: ${this.container.contains(avatar)}`);
                
                // Start animation after avatar is in DOM
                this.animateAvatar(avatar, player);
                
                // Animate in
                avatar.style.opacity = '0';
                avatar.style.transform = 'scale(0)';
                setTimeout(() => {
                    avatar.style.transition = 'opacity 0.5s ease, transform 0.5s ease'; // Only transition opacity and transform
                    avatar.style.opacity = '1';
                    avatar.style.transform = 'scale(1)';
                    // Clear transition after animation to not interfere with movement
                    setTimeout(() => {
                        avatar.style.transition = '';
                        console.log(`Avatar transition cleared, ready for movement`);
                    }, 500);
                }, 100);
            }
        });
        
        // Update player count in favicon if it changed
        if (activePlayers.length !== this.lastPlayerCount) {
            this.lastPlayerCount = activePlayers.length;
            if (window.animatedFavicon && activePlayers.length > 1) {
                window.animatedFavicon.showEmoji('👥', 2000);
            }
        }
    }
    
    startPlayerTracking() {
        // Update immediately
        this.updatePlayers();
        
        // Then update every 60 seconds (1 minute)
        this.updateInterval = setInterval(() => {
            this.updatePlayers();
        }, 60000);
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.players.forEach(avatar => {
                const x = parseFloat(avatar.style.left);
                const y = parseFloat(avatar.style.top);
                
                // Keep avatars within new window bounds
                avatar.style.left = Math.min(x, window.innerWidth - 40) + 'px';
                avatar.style.top = Math.min(y, window.innerHeight - 40) + 'px';
            });
        });
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.container) {
            this.container.remove();
        }
    }
}

// Initialize player avatars when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.playerAvatars = new PlayerAvatars();
});

// Export for use in other modules
window.PlayerAvatars = PlayerAvatars;
