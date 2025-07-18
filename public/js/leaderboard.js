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
        }
    }

    // Fetch leaderboard data and display in tab
    fetchLeaderboardForTab() {
        const content = document.getElementById('leaderboardContent');
        if (!content) return;
        
        content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8);">Loading...</div>';
        
        fetch('/api/leaderboard')
            .then(res => res.json())
            .then(data => {
                if (data.leaderboard && data.leaderboard.length > 0) {
                    const leaderboardHTML = data.leaderboard.map((entry, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                        const nameStyle = index < 3 ? 'font-weight:700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);' : 'font-weight:600;';
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8em 1em; margin:0.5em 0; background:rgba(255,255,255,0.1); border-radius:0.5em; border-left:4px solid ${index < 3 ? '#FFD700' : 'rgba(255,255,255,0.3)'}; backdrop-filter:blur(10px);">
                                <span style="display:flex; align-items:center; gap:0.8em;">
                                    <span style="font-size:1.2em; min-width:2em;">${medal}</span>
                                    <span style="${nameStyle}; color:white;">${entry.name}</span>
                                </span>
                                <span style="font-size:1.1em; font-weight:700; color:#FFD700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);">${entry.score.toLocaleString()}</span>
                            </div>
                        `;
                    }).join('');
                    content.innerHTML = leaderboardHTML;
                } else {
                    content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8); font-style:italic;">No scores yet. Be the first to submit!</div>';
                }
            })
            .catch(() => {
                content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8);">Failed to load leaderboard.</div>';
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
