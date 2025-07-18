// Leaderboard UI and Score Submission Management

// Leaderboard class for managing score submission and leaderboard display
class Leaderboard {
    constructor() {
        this.playerName = localStorage.getItem('playerName') || null;
        this.scoreSubmitted = localStorage.getItem('scoreSubmitted') === 'true';
        this.initializeUI();
    }

    initializeUI() {
        this.createLeaderboardButton();
        this.createSubmitScoreButton();
        this.createLeaderboardModal();
        this.setupEventListeners();
        
        // Start periodic updates if already submitted
        if (this.scoreSubmitted && this.playerName) {
            this.startPeriodicScoreUpdate();
        }
    }

    createLeaderboardButton() {
        const leaderboardBtn = document.createElement('button');
        leaderboardBtn.textContent = 'Leaderboard';
        leaderboardBtn.id = 'leaderboardBtn';
        leaderboardBtn.style.position = 'fixed';
        leaderboardBtn.style.top = '20px';
        leaderboardBtn.style.right = '20px';
        leaderboardBtn.style.zIndex = '2000';
        leaderboardBtn.style.padding = '0.7em 1.2em';
        leaderboardBtn.style.fontSize = '1.2em';
        leaderboardBtn.style.background = '#6366f1';
        leaderboardBtn.style.color = 'white';
        leaderboardBtn.style.border = 'none';
        leaderboardBtn.style.borderRadius = '0.4em';
        leaderboardBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        leaderboardBtn.style.cursor = 'pointer';
        document.body.appendChild(leaderboardBtn);
        
        this.leaderboardBtn = leaderboardBtn;
    }

    createSubmitScoreButton() {
        const submitScoreBtn = document.createElement('button');
        submitScoreBtn.textContent = 'Submit Score';
        submitScoreBtn.id = 'submitScoreBtn';
        submitScoreBtn.style.position = 'fixed';
        submitScoreBtn.style.top = '70px';
        submitScoreBtn.style.right = '20px';
        submitScoreBtn.style.zIndex = '2000';
        submitScoreBtn.style.padding = '0.7em 1.2em';
        submitScoreBtn.style.fontSize = '1.2em';
        submitScoreBtn.style.background = '#4facfe';
        submitScoreBtn.style.color = 'white';
        submitScoreBtn.style.border = 'none';
        submitScoreBtn.style.borderRadius = '0.4em';
        submitScoreBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        submitScoreBtn.style.cursor = 'pointer';
        document.body.appendChild(submitScoreBtn);

        // Hide button if already submitted
        if (this.scoreSubmitted) {
            submitScoreBtn.style.display = 'none';
        }

        this.submitScoreBtn = submitScoreBtn;
    }

    createLeaderboardModal() {
        // Create backdrop
        const leaderboardBackdrop = document.createElement('div');
        leaderboardBackdrop.id = 'leaderboardBackdrop';
        leaderboardBackdrop.style.position = 'fixed';
        leaderboardBackdrop.style.top = '0';
        leaderboardBackdrop.style.left = '0';
        leaderboardBackdrop.style.width = '100%';
        leaderboardBackdrop.style.height = '100%';
        leaderboardBackdrop.style.background = 'rgba(0,0,0,0.6)';
        leaderboardBackdrop.style.zIndex = '2999';
        leaderboardBackdrop.style.display = 'none';
        leaderboardBackdrop.style.backdropFilter = 'blur(5px)';
        document.body.appendChild(leaderboardBackdrop);

        // Create modal
        const leaderboardModal = document.createElement('div');
        leaderboardModal.id = 'leaderboardModal';
        leaderboardModal.style.position = 'fixed';
        leaderboardModal.style.top = '50%';
        leaderboardModal.style.left = '50%';
        leaderboardModal.style.transform = 'translate(-50%, -50%)';
        leaderboardModal.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        leaderboardModal.style.padding = '2.5em';
        leaderboardModal.style.borderRadius = '1em';
        leaderboardModal.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2)';
        leaderboardModal.style.zIndex = '3000';
        leaderboardModal.style.display = 'none';
        leaderboardModal.style.minWidth = '400px';
        leaderboardModal.style.maxWidth = '500px';
        leaderboardModal.style.color = 'white';
        leaderboardModal.style.fontFamily = '"Inter", "Segoe UI", "Roboto", sans-serif';
        leaderboardModal.innerHTML = `
            <h2 style="margin-top:0; margin-bottom:1.5em; text-align:center; font-size:2em; font-weight:700; text-shadow:2px 2px 4px rgba(0,0,0,0.3);">🏆 Leaderboard</h2>
            <div id="leaderboardContent" style="background:rgba(255,255,255,0.15); padding:1.5em; border-radius:0.8em; backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2);">Loading...</div>
            <button id="closeLeaderboard" style="margin-top:2em; padding:0.8em 2em; background:rgba(255,255,255,0.2); color:white; border:2px solid rgba(255,255,255,0.3); border-radius:0.5em; cursor:pointer; font-weight:600; font-size:1.1em; transition:all 0.3s ease; backdrop-filter:blur(5px); width:100%;">Close</button>
        `;
        document.body.appendChild(leaderboardModal);

        // Add hover effects for close button
        const closeBtn = leaderboardModal.querySelector('#closeLeaderboard');
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.3)';
            closeBtn.style.borderColor = 'rgba(255,255,255,0.5)';
            closeBtn.style.transform = 'translateY(-2px)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.2)';
            closeBtn.style.borderColor = 'rgba(255,255,255,0.3)';
            closeBtn.style.transform = 'translateY(0px)';
        });

        this.leaderboardBackdrop = leaderboardBackdrop;
        this.leaderboardModal = leaderboardModal;
        this.closeBtn = closeBtn;
    }

    setupEventListeners() {
        // Submit score handler
        this.submitScoreBtn.addEventListener('click', async () => {
            this.playerName = prompt('Enter your name for the leaderboard:');
            if (!this.playerName || this.playerName.trim().length < 1) return;
            localStorage.setItem('playerName', this.playerName);
            
            // Get score from game state
            let score = 0;
            if (window.game && window.game.state) {
                score = Math.floor(window.game.state.totalPointsEarned || window.game.state.points || 0);
            }
            
            if (score <= 0) {
                alert('You need to earn some points first!');
                return;
            }
            
            // Submit to backend
            try {
                await fetch('/api/submit_score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: this.playerName, score: score })
                });
                this.submitScoreBtn.style.display = 'none';
                localStorage.setItem('scoreSubmitted', 'true');
                this.scoreSubmitted = true;
                // Start periodic updates
                this.startPeriodicScoreUpdate();
                alert('Score submitted!');
            } catch (err) {
                alert('Failed to submit score.');
            }
        });

        // Show leaderboard popup
        this.leaderboardBtn.addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        // Close leaderboard popup
        this.closeBtn.addEventListener('click', () => {
            this.hideLeaderboard();
        });
        
        // Close on backdrop click
        this.leaderboardBackdrop.addEventListener('click', () => {
            this.hideLeaderboard();
        });
    }

    showLeaderboard() {
        this.leaderboardBackdrop.style.display = 'block';
        this.leaderboardModal.style.display = 'block';
        this.fetchLeaderboard();
    }

    hideLeaderboard() {
        this.leaderboardBackdrop.style.display = 'none';
        this.leaderboardModal.style.display = 'none';
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

    // Fetch leaderboard data from backend
    fetchLeaderboard() {
        fetch('/api/leaderboard')
            .then(res => res.json())
            .then(data => {
                const content = this.leaderboardModal.querySelector('#leaderboardContent');
                if (data.leaderboard && data.leaderboard.length > 0) {
                    const leaderboardHTML = data.leaderboard.map((entry, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                        const nameStyle = index < 3 ? 'font-weight:700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);' : 'font-weight:600;';
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8em 1em; margin:0.5em 0; background:rgba(255,255,255,0.1); border-radius:0.5em; border-left:4px solid ${index < 3 ? '#FFD700' : 'rgba(255,255,255,0.3)'};">
                                <span style="display:flex; align-items:center; gap:0.8em;">
                                    <span style="font-size:1.2em; min-width:2em;">${medal}</span>
                                    <span style="${nameStyle}">${entry.name}</span>
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
                this.leaderboardModal.querySelector('#leaderboardContent').innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8);">Failed to load leaderboard.</div>';
            });
    }
}

// Initialize leaderboard when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.leaderboard = new Leaderboard();
});

// Export for use in other modules
window.Leaderboard = Leaderboard;
