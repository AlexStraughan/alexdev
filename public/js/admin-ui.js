// Admin UI System - Floating Admin Button and Leaderboard Management Interface

class AdminUI {
    constructor() {
        this.isAuthenticated = false;
        this.currentEditingPlayer = null;
        this.playersData = [];
        
        this.initialize();
    }
    
    initialize() {
        console.log('🔧 Initializing Admin UI System...');
        
        // Wait for WebSocket to be ready
        this.waitForWebSocket();
        
        // Create the floating admin button
        this.createAdminButton();
        
        // Create the admin modal
        this.createAdminModal();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ Admin UI System ready');
    }
    
    waitForWebSocket() {
        const checkWebSocket = () => {
            if (window.wsClient && window.adminCommands) {
                console.log('🔌 WebSocket client found for admin UI');
                return true;
            }
            return false;
        };

        if (!checkWebSocket()) {
            const interval = setInterval(() => {
                if (checkWebSocket()) {
                    clearInterval(interval);
                }
            }, 200);
        }
    }
    
    createAdminButton() {
        // Remove existing button if it exists
        const existingButton = document.getElementById('adminButton');
        if (existingButton) {
            existingButton.remove();
        }
        
        const button = document.createElement('div');
        button.id = 'adminButton';
        button.className = 'admin-button';
        button.innerHTML = '⚙️';
        button.title = 'Admin Panel';
        
        button.addEventListener('click', () => {
            this.openAdminModal();
        });
        
        document.body.appendChild(button);
        this.adminButton = button;
    }
    
    createAdminModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('adminModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'admin-modal';
        
        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h2>🔧 Admin Panel</h2>
                    <div class="admin-close-btn" id="adminCloseBtn">×</div>
                </div>
                
                <!-- Login Form -->
                <div class="admin-login-form" id="adminLoginForm">
                    <h3>🔐 Admin Authentication Required</h3>
                    <div class="form-group">
                        <input type="password" id="adminPasswordInput" class="admin-input" placeholder="Enter admin password" />
                    </div>
                    <div class="form-actions">
                        <button class="admin-btn primary" id="adminLoginBtn">Login</button>
                        <button class="admin-btn" id="adminCancelBtn">Cancel</button>
                    </div>
                    <div id="adminLoginError" class="admin-error" style="display: none;"></div>
                </div>
                
                <!-- Admin Dashboard -->
                <div class="admin-dashboard" id="adminDashboard">
                    <div class="admin-section">
                        <h3>🏆 Leaderboard Management</h3>
                        <div style="margin-bottom: 1rem;">
                            <button class="admin-btn" id="refreshPlayersBtn">🔄 Refresh Players</button>
                            <button class="admin-btn" id="addPlayerBtn">➕ Add Player</button>
                            <button class="admin-btn danger" id="logoutBtn">🚪 Logout</button>
                        </div>
                        <div id="playersListContainer">
                            <div class="admin-loading">Loading players...</div>
                        </div>
                    </div>
                    
                    <!-- Edit Player Form -->
                    <div class="edit-player-form" id="editPlayerForm">
                        <h3>✏️ Edit Player</h3>
                        <div class="form-group">
                            <label for="editPlayerName">Player Name:</label>
                            <input type="text" id="editPlayerName" class="admin-input" />
                        </div>
                        <div class="form-group">
                            <label for="editPlayerPoints">Total Points:</label>
                            <input type="number" id="editPlayerPoints" class="admin-input" />
                        </div>
                        <div class="form-actions">
                            <button class="admin-btn primary" id="savePlayerBtn">💾 Save Changes</button>
                            <button class="admin-btn" id="cancelEditBtn">❌ Cancel</button>
                        </div>
                    </div>
                    
                    <!-- Add Player Form -->
                    <div class="edit-player-form" id="addPlayerForm">
                        <h3>➕ Add New Player</h3>
                        <div class="form-group">
                            <label for="newPlayerName">Player Name:</label>
                            <input type="text" id="newPlayerName" class="admin-input" />
                        </div>
                        <div class="form-group">
                            <label for="newPlayerPoints">Starting Points:</label>
                            <input type="number" id="newPlayerPoints" class="admin-input" value="0" />
                        </div>
                        <div class="form-actions">
                            <button class="admin-btn primary" id="createPlayerBtn">➕ Create Player</button>
                            <button class="admin-btn" id="cancelAddBtn">❌ Cancel</button>
                        </div>
                    </div>
                </div>
                
                <div id="adminStatusMessage"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.adminModal = modal;
    }
    
    setupEventListeners() {
        // Close modal handlers
        document.getElementById('adminCloseBtn').addEventListener('click', () => {
            this.closeAdminModal();
        });
        
        document.getElementById('adminCancelBtn').addEventListener('click', () => {
            this.closeAdminModal();
        });
        
        // Click outside to close
        this.adminModal.addEventListener('click', (e) => {
            if (e.target === this.adminModal) {
                this.closeAdminModal();
            }
        });
        
        // Login handlers
        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            this.handleLogin();
        });
        
        document.getElementById('adminPasswordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
        
        // Dashboard handlers
        document.getElementById('refreshPlayersBtn').addEventListener('click', () => {
            this.loadPlayers();
        });
        
        document.getElementById('addPlayerBtn').addEventListener('click', () => {
            this.showAddPlayerForm();
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Edit form handlers
        document.getElementById('savePlayerBtn').addEventListener('click', () => {
            this.savePlayerChanges();
        });
        
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.hideEditForm();
        });
        
        // Add form handlers
        document.getElementById('createPlayerBtn').addEventListener('click', () => {
            this.createNewPlayer();
        });
        
        document.getElementById('cancelAddBtn').addEventListener('click', () => {
            this.hideAddForm();
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.adminModal.classList.contains('show')) {
                this.closeAdminModal();
            }
        });
    }
    
    openAdminModal() {
        this.adminModal.classList.add('show');
        
        if (this.isAuthenticated) {
            this.showDashboard();
            this.loadPlayers();
        } else {
            this.showLoginForm();
        }
    }
    
    closeAdminModal() {
        this.adminModal.classList.remove('show');
        this.hideEditForm();
        this.hideAddForm();
        this.clearStatusMessage();
    }
    
    showLoginForm() {
        document.getElementById('adminLoginForm').style.display = 'block';
        document.getElementById('adminDashboard').classList.remove('show');
        document.getElementById('adminPasswordInput').focus();
    }
    
    showDashboard() {
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminDashboard').classList.add('show');
    }
    
    async handleLogin() {
        const password = document.getElementById('adminPasswordInput').value;
        const errorDiv = document.getElementById('adminLoginError');
        
        if (!password) {
            this.showError('Please enter a password', errorDiv);
            return;
        }
        
        try {
            // Store the password temporarily and test it
            window.adminSession.password = password;
            window.adminSession.timestamp = Date.now();
            
            // Test the password by trying to list players
            const success = await this.testAdminPassword();
            
            if (success) {
                this.isAuthenticated = true;
                this.adminButton.classList.add('authenticated');
                this.showDashboard();
                this.loadPlayers();
                this.showSuccess('Successfully authenticated as admin!');
            } else {
                window.adminSession.clearPassword();
                this.showError('Invalid admin password', errorDiv);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.', errorDiv);
        }
    }
    
    async testAdminPassword() {
        return new Promise((resolve) => {
            // Set up a temporary message handler to catch the response
            const originalHandler = window.wsClient.messageHandlers.admin_response;
            
            let responseReceived = false;
            window.wsClient.messageHandlers.admin_response = (message) => {
                responseReceived = true;
                window.wsClient.messageHandlers.admin_response = originalHandler;
                
                if (message.success) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            };
            
            // Send test command
            window.adminCommands.listPlayers();
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (!responseReceived) {
                    window.wsClient.messageHandlers.admin_response = originalHandler;
                    resolve(false);
                }
            }, 5000);
        });
    }
    
    handleLogout() {
        this.isAuthenticated = false;
        this.adminButton.classList.remove('authenticated');
        window.adminSession.clearPassword();
        this.showLoginForm();
        this.showSuccess('Logged out successfully');
    }
    
    async loadPlayers() {
        const container = document.getElementById('playersListContainer');
        container.innerHTML = '<div class="admin-loading">Loading players...</div>';
        
        try {
            // Get players data using existing admin command
            const playersData = await this.getPlayersData();
            this.playersData = playersData;
            this.renderPlayersList(playersData);
        } catch (error) {
            console.error('Error loading players:', error);
            container.innerHTML = '<div class="admin-error">Failed to load players. Please try again.</div>';
        }
    }
    
    async getPlayersData() {
        return new Promise((resolve, reject) => {
            // Set up a temporary message handler to catch the response
            const originalHandler = window.wsClient.messageHandlers.admin_response;
            
            let responseReceived = false;
            window.wsClient.messageHandlers.admin_response = (message) => {
                responseReceived = true;
                window.wsClient.messageHandlers.admin_response = originalHandler;
                
                if (message.success && message.players) {
                    resolve(message.players);
                } else {
                    reject(new Error(message.message || 'Failed to get players data'));
                }
            };
            
            // Send list players command
            window.adminCommands.listPlayers();
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!responseReceived) {
                    window.wsClient.messageHandlers.admin_response = originalHandler;
                    reject(new Error('Request timeout'));
                }
            }, 10000);
        });
    }
    
    renderPlayersList(players) {
        const container = document.getElementById('playersListContainer');
        
        if (!players || players.length === 0) {
            container.innerHTML = '<div class="admin-loading">No players found</div>';
            return;
        }
        
        const playersList = document.createElement('div');
        playersList.className = 'players-list';
        
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            playerItem.innerHTML = `
                <div class="player-info">
                    <div class="player-name">${this.escapeHtml(player.player_name || 'Unknown')}</div>
                    <div class="player-stats">
                        ID: ${this.escapeHtml(player.player_id)} | 
                        Points: ${this.formatNumber(player.total_points_earned || 0)} | 
                        Clicks: ${this.formatNumber(player.total_clicks || 0)}
                    </div>
                </div>
                <div class="player-actions">
                    <button class="admin-btn small primary" onclick="window.adminUI.editPlayer('${player.player_id}')">✏️ Edit</button>
                    <button class="admin-btn small danger" onclick="window.adminUI.deletePlayer('${player.player_id}', '${this.escapeHtml(player.player_name || 'Unknown')}')">🗑️ Delete</button>
                </div>
            `;
            
            playersList.appendChild(playerItem);
        });
        
        container.innerHTML = '';
        container.appendChild(playersList);
    }
    
    editPlayer(playerId) {
        const player = this.playersData.find(p => p.player_id === playerId);
        if (!player) {
            this.showError('Player not found');
            return;
        }
        
        this.currentEditingPlayer = player;
        
        document.getElementById('editPlayerName').value = player.player_name || '';
        document.getElementById('editPlayerPoints').value = player.total_points_earned || 0;
        
        document.getElementById('editPlayerForm').classList.add('show');
        this.hideAddForm();
    }
    
    async savePlayerChanges() {
        if (!this.currentEditingPlayer) return;
        
        const newName = document.getElementById('editPlayerName').value.trim();
        const newPoints = parseInt(document.getElementById('editPlayerPoints').value) || 0;
        
        if (!newName) {
            this.showError('Player name cannot be empty');
            return;
        }
        
        try {
            await this.executeAdminCommand(() => {
                return window.adminCommands.editPlayer(this.currentEditingPlayer.player_id, {
                    name: newName,
                    points: newPoints
                });
            });
            
            this.showSuccess('Player updated successfully!');
            this.hideEditForm();
            this.loadPlayers(); // Refresh the list
        } catch (error) {
            this.showError('Failed to update player: ' + error.message);
        }
    }
    
    async deletePlayer(playerId, playerName) {
        if (!confirm(`Are you sure you want to delete player "${playerName}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            await this.executeAdminCommand(() => {
                return window.adminCommands.deletePlayer(playerId);
            });
            
            this.showSuccess('Player deleted successfully!');
            this.loadPlayers(); // Refresh the list
        } catch (error) {
            this.showError('Failed to delete player: ' + error.message);
        }
    }
    
    showAddPlayerForm() {
        document.getElementById('newPlayerName').value = '';
        document.getElementById('newPlayerPoints').value = '0';
        document.getElementById('addPlayerForm').classList.add('show');
        this.hideEditForm();
    }
    
    async createNewPlayer() {
        const name = document.getElementById('newPlayerName').value.trim();
        const points = parseInt(document.getElementById('newPlayerPoints').value) || 0;
        
        if (!name) {
            this.showError('Player name cannot be empty');
            return;
        }
        
        try {
            await this.executeAdminCommand(() => {
                return window.adminCommands.addPlayer(name, points);
            });
            
            this.showSuccess('Player created successfully!');
            this.hideAddForm();
            this.loadPlayers(); // Refresh the list
        } catch (error) {
            this.showError('Failed to create player: ' + error.message);
        }
    }
    
    hideEditForm() {
        document.getElementById('editPlayerForm').classList.remove('show');
        this.currentEditingPlayer = null;
    }
    
    hideAddForm() {
        document.getElementById('addPlayerForm').classList.remove('show');
    }
    
    async executeAdminCommand(commandFunction) {
        return new Promise((resolve, reject) => {
            // Set up a temporary message handler to catch the response
            const originalHandler = window.wsClient.messageHandlers.admin_response;
            
            let responseReceived = false;
            window.wsClient.messageHandlers.admin_response = (message) => {
                responseReceived = true;
                window.wsClient.messageHandlers.admin_response = originalHandler;
                
                if (message.success) {
                    resolve(message);
                } else {
                    reject(new Error(message.message || 'Command failed'));
                }
            };
            
            // Execute the command
            commandFunction();
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!responseReceived) {
                    window.wsClient.messageHandlers.admin_response = originalHandler;
                    reject(new Error('Request timeout'));
                }
            }, 10000);
        });
    }
    
    showError(message, targetElement = null) {
        const statusDiv = targetElement || document.getElementById('adminStatusMessage');
        statusDiv.innerHTML = `<div class="admin-error">${this.escapeHtml(message)}</div>`;
        statusDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (statusDiv.innerHTML.includes(message)) {
                statusDiv.style.display = 'none';
            }
        }, 5000);
    }
    
    showSuccess(message) {
        const statusDiv = document.getElementById('adminStatusMessage');
        statusDiv.innerHTML = `<div class="admin-success">${this.escapeHtml(message)}</div>`;
        statusDiv.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (statusDiv.innerHTML.includes(message)) {
                statusDiv.style.display = 'none';
            }
        }, 3000);
    }
    
    clearStatusMessage() {
        const statusDiv = document.getElementById('adminStatusMessage');
        statusDiv.style.display = 'none';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Initialize Admin UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminUI = new AdminUI();
});

// Export for global access
window.AdminUI = AdminUI;
