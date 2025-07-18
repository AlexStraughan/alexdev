// Cookie Clicker Game Implementation
class Game {
    constructor() {
        this.state = {
            points: 0,
            pointsPerSecond: 0,
            generatorPointsPerSecond: 0,
            generators: {},
            clickPower: 1,
            critChance: 0, // 0-100% chance for critical clicks
            critMultiplier: 2, // How much extra damage crits do
            totalClicks: 0,
            totalPointsEarned: 0,
            achievements: [],
            upgrades: {},
            clicksPerSecond: 0,
            lastClickTime: Date.now(),
            recentClicks: [],
            gameHubRevealed: false,
            // Progressive unlock system
            upgradesTabUnlocked: false
        };

        this.generatorData = [];
        this.upgradeData = [
            // Click upgrades - show immediately when upgrades tab is unlocked
            {
                id: "double_click",
                name: "Better Mouse",
                description: "Double your clicking power!",
                cost: 100,
                effect: "clickMultiplier",
                value: 2,
                icon: "🖱️",
                category: "click",
                unlockCondition: { type: "always" }
            },
            {
                id: "super_click",
                name: "Mechanical Keyboard",
                description: "5x clicking power for the pros!",
                cost: 1000,
                effect: "clickMultiplier",
                value: 5,
                icon: "⌨️",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "double_click" }
            },
            {
                id: "crit_chance_1",
                name: "Lucky Fingers",
                description: "5% chance for critical clicks (2x damage)",
                cost: 500,
                effect: "critChance",
                value: 5,
                icon: "🍀",
                category: "click",
                unlockCondition: { type: "always" }
            },
            {
                id: "crit_chance_2",
                name: "Perfect Timing",
                description: "Additional 10% crit chance",
                cost: 5000,
                effect: "critChance",
                value: 10,
                icon: "⏰",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "crit_chance_1" }
            },
            {
                id: "crit_multiplier_1",
                name: "Critical Strike",
                description: "Critical clicks now do 3x damage instead of 2x",
                cost: 10000,
                effect: "critMultiplier",
                value: 3,
                icon: "💥",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "crit_chance_2" }
            },
            // Junior Developer upgrades - unlock when player owns a junior dev
            {
                id: "junior_coffee",
                name: "Coffee for Juniors",
                description: "Junior Developers work 2x faster",
                cost: 250,
                effect: "generatorMultiplier",
                value: 2,
                icon: "☕",
                category: "junior_dev",
                targetGenerator: "junior_dev",
                unlockCondition: { type: "generator_owned", generator: "junior_dev", count: 1 }
            },
            {
                id: "junior_documentation",
                name: "Better Documentation",
                description: "Junior Developers work 50% faster",
                cost: 1000,
                effect: "generatorMultiplier",
                value: 1.5,
                icon: "📚",
                category: "junior_dev",
                targetGenerator: "junior_dev",
                unlockCondition: { type: "generator_owned", generator: "junior_dev", count: 5 }
            },
            {
                id: "junior_mentorship",
                name: "Mentorship Program",
                description: "Junior Developers work 3x faster",
                cost: 5000,
                effect: "generatorMultiplier",
                value: 3,
                icon: "🎓",
                category: "junior_dev",
                targetGenerator: "junior_dev",
                unlockCondition: { type: "upgrade_owned", upgrade: "junior_documentation" }
            },
            {
                id: "junior_automation",
                name: "Code Templates",
                description: "Junior Developers work 2x faster",
                cost: 15000,
                effect: "generatorMultiplier",
                value: 2,
                icon: "🤖",
                category: "junior_dev",
                targetGenerator: "junior_dev",
                unlockCondition: { type: "upgrade_owned", upgrade: "junior_mentorship" }
            },
            {
                id: "junior_ai_assist",
                name: "AI Code Assistant",
                description: "Junior Developers work 5x faster",
                cost: 50000,
                effect: "generatorMultiplier",
                value: 5,
                icon: "🧠",
                category: "junior_dev",
                targetGenerator: "junior_dev",
                unlockCondition: { type: "upgrade_owned", upgrade: "junior_automation" }
            },
            // Senior Developer upgrades
            {
                id: "senior_ide",
                name: "Premium IDE",
                description: "Senior Developers work 2x faster",
                cost: 2500,
                effect: "generatorMultiplier",
                value: 2,
                icon: "💻",
                category: "senior_dev",
                targetGenerator: "senior_dev",
                unlockCondition: { type: "generator_owned", generator: "senior_dev", count: 1 }
            },
            {
                id: "senior_architecture",
                name: "System Architecture",
                description: "Senior Developers work 50% faster",
                cost: 10000,
                effect: "generatorMultiplier",
                value: 1.5,
                icon: "🏗️",
                category: "senior_dev",
                targetGenerator: "senior_dev",
                unlockCondition: { type: "generator_owned", generator: "senior_dev", count: 5 }
            },
            {
                id: "senior_refactoring",
                name: "Refactoring Tools",
                description: "Senior Developers work 3x faster",
                cost: 50000,
                effect: "generatorMultiplier",
                value: 3,
                icon: "🔧",
                category: "senior_dev",
                targetGenerator: "senior_dev",
                unlockCondition: { type: "upgrade_owned", upgrade: "senior_architecture" }
            },
            {
                id: "senior_leadership",
                name: "Tech Leadership",
                description: "Senior Developers work 2x faster",
                cost: 150000,
                effect: "generatorMultiplier",
                value: 2,
                icon: "👑",
                category: "senior_dev",
                targetGenerator: "senior_dev",
                unlockCondition: { type: "upgrade_owned", upgrade: "senior_refactoring" }
            },
            {
                id: "senior_innovation",
                name: "Innovation Lab",
                description: "Senior Developers work 5x faster",
                cost: 500000,
                effect: "generatorMultiplier",
                value: 5,
                icon: "💡",
                category: "senior_dev",
                targetGenerator: "senior_dev",
                unlockCondition: { type: "upgrade_owned", upgrade: "senior_leadership" }
            },
            // Code Monkey upgrades
            {
                id: "monkey_bananas",
                name: "Premium Bananas",
                description: "Code Monkeys work 2x faster",
                cost: 25000,
                effect: "generatorMultiplier",
                value: 2,
                icon: "🍌",
                category: "code_monkey",
                targetGenerator: "code_monkey",
                unlockCondition: { type: "generator_owned", generator: "code_monkey", count: 1 }
            },
            {
                id: "monkey_playground",
                name: "Coding Playground",
                description: "Code Monkeys work 50% faster",
                cost: 100000,
                effect: "generatorMultiplier",
                value: 1.5,
                icon: "🎪",
                category: "code_monkey",
                targetGenerator: "code_monkey",
                unlockCondition: { type: "generator_owned", generator: "code_monkey", count: 5 }
            },
            {
                id: "monkey_typewriter",
                name: "Infinite Typewriters",
                description: "Code Monkeys work 3x faster",
                cost: 500000,
                effect: "generatorMultiplier",
                value: 3,
                icon: "⌨️",
                category: "code_monkey",
                targetGenerator: "code_monkey",
                unlockCondition: { type: "upgrade_owned", upgrade: "monkey_playground" }
            },
            {
                id: "monkey_evolution",
                name: "Evolutionary Algorithm",
                description: "Code Monkeys work 2x faster",
                cost: 1500000,
                effect: "generatorMultiplier",
                value: 2,
                icon: "🧬",
                category: "code_monkey",
                targetGenerator: "code_monkey",
                unlockCondition: { type: "upgrade_owned", upgrade: "monkey_typewriter" }
            },
            {
                id: "monkey_shakespeare",
                name: "Shakespeare Protocol",
                description: "Code Monkeys work 5x faster",
                cost: 5000000,
                effect: "generatorMultiplier",
                value: 5,
                icon: "🎭",
                category: "code_monkey",
                targetGenerator: "code_monkey",
                unlockCondition: { type: "upgrade_owned", upgrade: "monkey_evolution" }
            },
            // AI Assistant upgrades
            {
                id: "ai_optimization",
                name: "Code Optimization",
                description: "AI Assistants work 2x faster",
                cost: 120000,
                effect: "generatorMultiplier",
                value: 2,
                icon: "⚡",
                category: "ai_assistant",
                targetGenerator: "ai_assistant",
                unlockCondition: { type: "generator_owned", generator: "ai_assistant", count: 1 }
            },
            {
                id: "ai_learning",
                name: "Machine Learning",
                description: "AI Assistants work 50% faster",
                cost: 600000,
                effect: "generatorMultiplier",
                value: 1.5,
                icon: "🎯",
                category: "ai_assistant",
                targetGenerator: "ai_assistant",
                unlockCondition: { type: "generator_owned", generator: "ai_assistant", count: 5 }
            },
            // Quantum Computer upgrades
            {
                id: "quantum_entanglement",
                name: "Quantum Entanglement",
                description: "Quantum Computers work 2x faster",
                cost: 1300000,
                effect: "generatorMultiplier",
                value: 2,
                icon: "🌌",
                category: "quantum_computer",
                targetGenerator: "quantum_computer",
                unlockCondition: { type: "generator_owned", generator: "quantum_computer", count: 1 }
            },
            {
                id: "quantum_supremacy",
                name: "Quantum Supremacy",
                description: "Quantum Computers work 50% faster",
                cost: 6500000,
                effect: "generatorMultiplier",
                value: 1.5,
                icon: "👑",
                category: "quantum_computer",
                targetGenerator: "quantum_computer",
                unlockCondition: { type: "generator_owned", generator: "quantum_computer", count: 5 }
            }
        ];

        this.achievements = [
            { id: "first_click", name: "First Steps", description: "Make your first click", requirement: 1, type: "clicks" },
            { id: "hundred_clicks", name: "Clicking Master", description: "Click 100 times", requirement: 100, type: "clicks" },
            { id: "thousand_points", name: "Coder", description: "Earn 1,000 points", requirement: 1000, type: "points" },
            { id: "first_generator", name: "Automation Begins", description: "Buy your first generator", requirement: 1, type: "generators" },
            { id: "ten_generators", name: "Small Team", description: "Own 10 generators total", requirement: 10, type: "generators" },
            { id: "million_points", name: "Code Millionaire", description: "Earn 1,000,000 points", requirement: 1000000, type: "points" },
            { id: "hundred_per_second", name: "Efficient Coder", description: "Generate 100 points per second", requirement: 100, type: "cps" }
        ];

        // Cache for greetings to avoid API calls on every click
        this.greetingCache = [];
        this.lastGreetingFetch = 0;
        this.greetingCacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // Load game state from localStorage
    loadGameState() {
        const saved = localStorage.getItem('codeClickerSave');
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
        }
    }

    // Save game state to localStorage
    saveGameState() {
        localStorage.setItem('codeClickerSave', JSON.stringify(this.state));
    }

    // Initialize the game
    async initialize() {
        this.loadGameState();
        await this.loadGenerators();
        
        // Load greetings cache on startup
        await this.loadGreetings();
        
        this.calculatePointsPerSecond();
        this.updateDisplay();
        
        // Check if game hub should be revealed (for returning players)
        const hasGenerators = Object.values(this.state.generators).some(count => count > 0);
        const hasSignificantPoints = this.state.points >= 15;
        const hasEnoughClicks = this.state.totalClicks >= 15;
        
        console.log('Checking initial game hub reveal:', {
            hasGenerators,
            hasSignificantPoints, 
            hasEnoughClicks,
            totalClicks: this.state.totalClicks,
            points: this.state.points,
            gameHubRevealed: this.state.gameHubRevealed
        });
        
        if (this.state.gameHubRevealed || hasGenerators || hasSignificantPoints || hasEnoughClicks) {
            const gameHubSection = document.getElementById('gameHubSection');
            const cpsDisplay = document.getElementById('cpsDisplay');
            const clickHint = document.getElementById('clickHint');
            
            this.state.gameHubRevealed = true;
            clickHint.textContent = "Welcome back to your coding empire!";
            cpsDisplay.style.display = 'block';
            gameHubSection.style.display = 'block';
            gameHubSection.classList.add('revealed');
            this.saveGameState();
            console.log('Game hub revealed for returning player');
        } else {
            console.log('New player - game hub will be hidden until 15 clicks');
        }
        
        // Initialize progressive unlock system
        if (!this.state.upgradesTabUnlocked) {
            this.hideUpgradesTab();
        }
        this.checkProgressiveUnlocks();
        
        this.startGameLoop();
    }

    // Load generators from API
    async loadGenerators() {
        try {
            const response = await fetch('/api/generators');
            const data = await response.json();
            this.generatorData = data.generators;
            
            // Initialize generator counts if not loaded from save
            this.generatorData.forEach(gen => {
                if (!(gen.id in this.state.generators)) {
                    this.state.generators[gen.id] = 0;
                }
            });
            
            // Initialize upgrade states
            this.upgradeData.forEach(upgrade => {
                if (!(upgrade.id in this.state.upgrades)) {
                    this.state.upgrades[upgrade.id] = false;
                }
            });
            
            this.renderGenerators();
            this.renderUpgrades();
            
            // Initialize with generators tab active
            window.switchTab('generators');
        } catch (error) {
            console.error('Error loading generators:', error);
        }
    }

    // Progressive unlock system
    checkUnlockCondition(unlockCondition) {
        if (!unlockCondition) return true;
        
        switch (unlockCondition.type) {
            case "always":
                return true;
            case "generator_owned":
                const ownedCount = this.state.generators[unlockCondition.generator] || 0;
                return ownedCount >= (unlockCondition.count || 1);
            case "upgrade_owned":
                return this.state.upgrades[unlockCondition.upgrade] || false;
            case "points":
                return this.state.points >= unlockCondition.amount;
            case "total_points":
                return this.state.totalPointsEarned >= unlockCondition.amount;
            default:
                return false;
        }
    }

    getUnlockedGenerators() {
        return this.generatorData.filter(generator => 
            this.checkUnlockCondition(generator.unlockCondition)
        );
    }

    getUnlockedUpgrades() {
        return this.upgradeData.filter(upgrade => 
            this.checkUnlockCondition(upgrade.unlockCondition)
        );
    }

    checkProgressiveUnlocks() {
        // Check if upgrades tab should be unlocked
        const hasAnyGenerator = Object.values(this.state.generators).some(count => count > 0);
        if (hasAnyGenerator && !this.state.upgradesTabUnlocked) {
            this.state.upgradesTabUnlocked = true;
            this.showUpgradesTab();
        }

        // Re-render generators and upgrades to show newly unlocked items
        this.renderGenerators();
        this.renderUpgrades();
    }

    showUpgradesTab() {
        const upgradesTabButton = document.querySelector('.tab-button[onclick="switchTab(\'upgrades\')"]');
        if (upgradesTabButton) {
            upgradesTabButton.style.display = 'block';
            
            // Add visual feedback for unlock
            window.ui.createFloatingNumber('Upgrades Unlocked!', '#4facfe');
            console.log('Upgrades tab unlocked!');
        }
    }

    hideUpgradesTab() {
        const upgradesTabButton = document.querySelector('.tab-button[onclick="switchTab(\'upgrades\')"]');
        if (upgradesTabButton) {
            upgradesTabButton.style.display = 'none';
        }
    }

    // Calculate current cost of a generator (increases with each purchase)
    getGeneratorCost(generator) {
        const owned = this.state.generators[generator.id] || 0;
        return Math.floor(generator.baseCost * Math.pow(1.15, owned));
    }

    // Calculate total production per second
    calculatePointsPerSecond() {
        let total = 0;
        
        this.generatorData.forEach(gen => {
            const owned = this.state.generators[gen.id] || 0;
            const generatorMultiplier = this.getGeneratorMultiplier(gen.id);
            const generatorCPS = owned * gen.baseProduction * generatorMultiplier;
            total += generatorCPS;
            
            // Store individual generator CPS for display
            gen.currentCPS = generatorCPS;
        });
        
        // Store generator CPS separately from total displayed CPS
        this.state.generatorPointsPerSecond = total;
        
        // For display purposes, include clicking rate in total CPS shown to user
        const clickingCPS = this.state.clicksPerSecond * this.state.clickPower;
        this.state.pointsPerSecond = total + clickingCPS;
    }

    // Update clicking rate based on recent clicks
    updateClickingRate() {
        const now = Date.now();
        const timeWindow = 1000; // 1 second window
        
        // Remove clicks older than time window
        this.state.recentClicks = this.state.recentClicks.filter(clickTime => 
            now - clickTime < timeWindow
        );
        
        // Calculate clicks per second
        this.state.clicksPerSecond = this.state.recentClicks.length / (timeWindow / 1000);
        
        // Recalculate total CPS and update display immediately
        this.calculatePointsPerSecond();
        this.updateDisplay();
    }

    // Get current generator multiplier from upgrades (specific to each generator)
    getGeneratorMultiplier(generatorId) {
        let multiplier = 1;
        this.upgradeData.forEach(upgrade => {
            if (this.state.upgrades[upgrade.id] && 
                upgrade.effect === 'generatorMultiplier' && 
                upgrade.targetGenerator === generatorId) {
                multiplier *= upgrade.value;
            }
        });
        return multiplier;
    }

    // Get global generator multiplier for display purposes
    getGlobalGeneratorMultiplier() {
        let totalMultiplier = 0;
        let generatorCount = 0;
        
        this.generatorData.forEach(gen => {
            const multiplier = this.getGeneratorMultiplier(gen.id);
            totalMultiplier += multiplier;
            generatorCount++;
        });
        
        return generatorCount > 0 ? totalMultiplier / generatorCount : 1;
    }

    // Format large numbers
    formatNumber(num) {
        if (num < 1000) return Math.floor(num).toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
        return (num / 1000000000000).toFixed(1) + 'T';
    }

    // Update display
    updateDisplay() {
        this.calculatePointsPerSecond();
        
        document.getElementById('pointsDisplay').textContent = `Code Points: ${this.formatNumber(this.state.points)}`;
        document.getElementById('cpsDisplay').textContent = `Points per second: ${this.formatNumber(this.state.pointsPerSecond)}`;
        this.updateStatusDisplay();
        
        this.updateGeneratorDisplayValues();
    }

    // Update status display
    updateStatusDisplay() {
        document.getElementById('clickPowerDisplay').textContent = this.formatNumber(this.state.clickPower);
        document.getElementById('critChanceDisplay').textContent = this.state.critChance.toFixed(0) + '%';
        document.getElementById('clickRateDisplay').textContent = this.state.clicksPerSecond.toFixed(1) + '/s';
        document.getElementById('generatorMultiplierDisplay').textContent = this.getGlobalGeneratorMultiplier().toFixed(1) + 'x';
    }

    // Main game loop
    startGameLoop() {
        // Main game loop - runs every 100ms
        setInterval(() => {
            // Add points from generators ONLY (not from clicking rate)
            this.state.points += this.state.generatorPointsPerSecond / 10; // Update 10 times per second
            this.state.totalPointsEarned += this.state.generatorPointsPerSecond / 10;
            
            this.updateDisplay();
            
            // Auto-save every 10 seconds
            if (Math.random() < 0.01) {
                this.saveGameState();
            }
            
            // Only update generator affordability, don't re-render everything
            this.updateGeneratorAffordability();
            
            // Check achievements periodically
            if (Math.random() < 0.1) {
                this.checkAchievements();
            }
        }, 100);
        
        // Ultra-fast update loop for clicking rate - runs every 16ms (~60fps) for instant feedback
        setInterval(() => {
            this.updateClickingRate();
            this.updateStatusDisplay(); // Update just the status display for click rate
        }, 16);
        
        // Save every 30 seconds
        setInterval(() => this.saveGameState(), 30000);
    }

    // Buy a generator
    buyGenerator(generatorId) {
        const generator = this.generatorData.find(g => g.id === generatorId);
        const cost = this.getGeneratorCost(generator);
        
        if (this.state.points >= cost) {
            this.state.points -= cost;
            this.state.generators[generatorId] = (this.state.generators[generatorId] || 0) + 1;
            
            this.calculatePointsPerSecond();
            this.updateDisplay();
            
            // Check for progressive unlocks after purchase
            this.checkProgressiveUnlocks();
            
            this.saveGameState();
            
            // Add visual feedback
            window.ui.createFloatingNumber(`+${generator.name}!`, '#4facfe');
            
            this.checkAchievements();
            
            window.effects.createPurchaseEffect(generator.icon);
            
            if (cost > 10000) {
                window.effects.addScreenShake();
            }
        }
    }

    // Buy an upgrade
    buyUpgrade(upgradeId) {
        const upgrade = this.upgradeData.find(u => u.id === upgradeId);
        
        if (this.state.points >= upgrade.cost && !this.state.upgrades[upgradeId]) {
            this.state.points -= upgrade.cost;
            this.state.upgrades[upgradeId] = true;
            
            this.applyUpgradeEffects(upgradeId);
            
            this.calculatePointsPerSecond();
            this.updateDisplay();
            
            // Check for progressive unlocks after purchase
            this.checkProgressiveUnlocks();
            
            this.saveGameState();
            
            window.ui.createFloatingNumber(`+${upgrade.name}!`, '#ff6b6b');
            
            this.checkAchievements();
            
            window.effects.createPurchaseEffect(upgrade.icon);
            
            if (upgrade.cost > 50000) {
                window.effects.addScreenShake();
            }
        }
    }

    // Apply upgrade effects
    applyUpgradeEffects(upgradeId) {
        const upgrade = this.upgradeData.find(u => u.id === upgradeId);
        if (upgrade.effect === 'clickMultiplier') {
            this.state.clickPower *= upgrade.value;
        } else if (upgrade.effect === 'critChance') {
            this.state.critChance += upgrade.value;
        } else if (upgrade.effect === 'critMultiplier') {
            this.state.critMultiplier = upgrade.value;
        }
        
        this.calculatePointsPerSecond();
    }

    // Handle click
    async handleClick() {
        try {
            // Track click timing
            const now = Date.now();
            this.state.recentClicks.push(now);
            this.state.lastClickTime = now;
            
            // Calculate click damage with crit chance
            let clickDamage = this.state.clickPower;
            let isCrit = false;
            
            if (this.state.critChance > 0 && Math.random() * 100 < this.state.critChance) {
                clickDamage *= this.state.critMultiplier;
                isCrit = true;
            }
            
            // Add points for clicking
            this.state.points += clickDamage;
            this.state.totalClicks++;
            this.state.totalPointsEarned += clickDamage;
            
            // Show floating number with crit styling
            if (isCrit) {
                window.ui.createFloatingNumber(`CRIT! +${clickDamage}`, '#ff6b6b');
            } else {
                window.ui.createFloatingNumber(`+${clickDamage}`, '#00f2fe');
            }
            
            // Update greeting from cache (no API call needed)
            document.getElementById('greetingText').textContent = this.getRandomGreeting();
            
            // Refresh greetings cache periodically (every 5 minutes)
            if (Math.random() < 0.001) { // Very low chance per click
                this.refreshGreetingsIfNeeded();
            }
            
            this.updateClickingRate();
            this.updateDisplay();
            this.updateGeneratorAffordability();
            this.checkAchievements();
            this.checkGameHubReveal();
            
            window.effects.createClickParticles();
            
            // Milestone celebrations
            if (this.state.totalPointsEarned % 1000 === 0 && this.state.totalPointsEarned > 0) {
                window.effects.showMilestone(`${this.formatNumber(this.state.totalPointsEarned)} Points!`);
            }
        } catch (error) {
            console.error('Error in handleClick:', error);
        }
    }

    // Load greetings from API and cache them
    async loadGreetings() {
        try {
            const response = await fetch('/api/greeting');
            const data = await response.json();
            
            // If we get a single greeting, create a variety
            if (data.greeting) {
                this.greetingCache = [
                    data.greeting,
                    "Code your way to success! 🚀",
                    "Building the digital future! 💻", 
                    "Every click brings more power! ⚡",
                    "The code flows through you! ✨",
                    "Generating infinite possibilities! 🌟",
                    "Debug the world! 🐛",
                    "Compile your dreams! ⚙️",
                    "Stack overflow of success! 📚",
                    "Git commit to greatness! 🔧"
                ];
            }
            this.lastGreetingFetch = Date.now();
        } catch (error) {
            console.error('Error loading greetings:', error);
            // Fallback greetings if API fails
            this.greetingCache = [
                "Code your way to success! 🚀",
                "Building the digital future! 💻",
                "Every click brings more power! ⚡",
                "The code flows through you! ✨",
                "Generating infinite possibilities! 🌟"
            ];
        }
    }

    // Get a random greeting from cache
    getRandomGreeting() {
        if (this.greetingCache.length === 0) {
            return "Keep coding! 💻";
        }
        return this.greetingCache[Math.floor(Math.random() * this.greetingCache.length)];
    }

    // Check if we need to refresh greetings cache
    async refreshGreetingsIfNeeded() {
        const now = Date.now();
        if (now - this.lastGreetingFetch > this.greetingCacheExpiry) {
            await this.loadGreetings();
        }
    }

    // Check if game hub should be revealed
    checkGameHubReveal() {
        if (this.state.gameHubRevealed) return; // Only process once
        const hasGenerators = Object.values(this.state.generators).some(count => count > 0);
        const hasSignificantPoints = this.state.points >= 16; // 16+ points
        const hasEnoughClicks = this.state.totalClicks >= 15; // 15+ clicks
        const hasEarnedPoints = this.state.totalPointsEarned >= 16; // Has earned 16+ points total

        // Only log once if revealing
        if (hasEnoughClicks || hasSignificantPoints || hasGenerators || hasEarnedPoints) {
            this.state.gameHubRevealed = true;
            window.ui.revealGameHub();
            this.saveGameState();
            console.log('Game hub revealed! Criteria met:', {
                hasEnoughClicks,
                hasSignificantPoints, 
                hasGenerators,
                hasEarnedPoints
            });
        }
    }

    // Achievement system
    checkAchievements() {
        const totalGenerators = Object.values(this.state.generators).reduce((sum, count) => sum + count, 0);
        
        this.achievements.forEach(achievement => {
            if (!this.state.achievements.includes(achievement.id)) {
                let earned = false;
                
                switch (achievement.type) {
                    case 'clicks':
                        earned = this.state.totalClicks >= achievement.requirement;
                        break;
                    case 'points':
                        earned = this.state.totalPointsEarned >= achievement.requirement;
                        break;
                    case 'generators':
                        earned = totalGenerators >= achievement.requirement;
                        break;
                    case 'cps':
                        earned = this.state.generatorPointsPerSecond >= achievement.requirement;
                        break;
                }
                
                if (earned) {
                    this.state.achievements.push(achievement.id);
                    window.ui.showAchievement(achievement);
                    this.saveGameState();
                }
            }
        });
    }

    // Update generator display values efficiently without rebuilding DOM
    updateGeneratorDisplayValues() {
        this.generatorData.forEach(generator => {
            const card = document.querySelector(`[data-generator-id="${generator.id}"]`);
            if (card) {
                const owned = this.state.generators[generator.id] || 0;
                const cost = this.getGeneratorCost(generator);
                const affordable = this.state.points >= cost;
                const generatorMultiplier = this.getGeneratorMultiplier(generator.id);
                const effectiveProduction = generator.baseProduction * generatorMultiplier;
                const currentCPS = generator.currentCPS || 0;
                const percentageOfTotal = this.state.generatorPointsPerSecond > 0 ? 
                    (currentCPS / this.state.generatorPointsPerSecond * 100) : 0;
                
                // Update affordability styling
                card.className = `skill-card ${affordable ? 'affordable' : 'locked'}`;
                
                // Update the displayed values
                const ownedElement = card.querySelector('.skill-owned');
                const costElement = card.querySelector('.skill-cost');
                const producingElement = card.querySelector('.producing-line');
                
                if (ownedElement) ownedElement.textContent = `Owned: ${owned}`;
                if (costElement) costElement.textContent = `${this.formatNumber(cost)} pts`;
                if (producingElement) {
                    if (owned > 0) {
                        producingElement.innerHTML = `<strong>Producing: ${this.formatNumber(currentCPS)}/s (${percentageOfTotal.toFixed(1)}% of total)</strong>`;
                        producingElement.style.display = 'block';
                    } else {
                        producingElement.style.display = 'none';
                    }
                }
            }
        });
    }

    // Update only the affordability styling without re-rendering
    updateGeneratorAffordability() {
        // Update generator cards
        const generatorCards = document.querySelectorAll('#skillsGrid .skill-card');
        generatorCards.forEach((card, index) => {
            if (this.generatorData[index]) {
                const generator = this.generatorData[index];
                const cost = this.getGeneratorCost(generator);
                const affordable = this.state.points >= cost;
                
                // Update cost display
                const costElement = card.querySelector('.skill-cost');
                if (costElement) {
                    costElement.textContent = `${this.formatNumber(cost)} pts`;
                }
                
                // Update affordability class
                if (affordable && !card.classList.contains('affordable')) {
                    card.classList.add('affordable');
                    card.classList.remove('locked');
                } else if (!affordable && !card.classList.contains('locked')) {
                    card.classList.remove('affordable');
                    card.classList.add('locked');
                }
            }
        });
        
        // Update upgrade cards
        const upgradeCards = document.querySelectorAll('#upgradesGrid .skill-card');
        upgradeCards.forEach((card) => {
            const upgradeId = card.getAttribute('data-upgrade-id');
            
            if (upgradeId) {
                const upgrade = this.upgradeData.find(u => u.id === upgradeId);
                
                if (upgrade) {
                    const affordable = this.state.points >= upgrade.cost;
                    
                    // Update affordability class
                    if (affordable && !card.classList.contains('affordable')) {
                        card.classList.add('affordable');
                        card.classList.remove('locked');
                    } else if (!affordable && !card.classList.contains('locked')) {
                        card.classList.remove('affordable');
                        card.classList.add('locked');
                    }
                }
            }
        });
    }

    // Render generator cards
    renderGenerators() {
        const skillsGrid = document.getElementById('skillsGrid');
        skillsGrid.innerHTML = '';
        
        // Only show unlocked generators
        const unlockedGenerators = this.getUnlockedGenerators();
        
        unlockedGenerators.forEach((generator, index) => {
            const owned = this.state.generators[generator.id] || 0;
            const cost = this.getGeneratorCost(generator);
            const affordable = this.state.points >= cost;
            const generatorMultiplier = this.getGeneratorMultiplier(generator.id);
            const effectiveProduction = generator.baseProduction * generatorMultiplier;
            const currentCPS = generator.currentCPS || 0;
            const percentageOfTotal = this.state.generatorPointsPerSecond > 0 ? 
                (currentCPS / this.state.generatorPointsPerSecond * 100) : 0;
            
            const generatorCard = document.createElement('div');
            generatorCard.className = `skill-card ${affordable ? 'affordable' : 'locked'}`;
            generatorCard.setAttribute('data-generator-id', generator.id);
            
            generatorCard.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.buyGenerator(generator.id);
            });
            
            generatorCard.innerHTML = `
                <div class="skill-icon">${generator.icon}</div>
                <div class="skill-name">${generator.name}</div>
                <div class="skill-description">${generator.description}</div>
                <div class="skill-stats">
                    <span class="skill-owned">Owned: ${owned}</span>
                    <span class="skill-cost">${this.formatNumber(cost)} pts</span>
                </div>
                <div class="skill-production">
                    Each: ${this.formatNumber(effectiveProduction)} points/sec
                    ${generatorMultiplier > 1 ? `(${this.formatNumber(generator.baseProduction)} base × ${generatorMultiplier.toFixed(1)})` : ''}
                </div>
                <div class="producing-line" style="display: ${owned > 0 ? 'block' : 'none'};">
                    <strong>Producing: ${this.formatNumber(currentCPS)}/s (${percentageOfTotal.toFixed(1)}% of total)</strong>
                </div>
            `;
            
            skillsGrid.appendChild(generatorCard);
        });
    }

        // Render upgrades
    renderUpgrades() {
        const upgradesContainer = document.getElementById('upgradesGrid');
        upgradesContainer.innerHTML = '';
        
        // Only show unlocked upgrades that haven't been purchased
        const unlockedUpgrades = this.getUnlockedUpgrades().filter(upgrade => 
            !this.state.upgrades[upgrade.id]
        );
        
        // Group upgrades by category
        const categories = ['click', 'junior_dev', 'senior_dev', 'code_monkey', 'ai_assistant', 'quantum_computer'];
        
        categories.forEach(category => {
            const categoryUpgrades = unlockedUpgrades.filter(upgrade => 
                upgrade.category === category
            );
            
            if (categoryUpgrades.length > 0) {
                // Add category header
                const categoryHeader = document.createElement('div');
                categoryHeader.style.gridColumn = '1 / -1';
                categoryHeader.style.textAlign = 'center';
                categoryHeader.style.padding = '1rem 0';
                categoryHeader.style.fontSize = '1.2rem';
                categoryHeader.style.fontWeight = 'bold';
                categoryHeader.style.color = '#4facfe';
                categoryHeader.style.borderBottom = '1px solid rgba(79, 172, 254, 0.3)';
                categoryHeader.style.marginBottom = '1rem';
                
                const categoryNames = {
                    'click': '🖱️ Click Upgrades',
                    'junior_dev': '👨‍💻 Junior Developer Upgrades',
                    'senior_dev': '👨‍💼 Senior Developer Upgrades',
                    'code_monkey': '🐵 Code Monkey Upgrades',
                    'ai_assistant': '🤖 AI Assistant Upgrades',
                    'quantum_computer': '⚛️ Quantum Computer Upgrades'
                };
                categoryHeader.textContent = categoryNames[category];
                upgradesContainer.appendChild(categoryHeader);
                
                // Add upgrades for this category
                categoryUpgrades.forEach(upgrade => {
                    const affordable = this.state.points >= upgrade.cost;
                    const upgradeCard = document.createElement('div');
                    upgradeCard.className = `skill-card ${affordable ? 'affordable' : 'locked'}`;
                    upgradeCard.setAttribute('data-upgrade-id', upgrade.id);
                    
                    upgradeCard.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        this.buyUpgrade(upgrade.id);
                    });
                    
                    upgradeCard.innerHTML = `
                        <div class="skill-icon">${upgrade.icon}</div>
                        <div class="skill-name">${upgrade.name}</div>
                        <div class="skill-description">${upgrade.description}</div>
                        <div class="skill-stats">
                            <span class="skill-cost">${this.formatNumber(upgrade.cost)} pts</span>
                        </div>
                    `;
                    
                    upgradesContainer.appendChild(upgradeCard);
                });
            }
        });
    }
}

// Export the Game class for use
window.Game = Game;
