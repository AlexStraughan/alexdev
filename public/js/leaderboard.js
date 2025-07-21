// Leaderboard UI and Score Submission Management

// Leaderboard class for managing score submission and leaderboard display
class Leaderboard {
    constructor() {
        this.playerName = null;
        this.scoreSubmitted = false;
        this.callbackRegistered = false;
        this.initializeUI();
        // Don't set up callbacks immediately, wait for WebSocket to be ready
    }

    setupWebSocketCallbacks() {
        // Set up WebSocket callback for leaderboard updates (only once)
        if (this.callbackRegistered) {
            console.log('🏆 Leaderboard callback already registered, skipping');
            return;
        }
        
        if (window.wsClient && window.wsClient.isConnected) {
            console.log('🏆 Setting up leaderboard callback - WebSocket is ready');
            window.wsClient.on('leaderboard_update', (message) => {
                console.log('🏆 Leaderboard callback triggered with data:', message.leaderboard);
                this.renderLeaderboard(message.leaderboard);
            });
            this.callbackRegistered = true;
        } else {
            // If WebSocket client isn't ready yet, try again in a moment
            console.log('🏆 WebSocket not ready, retrying callback setup in 200ms');
            setTimeout(() => this.setupWebSocketCallbacks(), 200);
        }
    }

    initializeUI() {
        // No automatic initialization since we're using server-side state
    }

    // Fetch leaderboard data via WebSocket
    async fetchLeaderboardForTab() {
        const content = document.getElementById('leaderboardContent');
        if (!content) return;
        
        content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8);">Loading...</div>';
        
        // Make sure callback is set up before requesting data
        this.setupWebSocketCallbacks();
        
        // Force save current game state to update the database with latest score
        if (window.game && window.game.isRegistered) {
            console.log('🏆 Forcing game state save before leaderboard refresh...');
            await window.game.saveGameState();
            
            // Wait a moment for the save to complete
            setTimeout(() => {
                if (window.wsClient && window.wsClient.isConnected) {
                    console.log('🏆 Requesting fresh leaderboard data...');
                    window.wsClient.requestLeaderboard();
                } else {
                    content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8);">WebSocket not connected</div>';
                }
            }, 200);
        } else {
            // If not registered, just request leaderboard normally
            if (window.wsClient && window.wsClient.isConnected) {
                window.wsClient.requestLeaderboard();
            } else {
                content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8);">WebSocket not connected</div>';
            }
        }
    }
    
    formatLargeNumber(number) {
        if (number < 1000000000) { // Less than 1 billion (9 digits)
            return number.toLocaleString();
        }
        
        // Convert to scientific notation for large numbers
        const exponent = Math.floor(Math.log10(number));
        const mantissa = number / Math.pow(10, exponent);
        
        // Format mantissa to 3 significant digits
        const formattedMantissa = mantissa.toFixed(2);
        
        // Create superscript exponent
        const superscriptMap = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
            '-': '⁻'
        };
        
        const superscriptExponent = exponent.toString().split('').map(char => superscriptMap[char] || char).join('');
        
        return `${formattedMantissa}×10${superscriptExponent}`;
    }
    
    renderLeaderboard(leaderboardData) {
        const content = document.getElementById('leaderboardContent');
        if (!content) return;
        
        console.log('🏆 Rendering leaderboard with data:', leaderboardData);
        
        try {
            if (leaderboardData && leaderboardData.length > 0) {
                const currentPlayerName = window.game && window.game.isRegistered ? window.game.playerName : null;
                
                const leaderboardHTML = leaderboardData.map((entry, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    const nameStyle = index < 3 ? 'font-weight:700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);' : 'font-weight:600;';
                    const isCurrentPlayer = currentPlayerName && entry.player_name === currentPlayerName;
                    const playerNameDisplay = isCurrentPlayer ? `${entry.player_name || 'Anonymous'} (You)` : (entry.player_name || 'Anonymous');
                    const highlightStyle = isCurrentPlayer ? 'background:rgba(255,215,0,0.15); border-left:4px solid #FFD700;' : `border-left:4px solid ${index < 3 ? '#FFD700' : 'rgba(255,255,255,0.3)'};`;
                    
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8em 1em; margin:0.5em 0; background:rgba(255,255,255,0.1); border-radius:0.5em; ${highlightStyle} backdrop-filter:blur(10px);">
                            <span style="display:flex; align-items:center; gap:0.8em;">
                                <span style="font-size:1.2em; min-width:2em;">${medal}</span>
                                <span style="${nameStyle}; color:white;">${playerNameDisplay}</span>
                            </span>
                            <span style="font-size:1.1em; font-weight:700; color:#FFD700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);">${this.formatLargeNumber(entry.points)}</span>
                        </div>
                    `;
                }).join('');
                
                content.innerHTML = leaderboardHTML;
            } else {
                content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8); font-style:italic;">No scores yet. Be the first to submit!</div>';
            }
        } catch (error) {
            content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8);">Failed to load leaderboard.</div>';
        }
    }
    
    formatPlaytime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
    }
    
    setupTooltipEffects() {
        const tooltipElements = document.querySelectorAll('.player-name-with-tooltip[data-has-playtime="true"]');
        
        tooltipElements.forEach(element => {
            const tooltip = element.querySelector('.playtime-tooltip');
            if (!tooltip) return;
            
            element.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
            });
            
            element.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            });
        });
    }

    // Periodic score update every 5 minutes
    startPeriodicScoreUpdate() {
        setInterval(async () => {
            if (!this.playerName) return;
            let score = 0;
            if (window.game && window.game.state) {
                score = Math.floor(window.game.state.totalPointsEarned || window.game.state.points || 0);
            }
            if (score <= 0) return;
            
            try {
                await fetch('/api/submit_score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: this.playerName, score: score })
                });
            } catch (err) {
                // Silent fail
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
}

// Initialize leaderboard when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.leaderboard = new Leaderboard();
});

// Export for use in other modules
window.Leaderboard = Leaderboard;
