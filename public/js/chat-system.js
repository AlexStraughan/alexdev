// Chat System - Handle player chat messages and speech bubbles
class ChatSystem {
    constructor() {
        this.messages = new Map();
        this.updateInterval = null;
        this.lastMessageCheck = 0;
        this.currentPlayerName = localStorage.getItem('playerName');
        this.currentPlayerId = localStorage.getItem('playerId');
        
        this.init();
    }
    
    init() {
        this.startMessageTracking();
        this.setupEventListeners();
    }
    
    async sendMessage(message) {
        if (!this.currentPlayerId || !message || message.trim().length === 0) {
            return { success: false, error: 'Invalid message or player not found' };
        }
        
        if (message.length > 200) {
            return { success: false, error: 'Message too long (max 200 characters)' };
        }
        
        try {
            const response = await fetch('/api/chat-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_id: this.currentPlayerId,
                    message: message.trim()
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error: 'Failed to send message' };
        }
    }
    
    async fetchMessages() {
        try {
            const response = await fetch('/api/chat-messages');
            const data = await response.json();
            return data.messages || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }
    
    createSpeechBubble(message, playerElement) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-speech-bubble';
        bubble.dataset.messageId = message.id;
        
        const isCurrentPlayer = message.player_id === this.currentPlayerId;
        const bubbleColor = isCurrentPlayer ? 'rgba(74, 144, 226, 0.95)' : 'rgba(50, 50, 50, 0.95)';
        const textColor = 'white';
        
        bubble.style.cssText = `
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bubbleColor};
            color: ${textColor};
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 13px;
            max-width: 200px;
            min-width: 80px;
            word-wrap: break-word;
            white-space: pre-wrap;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 1000;
            pointer-events: none;
            animation: speechBubbleAppear 0.3s ease-out;
        `;
        
        // Add tail to speech bubble
        const tail = document.createElement('div');
        tail.style.cssText = `
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid ${bubbleColor};
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        `;
        
        bubble.appendChild(tail);
        
        // Add message content
        const messageContent = document.createElement('div');
        messageContent.textContent = message.message;
        messageContent.style.cssText = `
            font-weight: 500;
            line-height: 1.3;
        `;
        bubble.appendChild(messageContent);
        
        // Add timestamp for non-current players
        if (!isCurrentPlayer) {
            const timestamp = document.createElement('div');
            timestamp.style.cssText = `
                font-size: 10px;
                opacity: 0.7;
                margin-top: 4px;
                font-style: italic;
            `;
            const timeAgo = this.formatTimeAgo(message.timestamp);
            timestamp.textContent = timeAgo;
            bubble.appendChild(timestamp);
        }
        
        // Add CSS animation if not already added
        if (!document.querySelector('#chat-animations')) {
            const style = document.createElement('style');
            style.id = 'chat-animations';
            style.textContent = `
                @keyframes speechBubbleAppear {
                    0% { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(10px) scale(0.8); 
                    }
                    100% { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0) scale(1); 
                    }
                }
                @keyframes speechBubbleDisappear {
                    0% { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0) scale(1); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(-10px) scale(0.8); 
                    }
                }
                @keyframes feedbackAppear {
                    0% { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(5px) scale(0.9); 
                    }
                    100% { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0) scale(1); 
                    }
                }
                @keyframes feedbackDisappear {
                    0% { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0) scale(1); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(-5px) scale(0.9); 
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        return bubble;
    }
    
    formatTimeAgo(timestamp) {
        const now = Date.now() / 1000;
        const secondsAgo = Math.floor(now - timestamp);
        
        if (secondsAgo < 60) {
            return 'just now';
        } else if (secondsAgo < 3600) {
            const minutes = Math.floor(secondsAgo / 60);
            return `${minutes}m ago`;
        } else {
            const hours = Math.floor(secondsAgo / 3600);
            return `${hours}h ago`;
        }
    }
    
    showMessageOnAvatar(message) {
        // Find the avatar for this player
        const avatar = document.querySelector(`[data-player-id="${message.player_id}"]`);
        if (!avatar) return;
        
        // Remove existing speech bubble for this player
        const existingBubble = avatar.querySelector('.chat-speech-bubble');
        if (existingBubble) {
            existingBubble.style.animation = 'speechBubbleDisappear 0.3s ease-out';
            setTimeout(() => {
                if (existingBubble.parentNode) {
                    existingBubble.remove();
                }
            }, 300);
        }
        
        // Create and show new speech bubble after a short delay
        setTimeout(() => {
            const bubble = this.createSpeechBubble(message, avatar);
            avatar.appendChild(bubble);
            
            // Auto-hide after 8 seconds (longer for better readability)
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.style.animation = 'speechBubbleDisappear 0.3s ease-out';
                    setTimeout(() => {
                        if (bubble.parentNode) {
                            bubble.remove();
                        }
                    }, 300);
                }
            }, 8000);
        }, existingBubble ? 350 : 0);
    }
    
    async updateMessages() {
        const messages = await this.fetchMessages();
        
        // Show new messages
        messages.forEach(message => {
            if (!this.messages.has(message.id)) {
                this.messages.set(message.id, message);
                this.showMessageOnAvatar(message);
            }
        });
        
        // Clean up old messages
        const currentMessageIds = new Set(messages.map(m => m.id));
        this.messages.forEach((message, id) => {
            if (!currentMessageIds.has(id)) {
                this.messages.delete(id);
            }
        });
    }
    
    startMessageTracking() {
        // Update immediately
        this.updateMessages();
        
        // Then update every 5 seconds
        this.updateInterval = setInterval(() => {
            this.updateMessages();
        }, 5000);
    }
    
    setupEventListeners() {
        // Update player ID when it changes
        document.addEventListener('playerIdUpdated', (event) => {
            this.currentPlayerId = event.detail.playerId;
            this.currentPlayerName = event.detail.playerName;
        });
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize chat system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatSystem = new ChatSystem();
});

// Export for use in other modules
window.ChatSystem = ChatSystem;
