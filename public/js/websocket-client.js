// WebSocket Game Client - Handles real-time communication with game server
class GameWebSocketClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.playerId = null;
        this.gamePlayerId = null;
        this.isRegistered = false;
        this.playerName = null;
        this.heartbeatInterval = null;
        this.messageQueue = []; // Queue for messages sent before connection
        
        this.callbacks = {
            'connected': [],
            'game_state_loaded': [],
            'game_state_saved': [],
            'player_registered': [],
            'chat_message': [],
            'leaderboard_update': [],
            'active_players_update': []
        };
        
        // Wait for DOM to be ready before connecting
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.connect(), 100);
            });
        } else {
            setTimeout(() => this.connect(), 100);
        }
    }

    connect() {
        try {
            console.log('🔌 Attempting WebSocket connection...');
            
            // Close any existing connection
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            
            this.ws = new WebSocket('ws://127.0.0.1:9292');
            
            this.ws.onopen = (event) => {
                console.log('🔌 WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Add a small delay to ensure connection is fully established
                setTimeout(() => {
                    // Process queued messages
                    this.processMessageQueue();
                    
                    // Trigger connection callbacks
                    this.triggerCallbacks('connected', { connected: true });
                    
                    // Dispatch websocketReady event for other systems
                    document.dispatchEvent(new CustomEvent('websocketReady', {
                        detail: { wsClient: this }
                    }));
                }, 100);
            };

            this.ws.onmessage = (event) => {
                try {
                    // console.log('📨 Raw message received:', event.data);
                    const message = JSON.parse(event.data);
                    console.log('📨 Parsed message:', message.type, message);
                    this.handleMessage(message);
                } catch (e) {
                    console.error('❌ Error parsing WebSocket message:', e);
                    console.error('❌ Raw message:', event.data);
                    // Don't close connection on parse error
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket disconnected, code:', event.code, 'reason:', event.reason);
                this.isConnected = false;
                this.stopHeartbeat();
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.isConnected = false;
            };

        } catch (error) {
            console.error('❌ Error creating WebSocket:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('❌ Max reconnect attempts reached. Please refresh the page.');
        }
    }

    handleMessage(message) {
        console.log('📨 Processing message:', message.type);
        
        try {
            switch (message.type) {
                case 'connected':
                    console.log('🔌 Server confirmed connection, assigned player ID:', message.player_id);
                    this.playerId = message.player_id;
                    this.triggerCallbacks('connected', message);
                    break;
                case 'game_state_loaded':
                    console.log('🎮 Game state loaded');
                    this.triggerCallbacks('game_state_loaded', message);
                    break;
                case 'game_state_saved':
                    console.log('💾 Game state saved');
                    this.triggerCallbacks('game_state_saved', message);
                    break;
                case 'player_registered':
                    console.log('👤 Player registered:', message.player_name);
                    this.isRegistered = true;
                    this.playerName = message.player_name;
                    this.triggerCallbacks('player_registered', message);
                    break;
                case 'chat_message':
                    console.log('💬 Chat message received');
                    this.triggerCallbacks('chat_message', message);
                    break;
                case 'leaderboard_update':
                    // console.log('🏆 Leaderboard update received'); // Reduced logging for less spam
                    this.triggerCallbacks('leaderboard_update', message);
                    break;
                case 'active_players_update':
                    // console.log('👥 Active players update received:', message.players?.length || 0, 'players'); // Reduced logging for less spam
                    this.triggerCallbacks('active_players_update', message);
                    break;
                case 'admin_response':
                    console.log('🔧 Admin response:', message.success ? '✅' : '❌', message.message);
                    if (message.success) {
                        console.log('%c' + message.message, 'color: green; font-weight: bold');
                    } else {
                        console.error('%c' + message.message, 'color: red; font-weight: bold');
                    }
                    break;
                case 'game_reset':
                    console.log('💥 Game reset received from server:', message.message);
                    console.log('%c🎮 GAME RESET: All progress has been cleared by admin', 'color: red; font-weight: bold; font-size: 14px;');
                    
                    // Clear localStorage
                    localStorage.removeItem('playerId');
                    localStorage.removeItem('playerName');
                    localStorage.removeItem('gameState');
                    localStorage.removeItem('achievements');
                    localStorage.removeItem('upgrades');
                    localStorage.removeItem('generators');
                    localStorage.removeItem('settings');
                    
                    // Trigger game reset callbacks
                    this.triggerCallbacks('game_reset', message);
                    
                    // Show notification to user
                    if (typeof showNotification === 'function') {
                        showNotification('🎮 Game Reset', 'All progress has been cleared by admin. Page will reload.', 'warning');
                    }
                    
                    // Reload the page after a short delay to ensure clean state
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                    break;
                default:
                    console.log('❓ Unknown message type:', message.type);
            }
            console.log('✅ Message processed successfully:', message.type);
        } catch (error) {
            console.error('❌ Error handling message:', error);
            console.error('❌ Message that caused error:', message);
            console.error('❌ Stack trace:', error.stack);
            // Don't close connection on message handling error
        }
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            console.log('📤 Sent:', message.type);
        } else {
            console.log('⚠️ WebSocket not ready, queueing message:', message.type, 'readyState:', this.ws ? this.ws.readyState : 'no ws');
            this.messageQueue.push(message);
        }
    }

    processMessageQueue() {
        console.log('📬 Processing', this.messageQueue.length, 'queued messages');
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
                console.log('📤 Sent queued:', message.type);
            } else {
                // Put it back and stop processing
                this.messageQueue.unshift(message);
                break;
            }
        }
    }

    // Game state methods
    loadGameState(gamePlayerId) {
        this.gamePlayerId = gamePlayerId;
        this.send({
            type: 'load_game_state',
            game_player_id: gamePlayerId
        });
    }

    saveGameState(gamePlayerId, state) {
        this.send({
            type: 'save_game_state',
            game_player_id: gamePlayerId,
            state: state
        });
    }

    registerPlayer(playerName) {
        this.send({
            type: 'register_player',
            player_name: playerName
        });
    }

    sendChatMessage(message) {
        this.send({
            type: 'chat_message',
            message: message
        });
    }

    requestLeaderboard() {
        this.send({
            type: 'request_leaderboard'
        });
    }

    sendHeartbeat(activityData = null) {
        this.send({
            type: 'heartbeat',
            activity_data: activityData
        });
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            // Send heartbeat with current game data
            let activityData = null;
            if (window.game && window.game.state) {
                activityData = {
                    score: window.game.state.totalPointsEarned || 0, // Use total points earned for leaderboard
                    current_points: window.game.state.points || 0, // Also send current spendable points
                    points_per_second: window.game.state.pointsPerSecond || 0,
                    generators_owned: Object.values(window.game.state.generators || {}).reduce((sum, count) => sum + count, 0)
                };
            }
            this.sendHeartbeat(activityData);
        }, 5000); // Every 5 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Event system
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    triggerCallbacks(event, data) {
        if (this.callbacks[event]) {
            console.log(`🔔 Triggering ${this.callbacks[event].length} callbacks for event: ${event}`);
            this.callbacks[event].forEach((callback, index) => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`❌ Error in callback ${index} for event ${event}:`, e);
                    console.error('❌ Callback data:', data);
                }
            });
        }
    }

    // Utility methods
    isGameConnected() {
        return this.isConnected && this.playerId;
    }

    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Create global WebSocket client instance
window.wsClient = new GameWebSocketClient();

// Admin helper functions for browser console
window.adminCommands = {
    // Show help
    help: function() {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        window.wsClient.send({
            type: 'admin_command',
            password: 'admin123',
            command: 'help'
        });
    },
    
    // List all players
    listPlayers: function() {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        window.wsClient.send({
            type: 'admin_command',
            password: 'admin123',
            command: 'list_players'
        });
    },
    
    // Add a new player
    addPlayer: function(playerName, points = 0) {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        if (!playerName) {
            console.error('❌ Player name is required');
            return;
        }
        console.log(`➕ Adding player: ${playerName} with ${points} points`);
        window.wsClient.send({
            type: 'admin_command',
            password: 'admin123',
            command: 'add_player',
            player_name: playerName,
            points: points
        });
    },
    
    // Edit existing player
    editPlayer: function(playerId, options = {}) {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        if (!playerId) {
            console.error('❌ Player ID is required');
            return;
        }
        
        const message = {
            type: 'admin_command',
            password: 'admin123',
            command: 'edit_player',
            target_player_id: playerId
        };
        
        if (options.points !== undefined) {
            message.points = options.points;
        }
        if (options.name !== undefined) {
            message.player_name = options.name;
        }
        
        if (!message.points && !message.player_name) {
            console.error('❌ Either points or name must be provided');
            console.log('💡 Usage: adminCommands.editPlayer("player_id", {points: 1000, name: "NewName"})');
            return;
        }
        
        console.log(`✏️ Editing player: ${playerId}`);
        window.wsClient.send(message);
    },
    
    // Delete player
    deletePlayer: function(playerId) {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        if (!playerId) {
            console.error('❌ Player ID is required');
            return;
        }
        if (!confirm(`Are you sure you want to delete player: ${playerId}?`)) {
            console.log('❌ Delete cancelled');
            return;
        }
        console.log(`🗑️ Deleting player: ${playerId}`);
        window.wsClient.send({
            type: 'admin_command',
            password: 'admin123',
            command: 'delete_player',
            target_player_id: playerId
        });
    },
    
    // Reset entire leaderboard
    resetLeaderboard: function() {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        if (!confirm('⚠️ Are you ABSOLUTELY sure you want to delete ALL players from the leaderboard? This cannot be undone!')) {
            console.log('❌ Reset cancelled');
            return;
        }
        console.log('💥 Resetting leaderboard...');
        window.wsClient.send({
            type: 'admin_command',
            password: 'admin123',
            command: 'reset_leaderboard',
            confirm: 'YES_DELETE_ALL'
        });
    },
    
    // Quick add some test players
    addTestPlayers: function() {
        console.log('🧪 Adding test players...');
        this.addPlayer('ProGamer', 10000);
        setTimeout(() => this.addPlayer('ClickMaster', 7500), 100);
        setTimeout(() => this.addPlayer('CodeNinja', 5000), 200);
        setTimeout(() => this.addPlayer('SpeedRunner', 3000), 300);
        setTimeout(() => this.addPlayer('NewbieCoder', 1000), 400);
    },
    
    // Check database state
    checkDatabase: function() {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        console.log('🔍 Checking database state...');
        window.wsClient.send({
            type: 'admin_command',
            password: 'admin123',
            command: 'check_database'
        });
    },
    
    // Edit your own score (for testing)
    giveMyself: function(points) {
        if (!window.game || !window.game.playerId) {
            console.error('❌ Game not loaded or no player ID found');
            return;
        }
        console.log(`💰 Giving yourself ${points} points`);
        this.editPlayer(window.game.playerId, { points: points });
    }
};

// Console help message
console.log(`
🔧 ADMIN COMMANDS AVAILABLE:
- adminCommands.help() - Show server help
- adminCommands.listPlayers() - List all players
- adminCommands.addPlayer(name, points) - Add new player
- adminCommands.editPlayer(playerId, {points, name}) - Edit player
- adminCommands.deletePlayer(playerId) - Delete player
- adminCommands.resetLeaderboard() - Delete all players
- adminCommands.addTestPlayers() - Add 5 test players
- adminCommands.checkDatabase() - Check database state
- adminCommands.giveMyself(points) - Edit your own score

💡 Example: adminCommands.addPlayer("TestUser", 5000)
💡 Example: adminCommands.editPlayer("player_123", {points: 9999, name: "Hacker"})
💡 Default admin password: "admin123"
`);
