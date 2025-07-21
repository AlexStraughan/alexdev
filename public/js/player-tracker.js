// Player Tracking Service - Handles player activity and communication
class PlayerTracker {
    constructor() {
        this.playerId = null;
        this.playerName = null;
        this.lastActivityUpdate = 0;
        this.updateInterval = null;
        this.isActive = false;
        this.isTracking = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkIfPlayerIsTracked();
    }
    
    checkIfPlayerIsTracked() {
        // Don't auto-start tracking - wait for registration
        console.log('Player tracker initialized - waiting for registration');
    }
    
    enableTracking(playerName) {
        this.playerId = this.getOrCreatePlayerId();
        this.playerName = playerName;
        this.isTracking = true;
        this.isActive = true;
        
        console.log(`Player tracking enabled for: ${playerName}`);
        this.startHeartbeat();
    }
    
    disableTracking() {
        this.isTracking = false;
        this.isActive = false;
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        console.log('Player tracking disabled');
    }
    
    getOrCreatePlayerId() {
        // Use the game's player ID if available
        if (window.game && window.game.playerId) {
            return window.game.playerId;
        }
        
        // Fallback to generating a temporary ID
        return 'temp_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    // Remove the getOrCreatePlayerName method since names come from leaderboard submission
    
    setPlayerName(name) {
        this.playerName = name;
        // Don't use localStorage anymore
        
        // Enable tracking when player sets name (via leaderboard submission)
        if (!this.isTracking) {
            this.enableTracking(name);
        }
    }
    
    async updatePlayerActivity(gameData = {}) {
        if (!this.isActive || !this.isTracking) return;
        
        try {
            const response = await fetch('/api/player-activity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_id: this.playerId,
                    player_name: this.playerName,
                    score: gameData.score || 0,
                    level: gameData.level || 1,
                    points_per_second: gameData.pointsPerSecond || 0,
                    generators_owned: gameData.generatorsOwned || 0
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.lastActivityUpdate = Date.now();
                return data;
            }
        } catch (error) {
            console.error('Error updating player activity:', error);
        }
    }
    
    startHeartbeat() {
        if (!this.isTracking) return;
        
        // Send initial activity update
        this.updatePlayerActivity();
        
        // Update every 5 minutes (300 seconds)
        this.updateInterval = setInterval(() => {
            this.updatePlayerActivity(this.getGameData());
        }, 300000); // 5 minutes
    }
    
    getGameData() {
        // Get current game state if available
        if (window.game && window.game.state) {
            const totalGenerators = Object.values(window.game.state.generators)
                .reduce((sum, count) => sum + count, 0);
            
            return {
                score: Math.floor(window.game.state.totalPointsEarned || window.game.state.points || 0),
                pointsPerSecond: window.game.state.pointsPerSecond || 0,
                generatorsOwned: totalGenerators
            };
        }
        return {};
    }
    
    setupEventListeners() {
        // Update activity on user interaction (only if tracking is enabled)
        document.addEventListener('click', () => {
            if (!this.isTracking) return;
            
            const now = Date.now();
            // Throttle updates to every 2 minutes from clicks
            if (now - this.lastActivityUpdate > 120000) { // 2 minutes
                this.updatePlayerActivity(this.getGameData());
            }
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isActive = false;
            } else {
                this.isActive = true;
                // Update activity when page becomes visible again (only if tracking is enabled)
                if (this.isTracking) {
                    this.updatePlayerActivity(this.getGameData());
                }
            }
        });
        
        // Handle before unload
        window.addEventListener('beforeunload', () => {
            this.isActive = false;
            // Try to send final update (may not always work) - only if tracking is enabled
            if (this.isTracking) {
                navigator.sendBeacon('/api/player-activity', JSON.stringify({
                    player_id: this.playerId,
                    player_name: this.playerName,
                    status: 'offline'
                }));
            }
        });
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.isActive = false;
        
        // Send final activity update if tracking is enabled
        if (this.isTracking) {
            this.updatePlayerActivity();
        }
    }
    
    async getActivePlayers() {
        if (!this.isTracking) return [];
        
        try {
            const response = await fetch('/api/active-players');
            if (response.ok) {
                const data = await response.json();
                return data.players || [];
            }
        } catch (error) {
            console.error('Error fetching active players:', error);
        }
        return [];
    }
}

// Initialize player tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.playerTracker = new PlayerTracker();
});

// Export for use in other modules
window.PlayerTracker = PlayerTracker;
