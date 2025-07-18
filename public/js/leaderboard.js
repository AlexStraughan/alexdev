// Leaderboard UI and Score Submission Management

// Leaderboard class for managing score submission and leaderboard display
class Leaderboard {
    constructor() {
        this.playerName = localStorage.getItem('playerName') || null;
        this.scoreSubmitted = localStorage.getItem('scoreSubmitted') === 'true';
        this.initializeUI();
    }

    initializeUI() {
        // Start periodic updates if already submitted
        if (this.scoreSubmitted && this.playerName) {
            this.startPeriodicScoreUpdate();
            
            // Enable player tracking for existing leaderboard participants
            if (window.playerTracker) {
                window.playerTracker.enableTracking(this.playerName);
            }
        }
    }

    // Fetch leaderboard data and display in tab
    async fetchLeaderboardForTab() {
        const content = document.getElementById('leaderboardContent');
        if (!content) return;
        
        content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8);">Loading...</div>';
        
        try {
            // Fetch both leaderboard and active players data
            const [leaderboardRes, playersRes] = await Promise.all([
                fetch('/api/leaderboard'),
                fetch('/api/active-players')
            ]);
            
            const leaderboardData = await leaderboardRes.json();
            const playersData = await playersRes.json();
            
            if (leaderboardData.leaderboard && leaderboardData.leaderboard.length > 0) {
                const currentPlayerName = localStorage.getItem('playerName');
                
                // Create a map of player names to their playtime data
                const playerPlaytimes = new Map();
                if (playersData.players) {
                    playersData.players.forEach(player => {
                        playerPlaytimes.set(player.name, player.playtime_seconds || 0);
                    });
                }
                
                const leaderboardHTML = leaderboardData.leaderboard.map((entry, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    const nameStyle = index < 3 ? 'font-weight:700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);' : 'font-weight:600;';
                    const isCurrentPlayer = currentPlayerName && entry.name === currentPlayerName;
                    const playerNameDisplay = isCurrentPlayer ? `${entry.name} (You)` : entry.name;
                    const highlightStyle = isCurrentPlayer ? 'background:rgba(255,215,0,0.15); border-left:4px solid #FFD700;' : `border-left:4px solid ${index < 3 ? '#FFD700' : 'rgba(255,255,255,0.3)'};`;
                    
                    // Get playtime for this player
                    const playtimeSeconds = playerPlaytimes.get(entry.name) || 0;
                    const playtimeDisplay = this.formatPlaytime(playtimeSeconds);
                    const hasPlaytime = playtimeSeconds > 0;
                    
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8em 1em; margin:0.5em 0; background:rgba(255,255,255,0.1); border-radius:0.5em; ${highlightStyle} backdrop-filter:blur(10px);">
                            <span style="display:flex; align-items:center; gap:0.8em;">
                                <span style="font-size:1.2em; min-width:2em;">${medal}</span>
                                <span class="player-name-with-tooltip" style="${nameStyle}; color:white; position:relative; cursor:${hasPlaytime ? 'help' : 'default'};" 
                                      data-playtime="${playtimeDisplay}" 
                                      data-has-playtime="${hasPlaytime}">
                                    ${playerNameDisplay}
                                    ${hasPlaytime ? `
                                        <div class="playtime-tooltip" style="
                                            position: absolute;
                                            bottom: 100%;
                                            left: 50%;
                                            transform: translateX(-50%);
                                            background: rgba(0, 0, 0, 0.9);
                                            color: white;
                                            padding: 8px 12px;
                                            border-radius: 6px;
                                            font-size: 12px;
                                            white-space: nowrap;
                                            opacity: 0;
                                            visibility: hidden;
                                            transition: opacity 0.3s ease, visibility 0.3s ease;
                                            z-index: 1000;
                                            pointer-events: none;
                                        ">
                                            ⏱️ ${playtimeDisplay}
                                        </div>
                                    ` : ''}
                                </span>
                            </span>
                            <span style="font-size:1.1em; font-weight:700; color:#FFD700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);">${entry.score.toLocaleString()}</span>
                        </div>
                    `;
                }).join('');
                
                content.innerHTML = leaderboardHTML;
                
                // Add hover effects for tooltips
                this.setupTooltipEffects();
                
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
