// Leaderboard UI and Score Submission Management

// Leaderboard class for managing score submission and leaderboard display
class Leaderboard {
    constructor() {
        this.playerName = null;
        this.scoreSubmitted = false;
        this.callbackRegistered = false;
        this.latestLeaderboardData = null; // Store latest data
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
                this.latestLeaderboardData = message.leaderboard; // Store the data
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
        // Use querySelector to find the element even if tab is hidden
        const content = document.querySelector('#leaderboardContent');
        if (!content) {
            console.log('🏆 leaderboardContent not found in fetchLeaderboardForTab');
            return;
        }
        
        // Show immediate loading feedback with opacity and overlay
        content.style.position = 'relative';
        content.style.opacity = '0.7';
        
        // Remove any existing loading overlay
        const existingLoading = content.querySelector('#leaderboard-loading');
        if (existingLoading) {
            existingLoading.remove();
        }
        
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'leaderboard-loading';
        loadingOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            padding: 1.5em 2em;
            border-radius: 0.8em;
            color: white;
            font-size: 1.1em;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: pulse 1.5s ease-in-out infinite alternate;
        `;
        loadingOverlay.innerHTML = '🏆 Refreshing leaderboard...';
        
        // Add pulse animation if it doesn't exist
        if (!document.querySelector('#leaderboard-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'leaderboard-pulse-style';
            style.textContent = `
                @keyframes pulse {
                    from { opacity: 0.8; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        content.appendChild(loadingOverlay);
        
        // Clear any cached data to force fresh fetch
        this.latestLeaderboardData = null;
        
        // Make sure callback is set up before requesting data
        this.setupWebSocketCallbacks();
        
        // Force save current player state and request fresh data
        console.log('🏆 Forcing game state save before leaderboard refresh...');
        if (window.game && window.game.saveGameState) {
            // Use the game's save method which has all the proper parameters
            window.game.saveGameState();
        }
        
        // Small delay then request fresh leaderboard data
        setTimeout(() => {
            console.log('🏆 Requesting fresh leaderboard data...');
            console.log('🏆 wsClient exists:', !!window.wsClient);
            console.log('🏆 wsClient isConnected:', window.wsClient?.isConnected);
            
            if (window.wsClient && window.wsClient.isConnected) {
                console.log('🏆 Calling wsClient.requestLeaderboard() for fresh data...');
                // Request fresh leaderboard data (this should trigger server to rebuild leaderboard)
                window.wsClient.requestLeaderboard();
            } else {
                console.error('🏆 wsClient not available or not connected!');
                this.clearLeaderboardLoading();
            }
        }, 100);
    }
    
    // Clear loading state when leaderboard data is received
    clearLeaderboardLoading() {
        const content = document.querySelector('#leaderboardContent');
        const loading = document.querySelector('#leaderboard-loading');
        
        if (content) {
            content.style.opacity = '1';
            content.style.position = 'static';
        }
        if (loading) {
            loading.remove();
        }
    }
    
    formatLargeNumber(number) {
        // Convert to integer first to remove decimals
        const intNumber = Math.floor(number);
        
        if (intNumber < 1000000000000) { // Less than 1 trillion (12 digits)
            return intNumber.toLocaleString(); // Normal formatting with commas: 19,095,694
        }
        
        // Convert to scientific notation for very large numbers (1 trillion+)
        const exponent = Math.floor(Math.log10(intNumber));
        const mantissa = intNumber / Math.pow(10, exponent);
        
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
        console.log('🏆 Looking for leaderboardContent element...');
        
        // Clear loading state immediately when we receive data
        this.clearLeaderboardLoading();
        
        // Debug: Show all elements in the document
        console.log('🏆 All elements with ID containing "leaderboard":', 
            Array.from(document.querySelectorAll('[id*="leaderboard"]')).map(el => ({id: el.id, tagName: el.tagName, visible: el.style.display !== 'none'})));
        
        console.log('🏆 All elements with ID containing "Content":', 
            Array.from(document.querySelectorAll('[id*="Content"]')).map(el => ({id: el.id, tagName: el.tagName, visible: el.style.display !== 'none'})));
            
        console.log('🏆 Current active tab:', document.querySelector('.tab-content.active')?.id);
        
        // Use querySelector instead of getElementById to find elements in hidden tabs
        const content = document.querySelector('#leaderboardContent');
        console.log('🏆 Element found with querySelector:', !!content);
        
        if (!content) {
            console.error('🏆 leaderboardContent element not found even with querySelector!');
            // Store the data for when tab becomes visible
            this.latestLeaderboardData = leaderboardData;
            
            // Try again in 200ms, up to 5 times only
            this.retryCount = (this.retryCount || 0) + 1;
            if (this.retryCount <= 5) {
                console.log(`🏆 Scheduling retry attempt ${this.retryCount} in 200ms`);
                setTimeout(() => {
                    console.log(`🏆 Retry attempt ${this.retryCount}/5`);
                    this.renderLeaderboard(leaderboardData);
                }, 200);
            } else {
                console.error('🏆 Failed to find leaderboardContent after 5 retries');
                console.error('🏆 Creating emergency leaderboard element...');
                this.createEmergencyLeaderboard(leaderboardData);
                this.retryCount = 0;
            }
            return;
        }
        
        // Reset retry count on success
        this.retryCount = 0;
        
        // Store the data regardless of visibility
        this.latestLeaderboardData = leaderboardData;
        
        console.log('🏆 Rendering leaderboard with data:', leaderboardData);
        console.log('🏆 First entry structure:', leaderboardData[0]);
        
        try {
            if (leaderboardData && leaderboardData.length > 0) {
                const currentPlayerName = window.game && window.game.isRegistered ? window.game.playerName : null;
                const currentPlayerId = window.game && window.game.playerId ? window.game.playerId : null;
                console.log('🏆 Current player name for highlighting:', currentPlayerName);
                console.log('🏆 Current player ID for highlighting:', currentPlayerId);
                
                const leaderboardHTML = leaderboardData.map((entry, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    const nameStyle = index < 3 ? 'font-weight:700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);' : 'font-weight:600;';
                    // Check both player ID and name to identify current player - BOTH must match
                    const isCurrentPlayer = currentPlayerName && currentPlayerId && 
                                          (entry.player_name === currentPlayerName || entry.name === currentPlayerName) &&
                                          (entry.player_id === currentPlayerId);
                    const playerName = entry.player_name || entry.name || 'Anonymous';
                    const playerNameDisplay = isCurrentPlayer ? `${playerName} (You)` : playerName;
                    const highlightStyle = isCurrentPlayer ? 'background:rgba(255,215,0,0.15); border-left:4px solid #FFD700;' : `border-left:4px solid ${index < 3 ? '#FFD700' : 'rgba(255,255,255,0.3)'};`;
                    
                    console.log(`🏆 Player ${index + 1}: ${playerName}, ID: ${entry.player_id}, Current: ${isCurrentPlayer}`);
                    
                    // Handle different possible field names for score
                    const score = entry.score || entry.total_points_earned || entry.points || 0;
                    console.log(`🏆 Player ${index + 1}: ${playerName}, Score: ${score}, Entry:`, entry);
                    
                    try {
                        const formattedScore = this.formatLargeNumber(score);
                        console.log(`🏆 Formatted score for ${playerName}: ${formattedScore}`);
                        
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8em 1em; margin:0.5em 0; background:rgba(255,255,255,0.1); border-radius:0.5em; ${highlightStyle} backdrop-filter:blur(10px);">
                                <span style="display:flex; align-items:center; gap:0.8em;">
                                    <span style="font-size:1.2em; min-width:2em;">${medal}</span>
                                    <span style="${nameStyle}; color:white;">${playerNameDisplay}</span>
                                </span>
                                <span style="font-size:1.1em; font-weight:700; color:#FFD700; text-shadow:1px 1px 2px rgba(0,0,0,0.3);">${formattedScore}</span>
                            </div>
                        `;
                    } catch (formatError) {
                        console.error(`🏆 Error formatting entry ${index}:`, formatError);
                        return `<div>Error rendering player ${index + 1}</div>`;
                    }
                }).join('');
                
                console.log('🏆 Generated leaderboard HTML length:', leaderboardHTML.length);
                console.log('🏆 First 200 chars of HTML:', leaderboardHTML.substring(0, 200));
                
                content.innerHTML = leaderboardHTML;
                console.log('🏆 Leaderboard HTML successfully set to content element');
            } else {
                console.log('🏆 No leaderboard data available');
                content.innerHTML = '<div style="text-align:center; padding:2em; color:rgba(255,255,255,0.8); font-style:italic;">No scores yet. Be the first to submit!</div>';
            }
        } catch (error) {
            console.error('🏆 Error rendering leaderboard:', error);
            console.error('🏆 Error stack:', error.stack);
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
    
    createEmergencyLeaderboard(leaderboardData) {
        console.log('🏆 Creating emergency leaderboard...');
        
        // First, let's check if there's already a leaderboardContent that we can use
        let existingContent = document.querySelector('#leaderboardContent');
        if (existingContent) {
            console.log('🏆 Found existing leaderboardContent, cleaning it up...');
            existingContent.innerHTML = '';
            existingContent.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 0.5em; padding: 1em; border: 1px solid rgba(255,255,255,0.1);';
            this.renderLeaderboard(leaderboardData);
            return;
        }
        
        // If no existing element, create one (fallback)
        const leaderboardTab = document.querySelector('#leaderboard');
        if (!leaderboardTab) {
            console.error('🏆 Even leaderboard tab not found!');
            return;
        }
        
        // Look for the section that should contain leaderboardContent
        const topScoresSection = Array.from(leaderboardTab.querySelectorAll('h4')).find(h4 => h4.textContent.includes('Top Scores'));
        
        if (topScoresSection && topScoresSection.parentNode) {
            // Create the missing leaderboardContent element in the right place
            const contentDiv = document.createElement('div');
            contentDiv.id = 'leaderboardContent';
            contentDiv.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 0.5em; padding: 1em; border: 1px solid rgba(255,255,255,0.1); margin-top: 1em;';
            
            // Insert after the h4
            topScoresSection.parentNode.insertBefore(contentDiv, topScoresSection.nextSibling);
            console.log('🏆 Emergency leaderboard element created in proper location');
        } else {
            // Fallback: create at end of tab
            const contentDiv = document.createElement('div');
            contentDiv.id = 'leaderboardContent';
            contentDiv.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 0.5em; padding: 1em; border: 1px solid rgba(255,255,255,0.1); margin-top: 1em;';
            leaderboardTab.appendChild(contentDiv);
            console.log('🏆 Emergency leaderboard element created at tab end');
        }
        
        // Now render with the new element
        this.renderLeaderboard(leaderboardData);
    }
}

// Initialize leaderboard when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.leaderboard = new Leaderboard();
    
    // Set up leaderboard tab click handler for fresh data
    const setupLeaderboardTabHandler = () => {
        // Look for leaderboard tab button/link
        const leaderboardTab = document.querySelector('[data-tab="leaderboard"]') || 
                              document.querySelector('#leaderboardTab') ||
                              document.querySelector('[onclick*="leaderboard"]') ||
                              document.querySelector('a[href*="leaderboard"]') ||
                              document.querySelector('button[data-target="leaderboard"]');
        
        if (leaderboardTab) {
            console.log('🏆 Found leaderboard tab element, setting up click handler');
            leaderboardTab.addEventListener('click', (e) => {
                console.log('🏆 Leaderboard tab clicked, forcing fresh data fetch');
                // Small delay to let tab switching complete first
                setTimeout(() => {
                    window.leaderboard.fetchLeaderboardForTab();
                }, 50);
            });
        } else {
            console.log('🏆 Leaderboard tab element not found, trying again in 500ms');
            // If tab isn't found, try again after a delay (common with dynamic content)
            setTimeout(setupLeaderboardTabHandler, 500);
        }
    };
    
    // Set up the handler
    setupLeaderboardTabHandler();
});

// Also expose a global function for manual triggering
window.refreshLeaderboard = () => {
    if (window.leaderboard) {
        window.leaderboard.fetchLeaderboardForTab();
    }
};

// Export for use in other modules
window.Leaderboard = Leaderboard;
