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
    
    createChatInput() {
        return `
            <div class="chat-input-container" style="
                position: absolute;
                bottom: 45px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 255, 255, 0.98);
                border: 2px solid #4a90e2;
                border-radius: 20px;
                padding: 8px 12px;
                display: none;
                min-width: 220px;
                max-width: 280px;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                z-index: 1001;
                animation: chatInputAppear 0.3s ease-out;
            ">
                <input type="text" class="chat-input" placeholder="Type a message..." style="
                    border: none;
                    outline: none;
                    background: transparent;
                    width: 100%;
                    font-size: 14px;
                    color: #333;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 4px 0;
                " maxlength="200">
                <div class="chat-input-buttons" style="
                    margin-top: 8px;
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                ">
                    <button class="chat-send-btn" style="
                        background: linear-gradient(135deg, #4a90e2, #357abd);
                        color: white;
                        border: none;
                        border-radius: 15px;
                        padding: 6px 12px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                        box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
                    ">Send</button>
                    <button class="chat-cancel-btn" style="
                        background: linear-gradient(135deg, #ddd, #bbb);
                        color: #333;
                        border: none;
                        border-radius: 15px;
                        padding: 6px 12px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    ">Cancel</button>
                </div>
                <div class="chat-char-count" style="
                    font-size: 10px;
                    color: #666;
                    text-align: right;
                    margin-top: 4px;
                    opacity: 0.7;
                ">0/200</div>
            </div>
        `;
    }

    setupChatInput(avatar) {
        const chatContainer = avatar.querySelector('.chat-input-container');
        const chatInput = avatar.querySelector('.chat-input');
        const sendBtn = avatar.querySelector('.chat-send-btn');
        const cancelBtn = avatar.querySelector('.chat-cancel-btn');
        const charCount = avatar.querySelector('.chat-char-count');
        
        if (!chatContainer || !chatInput || !sendBtn || !cancelBtn || !charCount) return;
        
        let isInputActive = false;
        
        // Add button hover effects
        sendBtn.addEventListener('mouseenter', () => {
            sendBtn.style.transform = 'translateY(-1px)';
            sendBtn.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.4)';
        });
        
        sendBtn.addEventListener('mouseleave', () => {
            sendBtn.style.transform = 'translateY(0)';
            sendBtn.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.3)';
        });
        
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.transform = 'translateY(-1px)';
            cancelBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });
        
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.transform = 'translateY(0)';
            cancelBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
        
        // Update character count
        chatInput.addEventListener('input', () => {
            const count = chatInput.value.length;
            charCount.textContent = `${count}/200`;
            
            if (count > 180) {
                charCount.style.color = '#ff4444';
            } else if (count > 150) {
                charCount.style.color = '#ff8800';
            } else {
                charCount.style.color = '#666';
            }
        });
        
        const showChatInput = () => {
            chatContainer.style.display = 'block';
            chatContainer.style.animation = 'chatInputAppear 0.3s ease-out';
            setTimeout(() => chatInput.focus(), 100);
        };
        
        const hideChatInput = () => {
            if (!isInputActive) {
                chatContainer.style.animation = 'chatInputDisappear 0.3s ease-out';
                setTimeout(() => {
                    chatContainer.style.display = 'none';
                    chatInput.value = '';
                    charCount.textContent = '0/200';
                    charCount.style.color = '#666';
                }, 300);
            }
        };
        
        const sendMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;
            
            if (window.chatSystem) {
                const result = await window.chatSystem.sendMessage(message);
                if (result.success) {
                    isInputActive = false;
                    hideChatInput();
                    // Show success feedback
                    this.showMessageFeedback(avatar, 'Message sent! 💬', '#4a90e2');
                } else {
                    this.showMessageFeedback(avatar, result.error || 'Failed to send message', '#ff4444');
                }
            }
        };
        
        // Show chat input on avatar hover (only for current player)
        avatar.addEventListener('mouseenter', showChatInput);
        
        // Hide chat input when mouse leaves avatar area - but only if input is not active
        avatar.addEventListener('mouseleave', (e) => {
            if (!isInputActive && !chatContainer.contains(e.relatedTarget)) {
                setTimeout(() => {
                    if (!chatContainer.matches(':hover') && !isInputActive) {
                        hideChatInput();
                    }
                }, 100);
            }
        });
        
        // Keep chat input visible when hovering over it
        chatContainer.addEventListener('mouseenter', () => {
            chatContainer.style.display = 'block';
        });
        
        // Only hide when leaving chat container if input is not focused
        chatContainer.addEventListener('mouseleave', (e) => {
            if (!isInputActive && !avatar.contains(e.relatedTarget)) {
                hideChatInput();
            }
        });
        
        // Mark input as active when focused
        chatInput.addEventListener('focus', () => {
            isInputActive = true;
            chatContainer.style.display = 'block';
        });
        
        // Mark input as inactive when blurred (but don't hide immediately)
        chatInput.addEventListener('blur', () => {
            setTimeout(() => {
                isInputActive = false;
                // Only hide if mouse is not over the container
                if (!chatContainer.matches(':hover') && !avatar.matches(':hover')) {
                    hideChatInput();
                }
            }, 150);
        });
        
        // Send message on Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
            if (e.key === 'Escape') {
                isInputActive = false;
                hideChatInput();
            }
        });
        
        // Send message on button click
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessage();
        });
        
        // Cancel on button click
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isInputActive = false;
            hideChatInput();
        });
        
        // Add chat input animations if not already added
        if (!document.querySelector('#chat-input-animations')) {
            const style = document.createElement('style');
            style.id = 'chat-input-animations';
            style.textContent = `
                @keyframes chatInputAppear {
                    0% { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(10px) scale(0.9); 
                    }
                    100% { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0) scale(1); 
                    }
                }
                @keyframes chatInputDisappear {
                    0% { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0) scale(1); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(-10px) scale(0.9); 
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showMessageFeedback(avatar, message, color) {
        // Remove existing feedback
        const existingFeedback = avatar.querySelector('.chat-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.className = 'chat-feedback';
        feedback.style.cssText = `
            position: absolute;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: white;
            padding: 6px 10px;
            border-radius: 12px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1002;
            pointer-events: none;
            animation: feedbackAppear 0.3s ease-out;
        `;
        
        feedback.textContent = message;
        avatar.appendChild(feedback);
        
        // Auto-remove after 2 seconds
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.style.animation = 'feedbackDisappear 0.3s ease-out';
                setTimeout(() => {
                    if (feedback.parentNode) {
                        feedback.remove();
                    }
                }, 300);
            }
        }, 2000);
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
            ${isCurrentPlayer ? this.createChatInput() : ''}
        `;
        
        // Add hover effects for tooltip
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
        
        // Setup chat input for current player
        if (isCurrentPlayer) {
            this.setupChatInput(avatar);
        }
        
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
