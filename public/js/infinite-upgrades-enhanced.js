// Enhanced Infinite Upgrades Manager for your specific game
// Integrates with the upgradesGrid and individual skill-card elements

class InfiniteUpgradesManager {
    constructor() {
        this.isHidden = false;
        this.debugMode = false;
        this.game = null;
        this.toggleButton = null;
        this.infiniteCards = new Set();
        
        this.initialize();
    }

    initialize() {
        console.log('🚀 Initializing Enhanced Infinite Upgrades Manager...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Wait for game to be ready
        this.waitForGame();
        
        // Create toggle button
        this.createToggleButton();
        
        // Load saved preference
        this.loadSavedState();
        
        // Start monitoring for upgrades
        this.startMonitoring();
        
        // Setup debugging if needed
        this.setupDebugging();
        
        console.log('✅ Enhanced Infinite Upgrades Manager ready');
    }

    waitForGame() {
        const checkForGame = () => {
            if (window.game && window.game.upgradeData) {
                this.game = window.game;
                console.log('🎮 Game instance found');
                this.analyzeInfiniteUpgrades();
                return true;
            }
            return false;
        };

        if (!checkForGame()) {
            const interval = setInterval(() => {
                if (checkForGame()) {
                    clearInterval(interval);
                }
            }, 200);
        }
    }

    analyzeInfiniteUpgrades() {
        if (!this.game || !this.game.upgradeData) return;

        const infiniteUpgrades = this.game.upgradeData.filter(upgrade => upgrade.isInfinite);
        console.log(`🔧 Found ${infiniteUpgrades.length} infinite upgrades:`, infiniteUpgrades.map(u => u.id));
        
        // Debug infinite upgrades if enabled
        if (this.debugMode) {
            this.debugInfiniteUpgrades(infiniteUpgrades);
        }
    }

    createToggleButton() {
        if (this.toggleButton) return;

        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'infiniteUpgradesToggle';
        this.toggleButton.innerHTML = this.isHidden ? '🙈 Show Infinite Upgrades' : '👁️ Hide Infinite Upgrades';
        this.toggleButton.className = 'infinite-upgrades-toggle';
        
        // Styling for inline placement next to heading
        Object.assign(this.toggleButton.style, {
            display: 'inline-block',
            marginLeft: '15px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            userSelect: 'none',
            verticalAlign: 'middle'
        });

        // Hover effects
        this.toggleButton.addEventListener('mouseenter', () => {
            Object.assign(this.toggleButton.style, {
                transform: 'translateY(-1px) scale(1.03)',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.5)'
            });
        });

        this.toggleButton.addEventListener('mouseleave', () => {
            Object.assign(this.toggleButton.style, {
                transform: 'translateY(0) scale(1)',
                boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
            });
        });

        // Click handler
        this.toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleInfiniteUpgrades();
        });

        // Find the upgrades tab heading and add button next to it
        this.addButtonToUpgradesHeading();
        
        console.log('✅ Toggle button created next to upgrades heading');
    }

    addButtonToUpgradesHeading() {
        // Wait for the upgrades tab to exist
        const findAndAddButton = () => {
            // Look for the upgrades tab heading
            const upgradesTab = document.querySelector('#upgrades');
            if (upgradesTab) {
                const heading = upgradesTab.querySelector('h3');
                if (heading && heading.textContent.includes('Upgrades')) {
                    // Create a container for the heading and button
                    const headerContainer = document.createElement('div');
                    headerContainer.style.cssText = 'display: flex; align-items: center; margin-bottom: 1rem;';
                    
                    // Move the heading into the container
                    const headingClone = heading.cloneNode(true);
                    headingClone.style.margin = '0';
                    
                    headerContainer.appendChild(headingClone);
                    headerContainer.appendChild(this.toggleButton);
                    
                    // Replace the original heading
                    heading.parentNode.replaceChild(headerContainer, heading);
                    
                    console.log('✅ Button added next to Upgrades heading');
                    return true;
                }
            }
            return false;
        };

        // Try immediately
        if (!findAndAddButton()) {
            // If not found, try again after DOM is ready
            const observer = new MutationObserver(() => {
                if (findAndAddButton()) {
                    observer.disconnect();
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Stop trying after 5 seconds
            setTimeout(() => {
                observer.disconnect();
                console.warn('⚠️ Could not find upgrades heading, button not added');
            }, 5000);
        }
    }

    startMonitoring() {
        // Monitor for when upgrades are re-rendered
        const upgradesGrid = document.getElementById('upgradesGrid');
        if (!upgradesGrid) {
            console.warn('⚠️ upgradesGrid not found, retrying...');
            setTimeout(() => this.startMonitoring(), 1000);
            return;
        }

        // Use MutationObserver to detect when upgrades are re-rendered
        this.observer = new MutationObserver(() => {
            this.updateInfiniteCards();
        });

        this.observer.observe(upgradesGrid, {
            childList: true,
            subtree: true
        });

        // Initial update
        setTimeout(() => this.updateInfiniteCards(), 500);
    }

    updateInfiniteCards() {
        if (!this.game || !this.game.upgradeData) return;

        const upgradesGrid = document.getElementById('upgradesGrid');
        if (!upgradesGrid) return;

        // Clear previous set
        this.infiniteCards.clear();

        // Find all infinite upgrade cards
        const allCards = upgradesGrid.querySelectorAll('.skill-card[data-upgrade-id]');
        
        allCards.forEach(card => {
            const upgradeId = card.getAttribute('data-upgrade-id');
            const upgrade = this.game.upgradeData.find(u => u.id === upgradeId);
            
            if (upgrade && upgrade.isInfinite) {
                this.infiniteCards.add(card);
                
                // Add special styling for infinite upgrades
                card.classList.add('infinite-upgrade-card');
                
                // Add level indicator styling if it has a level
                const nameElement = card.querySelector('.skill-name');
                if (nameElement && nameElement.textContent.includes('(Lv.')) {
                    card.classList.add('has-level');
                }
            }
        });

        console.log(`🔧 Found ${this.infiniteCards.size} infinite upgrade cards`);

        // Apply current visibility state
        if (this.isHidden) {
            this.hideInfiniteUpgrades();
        }
    }

    toggleInfiniteUpgrades() {
        if (this.isHidden) {
            this.showInfiniteUpgrades();
        } else {
            this.hideInfiniteUpgrades();
        }
        
        this.isHidden = !this.isHidden;
        this.saveState();
        this.updateToggleButton();
    }

    hideInfiniteUpgrades() {
        this.infiniteCards.forEach(card => {
            card.style.display = 'none';
            card.classList.add('infinite-hidden');
        });
        console.log('🙈 Infinite upgrades hidden');
    }

    showInfiniteUpgrades() {
        this.infiniteCards.forEach(card => {
            card.style.display = '';
            card.classList.remove('infinite-hidden');
        });
        console.log('👁️ Infinite upgrades shown');
    }

    updateToggleButton() {
        if (this.toggleButton) {
            this.toggleButton.innerHTML = this.isHidden ? '🙈 Show Infinite Upgrades' : '👁️ Hide Infinite Upgrades';
            this.toggleButton.style.background = this.isHidden ? 
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 
                'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
        }
    }

    // Debugging functions
    setupDebugging() {
        // Add keyboard shortcut for debugging
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                this.toggleDebugMode();
            }
        });
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log(`🔧 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
        
        if (this.debugMode) {
            this.runDiagnostics();
        }
    }

    runDiagnostics() {
        console.group('🔧 INFINITE UPGRADES DIAGNOSTICS');
        
        if (!this.game) {
            console.error('❌ Game instance not found');
            console.groupEnd();
            return;
        }

        console.log('🎮 Game instance:', this.game);
        console.log('💾 Infinite upgrades state:', this.game.state.infiniteUpgrades);
        
        const infiniteUpgrades = this.game.upgradeData.filter(u => u.isInfinite);
        console.log(`⚡ Total infinite upgrades: ${infiniteUpgrades.length}`);
        
        infiniteUpgrades.forEach(upgrade => {
            const currentLevel = this.game.state.infiniteUpgrades[upgrade.id] || 0;
            const cost = this.game.getInfiniteUpgradeCost(upgrade, currentLevel);
            const affordable = this.game.state.points >= cost;
            
            console.log(`📊 ${upgrade.name} (${upgrade.id}):`, {
                level: currentLevel,
                cost: cost,
                affordable: affordable,
                baseCost: upgrade.baseCost
            });
        });
        
        console.log(`👁️ Visible cards: ${this.infiniteCards.size}`);
        console.log('🃏 Infinite cards:', Array.from(this.infiniteCards));
        
        console.groupEnd();
    }

    debugInfiniteUpgrades(infiniteUpgrades) {
        console.group('🔍 INFINITE UPGRADES DEBUG');
        
        infiniteUpgrades.forEach(upgrade => {
            const currentLevel = this.game.state.infiniteUpgrades[upgrade.id] || 0;
            const cost = this.game.getInfiniteUpgradeCost(upgrade, currentLevel);
            
            console.log(`🔧 ${upgrade.name}:`, {
                id: upgrade.id,
                level: currentLevel,
                cost: cost,
                baseCost: upgrade.baseCost,
                category: upgrade.category,
                effect: upgrade.effect,
                value: upgrade.value
            });
        });
        
        console.groupEnd();
    }

    // State persistence
    saveState() {
        try {
            localStorage.setItem('infiniteUpgradesHidden', JSON.stringify(this.isHidden));
        } catch (e) {
            console.warn('Could not save infinite upgrades state:', e);
        }
    }

    loadSavedState() {
        try {
            const saved = localStorage.getItem('infiniteUpgradesHidden');
            if (saved !== null) {
                this.isHidden = JSON.parse(saved);
                console.log(`📁 Loaded saved state: ${this.isHidden ? 'hidden' : 'visible'}`);
            }
        } catch (e) {
            console.warn('Could not load infinite upgrades state:', e);
            this.isHidden = false;
        }
    }

    // Public API
    getInfiniteUpgradeCount() {
        return this.infiniteCards.size;
    }

    getVisibleCount() {
        return Array.from(this.infiniteCards).filter(card => card.style.display !== 'none').length;
    }

    forceRefresh() {
        console.log('🔄 Force refreshing infinite upgrades...');
        setTimeout(() => this.updateInfiniteCards(), 100);
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.toggleButton) {
            this.toggleButton.remove();
        }
        this.infiniteCards.clear();
    }
}

// Auto-initialize when script loads
const infiniteUpgradesManager = new InfiniteUpgradesManager();

// Make it globally available for debugging
window.infiniteUpgradesManager = infiniteUpgradesManager;

// Debug helper
window.debugInfiniteUpgrades = () => {
    infiniteUpgradesManager.runDiagnostics();
};
