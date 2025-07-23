// WebSocket Game Client - Handles real-time communication with game server

// Debug mode control
window.wsDebug = {
    enabled: false,
    toggle: function() {
        this.enabled = !this.enabled;
        console.log(`🔧 WebSocket debug mode ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
        if (this.enabled) {
            console.log('🔧 Debug commands: wsDebug.enabled = true/false, or use wsDebug.toggle()');
        }
        return this.enabled;
    },
    log: function(message, ...args) {
        if (this.enabled) {
            console.log(message, ...args);
        }
    },
    // Always log important messages regardless of debug mode
    important: function(message, ...args) {
        console.log(message, ...args);
    }
};

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
            'active_players_update': [],
            'admin_response': []
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
            window.wsDebug.important('🔌 Connecting to WebSocket...');
            
            // Close any existing connection
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            
            // Use the current hostname for WebSocket connection via Apache proxy
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
            const wsUrl = `${protocol}//${hostname}/ws/`;
            
            window.wsDebug.log(`🔌 Connecting to WebSocket at: ${wsUrl}`);
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = (event) => {
                window.wsDebug.important('🔌 WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Add a small delay to ensure connection is fully established
                setTimeout(() => {
                    // Process queued messages
                    this.processMessageQueue();
                    
                    // Trigger connection callbacks
                    this.triggerCallbacks('connected', { connected: true });
                    
                    // Start heartbeat to keep connection alive and send activity data
                    this.startHeartbeat();
                    window.wsDebug.log('💓 Heartbeat started');
                    
                    // Dispatch websocketReady event for other systems
                    document.dispatchEvent(new CustomEvent('websocketReady', {
                        detail: { wsClient: this }
                    }));
                }, 100);
            };

            this.ws.onmessage = (event) => {
                try {
                    // window.wsDebug.log('📨 Raw message received:', event.data);
                    const message = JSON.parse(event.data);
                    window.wsDebug.log('📨 Parsed message:', message.type, message);
                    
                    // Add detailed logging for leaderboard and active players
                    if (message.type === 'leaderboard_update') {
                        window.wsDebug.log('🏆 Leaderboard data received:', message.leaderboard);
                        window.wsDebug.log('🏆 First entry:', message.leaderboard[0]);
                    }
                    if (message.type === 'active_players_update') {
                        window.wsDebug.log('👥 Active players data received:', message.players);
                    }
                    
                    this.handleMessage(message);
                } catch (e) {
                    console.error('❌ Error parsing WebSocket message:', e);
                    console.error('❌ Raw message:', event.data);
                    // Don't close connection on parse error
                }
            };

            this.ws.onclose = (event) => {
                window.wsDebug.important('🔌 WebSocket disconnected, code:', event.code, 'reason:', event.reason);
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
            window.wsDebug.important(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('❌ Max reconnect attempts reached. Please refresh the page.');
        }
    }

    handleMessage(message) {
        // Only log important message types by default, enable debug for all
        const shouldLog = ['connected', 'admin_response', 'game_reset', 'player_registered'].includes(message.type);
        if (shouldLog) {
            window.wsDebug.important('📨 Processing message:', message.type);
        } else {
            window.wsDebug.log('📨 Processing message:', message.type);
        }
        
        try {
            switch (message.type) {
                case 'connected':
                    window.wsDebug.important('🔌 Server confirmed connection, assigned player ID:', message.player_id);
                    this.playerId = message.player_id;
                    this.triggerCallbacks('connected', message);
                    break;
                case 'game_state_loaded':
                    window.wsDebug.log('🎮 Game state loaded');
                    this.triggerCallbacks('game_state_loaded', message);
                    break;
                case 'game_state_saved':
                    window.wsDebug.log('💾 Game state saved');
                    this.triggerCallbacks('game_state_saved', message);
                    break;
                case 'player_registered':
                    window.wsDebug.important('👤 Player registered:', message.player_name);
                    this.isRegistered = true;
                    this.playerName = message.player_name;
                    this.triggerCallbacks('player_registered', message);
                    break;
                case 'chat_message':
                    // Removed console log to reduce spam
                    this.triggerCallbacks('chat_message', message);
                    break;
                case 'leaderboard_update':
                    window.wsDebug.log('🏆 Leaderboard update received');
                    this.triggerCallbacks('leaderboard_update', message);
                    break;
                case 'active_players_update':
                    window.wsDebug.log('👥 Active players update received:', message.players?.length || 0, 'players');
                    this.triggerCallbacks('active_players_update', message);
                    break;
                case 'admin_response':
                    window.wsDebug.important('🔧 Admin response:', message.success ? '✅' : '❌', message.message);
                    if (message.success) {
                        console.log('%c' + message.message, 'color: green; font-weight: bold');
                        
                        // Check if this admin command affected the current player's score
                        if (message.updated_player_id && window.game && window.game.playerId === message.updated_player_id) {
                            window.wsDebug.important('🎮 Admin command affected current player - syncing game state...');
                            
                            // Update the game state if points were changed
                            if (message.new_points !== undefined) {
                                window.game.state.points = message.new_points;
                                window.game.state.totalPointsEarned = message.new_points;
                                
                                // Update the display using the correct method
                                if (typeof window.game.updateDisplay === 'function') {
                                    window.game.updateDisplay();
                                    
                                    // Also trigger re-render of generators and upgrades in case new items unlocked
                                    if (typeof window.game.renderGenerators === 'function') {
                                        window.game.renderGenerators();
                                    }
                                    if (typeof window.game.renderUpgrades === 'function') {
                                        window.game.renderUpgrades();
                                    }
                                } else {
                                    // Fallback: manually update point display
                                    const pointsElement = document.getElementById('points');
                                    if (pointsElement) {
                                        pointsElement.textContent = message.new_points.toLocaleString();
                                    }
                                }
                                
                                window.wsDebug.important(`🎉 Game state synced! You now have ${message.new_points.toLocaleString()} points!`);
                            }
                        }
                    } else {
                        console.error('%c' + message.message, 'color: red; font-weight: bold');
                    }
                    
                    // Trigger admin response callbacks
                    this.triggerCallbacks('admin_response', message);
                    break;
                case 'game_reset':
                    window.wsDebug.important('💥 Game reset received from server:', message.message);
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
                    window.wsDebug.log('❓ Unknown message type:', message.type);
            }
            window.wsDebug.log('✅ Message processed successfully:', message.type);
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
            window.wsDebug.log('📤 Sent:', message.type);
        } else {
            window.wsDebug.log('⚠️ WebSocket not ready, queueing message:', message.type, 'readyState:', this.ws ? this.ws.readyState : 'no ws');
            this.messageQueue.push(message);
        }
    }

    processMessageQueue() {
        window.wsDebug.log('📬 Processing', this.messageQueue.length, 'queued messages');
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
                window.wsDebug.log('📤 Sent queued:', message.type);
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
                // Reduced heartbeat console logs to reduce spam - now using debug mode
            }
            this.sendHeartbeat(activityData);
        }, 10000); // Every 10 seconds for easier debugging
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
            window.wsDebug.log(`🔔 Triggering ${this.callbacks[event].length} callbacks for event: ${event}`);
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

// Admin password management
window.adminSession = {
    password: null,
    passwordExpiry: null,
    
    getPassword: function() {
        // Check if we have a valid cached password (expires after 5 minutes)
        if (this.password && this.passwordExpiry && Date.now() < this.passwordExpiry) {
            return this.password;
        }
        
        // Prompt for password
        const password = prompt('🔐 Enter admin password:');
        if (!password) {
            console.log('❌ Admin command cancelled - no password provided');
            return null;
        }
        
        // Cache password for 5 minutes
        this.password = password;
        this.passwordExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
        console.log('🔐 Admin password cached for 5 minutes');
        
        return password;
    },
    
    clearPassword: function() {
        this.password = null;
        this.passwordExpiry = null;
        console.log('🔐 Admin password cleared from cache');
    }
};

// Admin helper functions for browser console
window.adminCommands = {
    // Show help
    help: function() {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        const password = window.adminSession.getPassword();
        if (!password) return;
        
        window.wsClient.send({
            type: 'admin_command',
            password: password,
            command: 'help'
        });
    },
    
    // List all players
    listPlayers: function() {
        if (!window.wsClient || !window.wsClient.isConnected) {
            console.error('❌ WebSocket not connected');
            return;
        }
        const password = window.adminSession.getPassword();
        if (!password) return;
        
        window.wsClient.send({
            type: 'admin_command',
            password: password,
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
        const password = window.adminSession.getPassword();
        if (!password) return;
        
        console.log(`➕ Adding player: ${playerName} with ${points} points`);
        window.wsClient.send({
            type: 'admin_command',
            password: password,
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
        const password = window.adminSession.getPassword();
        if (!password) return;
        
        const message = {
            type: 'admin_command',
            password: password,
            command: 'edit_player',
            target_player_id: playerId
        };
        
        if (options.points !== undefined) {
            message.points = options.points;
        }
        if (options.name !== undefined) {
            message.player_name = options.name;
        }
        
        if (!message.hasOwnProperty('points') && !message.hasOwnProperty('player_name')) {
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
        const password = window.adminSession.getPassword();
        if (!password) return;
        
        if (!confirm(`Are you sure you want to delete player: ${playerId}?`)) {
            console.log('❌ Delete cancelled');
            return;
        }
        console.log(`🗑️ Deleting player: ${playerId}`);
        window.wsClient.send({
            type: 'admin_command',
            password: password,
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
        const password = window.adminSession.getPassword();
        if (!password) return;
        
        if (!confirm('⚠️ Are you ABSOLUTELY sure you want to delete ALL players from the leaderboard? This cannot be undone!')) {
            console.log('❌ Reset cancelled');
            return;
        }
        console.log('💥 Resetting leaderboard...');
        window.wsClient.send({
            type: 'admin_command',
            password: password,
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
        const password = window.adminSession.getPassword();
        if (!password) return;
        
        console.log('🔍 Checking database state...');
        window.wsClient.send({
            type: 'admin_command',
            password: password,
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
    },
    
    // Clear cached admin password
    clearPassword: function() {
        window.adminSession.clearPassword();
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
- adminCommands.clearPassword() - Clear cached admin password

� DEBUG MODE:
- wsDebug.toggle() - Toggle detailed WebSocket logging
- wsDebug.enabled = true/false - Enable/disable debug mode
Current debug mode: ${window.wsDebug.enabled ? 'ENABLED' : 'DISABLED'}

�🔐 Password System:
- Admin commands will prompt for password on first use
- Password is cached for 5 minutes for convenience
- Use clearPassword() to force re-authentication

💡 Example: adminCommands.addPlayer("TestUser", 5000)
💡 Example: adminCommands.editPlayer("player_123", {points: 9999, name: "Hacker"})
💡 Example: adminCommands.giveMyself(99999)
`);
