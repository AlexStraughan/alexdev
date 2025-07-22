// Infinite Upgrades Manager - Hide/Show functionality and debugging

class InfiniteUpgradesManager {
    constructor() {
        this.isVisible = true;
        this.debugMode = false;
        this.upgradesContainer = null;
        this.toggleButton = null;
        this.initialize();
    }

    initialize() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.findUpgradesContainer();
        this.createToggleButton();
        this.loadSavedPreference();
        this.setupDebugMode();
        this.monitorUpgrades();
    }

    findUpgradesContainer() {
        // Try multiple selectors to find infinite upgrades container
        const possibleSelectors = [
            '#infiniteUpgrades',
            '.infinite-upgrades',
            '[data-upgrades="infinite"]',
            '#infinite-upgrades',
            '.infinity-upgrades',
            '#upgrades .infinite',
            '.upgrades-infinite',
            '[id*="infinite"][id*="upgrade"]',
            '[class*="infinite"][class*="upgrade"]'
        ];

        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                this.upgradesContainer = element;
                console.log(`🔧 Found infinite upgrades container: ${selector}`);
                return;
            }
        }

        // If not found, try to find by text content
        const allDivs = document.querySelectorAll('div, section, article');
        for (const div of allDivs) {
            const text = div.textContent?.toLowerCase() || '';
            if (text.includes('infinite') && text.includes('upgrade')) {
                this.upgradesContainer = div;
                console.log('🔧 Found infinite upgrades container by text content');
                return;
            }
        }

        console.warn('🔧 Infinite upgrades container not found, will retry...');
        setTimeout(() => this.findUpgradesContainer(), 1000);
    }

    createToggleButton() {
        if (!this.upgradesContainer) {
            setTimeout(() => this.createToggleButton(), 500);
            return;
        }

        // Create toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'infiniteUpgradesToggle';
        this.toggleButton.innerHTML = '👁️ Hide Infinite Upgrades';
        this.toggleButton.className = 'upgrades-toggle-btn';
        
        this.toggleButton.style.cssText = `
            margin: 0.5em 0;
            padding: 0.5em 1em;
            background: linear-gradient(135deg, rgba(100,149,237,0.2), rgba(147,112,219,0.2));
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 0.5em;
            color: white;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: 600;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5em;
            user-select: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        // Add hover effects
        this.toggleButton.addEventListener('mouseenter', () => {
            this.toggleButton.style.background = 'linear-gradient(135deg, rgba(100,149,237,0.4), rgba(147,112,219,0.4))';
            this.toggleButton.style.transform = 'translateY(-1px)';
            this.toggleButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });

        this.toggleButton.addEventListener('mouseleave', () => {
            this.toggleButton.style.background = 'linear-gradient(135deg, rgba(100,149,237,0.2), rgba(147,112,219,0.2))';
            this.toggleButton.style.transform = 'translateY(0)';
            this.toggleButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });

        // Add click handler
        this.toggleButton.addEventListener('click', () => {
            this.toggleVisibility();
        });

        // Insert button before the upgrades container
        this.upgradesContainer.parentNode.insertBefore(this.toggleButton, this.upgradesContainer);
        
        console.log('✅ Infinite upgrades toggle button created');
    }

    toggleVisibility() {
        if (!this.upgradesContainer) return;

        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            // Show upgrades
            this.upgradesContainer.style.display = '';
            this.upgradesContainer.style.opacity = '1';
            this.upgradesContainer.style.transform = 'translateY(0)';
            this.toggleButton.innerHTML = '👁️ Hide Infinite Upgrades';
            console.log('👁️ Infinite upgrades shown');
        } else {
            // Hide upgrades with animation
            this.upgradesContainer.style.opacity = '0';
            this.upgradesContainer.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (!this.isVisible) { // Double-check in case toggled again
                    this.upgradesContainer.style.display = 'none';
                }
            }, 300);
            this.toggleButton.innerHTML = '🙈 Show Infinite Upgrades';
            console.log('🙈 Infinite upgrades hidden');
        }
        
        // Save preference
        localStorage.setItem('infiniteUpgradesVisible', this.isVisible.toString());
    }

    loadSavedPreference() {
        const saved = localStorage.getItem('infiniteUpgradesVisible');
        if (saved !== null) {
            this.isVisible = saved === 'true';
            
            if (!this.isVisible && this.upgradesContainer && this.toggleButton) {
                this.upgradesContainer.style.display = 'none';
                this.toggleButton.innerHTML = '🙈 Show Infinite Upgrades';
            }
        }
    }

    setupDebugMode() {
        // Enable debug mode with console command
        window.debugInfiniteUpgrades = () => {
            this.debugMode = !this.debugMode;
            console.log(`🔧 Infinite upgrades debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
            
            if (this.debugMode) {
                this.showDebugInfo();
            }
        };

        console.log('🔧 Use debugInfiniteUpgrades() to enable debug mode');
    }

    showDebugInfo() {
        if (!this.debugMode) return;

        console.group('🔧 Infinite Upgrades Debug Info');
        console.log('Container found:', !!this.upgradesContainer);
        console.log('Container element:', this.upgradesContainer);
        console.log('Toggle button:', this.toggleButton);
        console.log('Currently visible:', this.isVisible);
        
        if (this.upgradesContainer) {
            console.log('Container children:', this.upgradesContainer.children.length);
            console.log('Container HTML:', this.upgradesContainer.innerHTML.substring(0, 200) + '...');
        }

        // Check for upgrade-related objects in window
        const upgradeObjects = Object.keys(window).filter(key => 
            key.toLowerCase().includes('upgrade') || 
            key.toLowerCase().includes('infinite')
        );
        console.log('Upgrade-related global objects:', upgradeObjects);

        console.groupEnd();
    }

    monitorUpgrades() {
        // Monitor for upgrade purchases and functionality
        let lastUpgradeCount = 0;
        
        setInterval(() => {
            if (!this.debugMode || !this.upgradesContainer) return;
            
            const currentCount = this.upgradesContainer.querySelectorAll('[data-upgrade], .upgrade, button').length;
            if (currentCount !== lastUpgradeCount) {
                console.log(`🔧 Upgrade elements changed: ${lastUpgradeCount} → ${currentCount}`);
                lastUpgradeCount = currentCount;
            }
        }, 2000);
    }

    // Public methods for external use
    show() {
        if (!this.isVisible) {
            this.toggleVisibility();
        }
    }

    hide() {
        if (this.isVisible) {
            this.toggleVisibility();
        }
    }

    forceRefresh() {
        this.setup();
        console.log('🔧 Infinite upgrades manager refreshed');
    }
}

// Auto-initialize
window.infiniteUpgradesManager = new InfiniteUpgradesManager();

// Expose useful functions globally
window.hideInfiniteUpgrades = () => window.infiniteUpgradesManager?.hide();
window.showInfiniteUpgrades = () => window.infiniteUpgradesManager?.show();
window.refreshUpgradesManager = () => window.infiniteUpgradesManager?.forceRefresh();

console.log('🔧 Infinite Upgrades Manager loaded');
console.log('Commands: hideInfiniteUpgrades(), showInfiniteUpgrades(), debugInfiniteUpgrades()');
