// Animated Favicon - Cycles through coding-related emojis
class AnimatedFavicon {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 32;
        this.canvas.height = 32;
        
        // Coding-themed emojis for different states
        this.normalEmojis = ['👁️', '👁️‍🗨️'];
        this.activeEmojis = ['☠️', '🔥'];
        this.currentEmojis = this.normalEmojis;
        this.currentIndex = 0;
        this.animationSpeed = 2000; // 2 seconds between frames
        this.isActive = false;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        // Create or get the favicon link element
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/x-icon';
            document.head.appendChild(favicon);
        }
        this.favicon = favicon;
        
        // Start the animation
        this.animate();
        
        // Listen for game events
        this.setupGameListeners();
    }
    
    setupGameListeners() {
        // Speed up animation when user is actively clicking
        document.addEventListener('click', () => {
            this.setActive(true);
            // Return to normal speed after 5 seconds
            setTimeout(() => this.setActive(false), 5000);
        });
        
        // Listen for physics pause/resume
        document.addEventListener('DOMContentLoaded', () => {
            // Connect to physics pause state
            if (window.physics) {
                const originalTogglePause = window.physics.togglePause;
                window.physics.togglePause = () => {
                    originalTogglePause.call(window.physics);
                    if (window.physics.isPaused) {
                        this.pause();
                        this.showEmoji('⏸️', 1000);
                    } else {
                        this.resume();
                        this.showEmoji('▶️', 1000);
                    }
                };
            }
            
            // Connect to game events when available
            setTimeout(() => {
                if (window.game) {
                    console.log('Favicon connected to game events');
                    // You can add more game event listeners here
                }
            }, 1000);
        });
    }
    
    drawEmoji(emoji) {
        // Clear canvas
        this.ctx.clearRect(0, 0, 32, 32);
        
        // Set font and draw emoji
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add a subtle glow effect that changes based on activity
        if (this.isActive) {
            this.ctx.shadowColor = 'rgba(255, 107, 107, 0.4)';
            this.ctx.shadowBlur = 6;
        } else {
            this.ctx.shadowColor = 'rgba(79, 172, 254, 0.3)';
            this.ctx.shadowBlur = 4;
        }
        
        // Draw the emoji
        this.ctx.fillText(emoji, 16, 16);
        
        // Convert to data URL and set as favicon
        const dataUrl = this.canvas.toDataURL('image/png');
        this.favicon.href = dataUrl;
    }
    
    animate() {
        // Draw current emoji
        this.drawEmoji(this.currentEmojis[this.currentIndex]);
        
        // Move to next emoji
        this.currentIndex = (this.currentIndex + 1) % this.currentEmojis.length;
        
        // Schedule next frame
        this.animationId = setTimeout(() => this.animate(), this.animationSpeed);
    }
    
    setActive(active) {
        this.isActive = active;
        this.currentEmojis = active ? this.activeEmojis : this.normalEmojis;
        this.animationSpeed = active ? 800 : 2000; // Faster when active
    }
    
    // Method to change animation speed
    setSpeed(speed) {
        this.animationSpeed = speed;
    }
    
    // Method to pause/resume animation
    pause() {
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }
    
    resume() {
        if (!this.animationId) {
            this.animate();
        }
    }
    
    // Method to show a specific emoji temporarily
    showEmoji(emoji, duration = 2000) {
        this.pause();
        this.drawEmoji(emoji);
        setTimeout(() => this.resume(), duration);
    }
}

// Initialize animated favicon when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.animatedFavicon = new AnimatedFavicon();
});

// Export for use in other modules
window.AnimatedFavicon = AnimatedFavicon;
