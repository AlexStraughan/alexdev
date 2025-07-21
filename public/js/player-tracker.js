// Player Tracking Service - Handles player activity and communication
class PlayerTracker {
    constructor() {
        this.playerId = null;
        this.playerName = null;
        this.lastActivityUpdate = 0;
        this.updateInterval = null;
        this.isActive = false;
        this.isTracking = false;
        this.lastDisplayUpdate = 0;
        this.displayUpdateThrottle = 30000; // 30 seconds
        
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
        
        // Delay initial activity update to avoid blocking startup
        setTimeout(() => {
            console.log('📊 Getting game data for delayed initial activity update...');
            const gameData = this.getGameData();
            console.log('📊 Initial game data retrieved:', gameData);
            this.updatePlayerActivity(gameData);
        }, 1000);
        
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
        
        console.log('📊 updatePlayerActivity called with gameData:', gameData);
        
        try {
            // Use WebSocket if available, fallback to HTTP
            if (window.wsClient && window.wsClient.isConnected) {
                const activityMessage = {
                    type: 'player_activity',
                    player_id: this.playerId,
                    player_name: this.playerName,
                    score: gameData.score || 0,
                    level: gameData.level || 1,
                    points_per_second: gameData.pointsPerSecond || 0,
                    generators_owned: gameData.generatorsOwned || 0
                };
                console.log('📊 Sending player_activity message:', activityMessage);
                window.wsClient.send(activityMessage);
                this.lastActivityUpdate = Date.now();
                return { success: true };
            } else {
                // Fallback to HTTP API
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
            
            const gameData = {
                score: Math.floor(window.game.state.totalPointsEarned || window.game.state.points || 0),
                pointsPerSecond: window.game.state.pointsPerSecond || 0,
                generatorsOwned: totalGenerators
            };
            
            console.log('📊 Player tracker game data:', gameData);
            console.log('📊 Raw totalPointsEarned:', window.game.state.totalPointsEarned);
            console.log('📊 Raw points:', window.game.state.points);
            
            return gameData;
        }
        console.log('📊 No game state available for player tracker');
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
        
        // Setup WebSocket listeners
        if (window.wsClient) {
            this.setupWebSocketListeners();
        } else {
            // Wait for WebSocket client to be ready
            document.addEventListener('websocketReady', () => {
                this.setupWebSocketListeners();
            });
        }
        
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
    
    setupWebSocketListeners() {
        // Listen for active players updates
        window.wsClient.on('active_players_update', (data) => {
            console.log('👥 Received active players update:', data);
            if (data.players) {
                this.updateActivePlayersDisplay(data.players);
            }
        });
        
        // Listen for leaderboard updates
        window.wsClient.on('leaderboard_update', (data) => {
            console.log('🏆 Received leaderboard update:', data);
            if (data.leaderboard) {
                this.updateLeaderboardDisplay(data.leaderboard);
            }
        });
        
        console.log('📡 Player tracker connected to WebSocket');
    }
    
    updateActivePlayersDisplay(players) {
        // Throttle display updates to reduce console spam and DOM updates
        const currentTime = Date.now();
        if (currentTime - this.lastDisplayUpdate < this.displayUpdateThrottle) {
            console.log(`👥 Display update throttled (${Math.floor((this.displayUpdateThrottle - (currentTime - this.lastDisplayUpdate)) / 1000)}s remaining)`);
            return;
        }
        
        this.lastDisplayUpdate = currentTime;
        console.log('👥 Updating live players display with:', players);
        
        if (Array.isArray(players)) {
            const playersHtml = players.map(player => {
                // Check both player ID and name to identify current player - BOTH must match
                const isCurrentPlayer = this.playerId && this.playerName && 
                                      (player.player_id === this.playerId) && 
                                      (player.player_name === this.playerName);
                const playerClass = isCurrentPlayer ? 'current-player' : 'other-player';
                console.log(`👥 Player: ${player.player_name}, ID: ${player.player_id}, Score: ${player.score}, Current: ${isCurrentPlayer}`);
                return `
                    <div class="active-player ${playerClass}" data-player-id="${player.player_id}" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5em 1em; margin: 0.5em 0; background: rgba(255,255,255,0.1); border-radius: 0.3em; ${isCurrentPlayer ? 'border-left: 3px solid #FFD700;' : ''}">
                        <span class="player-name" style="font-weight: ${isCurrentPlayer ? 'bold' : 'normal'}; color: ${isCurrentPlayer ? '#FFD700' : 'inherit'};">${player.player_name || 'Anonymous'}${isCurrentPlayer ? ' (You)' : ''}</span>
                        <span class="player-score" style="color: #4facfe;">${this.formatNumber(player.score || 0)} pts</span>
                    </div>
                `;
            }).join('');
            
            // Update the live players section
            const livePlayersElement = document.getElementById('livePlayersContent');
            if (livePlayersElement) {
                livePlayersElement.innerHTML = playersHtml || '<p style="color: rgba(255,255,255,0.6); font-style: italic;">No live players</p>';
                console.log('👥 Live players HTML updated (throttled)');
            } else {
                console.log('👥 Live players element not found');
            }
        } else {
            console.log('👥 Invalid players array');
        }
    }

    updateActivePlayersDisplayForce(players) {
        // Force update without throttling (for important events like connect/disconnect)
        this.lastDisplayUpdate = 0;  // Reset throttle
        this.updateActivePlayersDisplay(players);
    }
    
    updateLeaderboardDisplay(leaderboard) {
        // Update the leaderboard content display in the UI
        const leaderboardContentElement = document.getElementById('leaderboardContent');
        if (leaderboardContentElement && Array.isArray(leaderboard)) {
            const leaderboardHtml = leaderboard.map((player, index) => {
                // Check both player ID and name to identify current player - BOTH must match
                const isCurrentPlayer = this.playerId && this.playerName && 
                                      (player.player_id === this.playerId) && 
                                      (player.player_name === this.playerName);
                const playerClass = isCurrentPlayer ? 'current-player' : 'other-player';
                const rank = index + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                
                return `
                    <div class="leaderboard-entry ${playerClass}" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5em 1em; margin: 0.5em 0; background: rgba(255,255,255,0.1); border-radius: 0.3em; ${isCurrentPlayer ? 'border-left: 3px solid #FFD700;' : ''}">
                        <span class="rank" style="font-weight: bold; color: #4facfe;">${medal}</span>
                        <span class="player-name" style="font-weight: ${isCurrentPlayer ? 'bold' : 'normal'}; color: ${isCurrentPlayer ? '#FFD700' : 'inherit'};">${player.player_name || 'Anonymous'}${isCurrentPlayer ? ' (You)' : ''}</span>
                        <span class="player-score" style="color: #4CAF50;">${this.formatNumber(player.total_points_earned || 0)} pts</span>
                    </div>
                `;
            }).join('');
            
            leaderboardContentElement.innerHTML = leaderboardHtml || '<p style="color: rgba(255,255,255,0.6); font-style: italic;">No scores yet</p>';
            console.log('🏆 Leaderboard content updated');
        } else {
            console.log('🏆 Leaderboard content element not found or invalid leaderboard data');
        }
    }
    
    formatNumber(num) {
        if (num < 1000) return Math.floor(num).toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
        return (num / 1000000000000).toFixed(1) + 'T';
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
