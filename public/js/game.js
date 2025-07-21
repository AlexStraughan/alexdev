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
            infiniteUpgrades: {}, // Track levels of infinite upgrades
            clicksPerSecond: 0,
            lastClickTime: Date.now(),
            recentClicks: [],
            gameHubRevealed: false,
            // Progressive unlock system
            upgradesTabUnlocked: false,
            // Offline earnings tracking
            lastActiveTime: Date.now(),
            offlineEarningsRate: 0.4 // 40% efficiency while away
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
            },
            // Additional Click Upgrades
            {
                id: "crit_chance_3",
                name: "Lightning Reflexes",
                description: "Additional 15% crit chance",
                cost: 25000,
                effect: "critChance",
                value: 15,
                icon: "⚡",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "crit_multiplier_1" }
            },
            {
                id: "crit_multiplier_2",
                name: "Devastating Strike",
                description: "Critical clicks now do 4x damage",
                cost: 100000,
                effect: "critMultiplier",
                value: 4,
                icon: "💀",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "crit_chance_3" }
            },
            {
                id: "ultra_click",
                name: "Gaming Throne",
                description: "10x clicking power for the elite!",
                cost: 500000,
                effect: "clickMultiplier",
                value: 10,
                icon: "👑",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "super_click" }
            },
            {
                id: "crit_chance_4",
                name: "Perfect Precision",
                description: "Additional 20% crit chance",
                cost: 1000000,
                effect: "critChance",
                value: 20,
                icon: "🎯",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "crit_multiplier_2" }
            },
            {
                id: "crit_multiplier_3",
                name: "Obliteration",
                description: "Critical clicks now do 5x damage",
                cost: 5000000,
                effect: "critMultiplier",
                value: 5,
                icon: "💥",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "crit_chance_4" }
            },
            {
                id: "godlike_click",
                name: "Divine Input Device",
                description: "25x clicking power - transcend mortality!",
                cost: 25000000,
                effect: "clickMultiplier",
                value: 25,
                icon: "✨",
                category: "click",
                unlockCondition: { type: "upgrade_owned", upgrade: "ultra_click" }
            },
            // Infinite Upgrades for Generators (appear after all regular upgrades are bought)
            {
                id: "junior_infinite",
                name: "Junior Dev Motivation",
                description: "+5% production per level",
                baseCost: 100000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "junior_dev",
                targetGenerator: "junior_dev",
                isInfinite: true,
                unlockCondition: { type: "upgrade_owned", upgrade: "junior_ai_assist" }
            },
            {
                id: "senior_infinite",
                name: "Senior Dev Excellence",
                description: "+5% production per level",
                baseCost: 1000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "senior_dev",
                targetGenerator: "senior_dev",
                isInfinite: true,
                unlockCondition: { type: "upgrade_owned", upgrade: "senior_innovation" }
            },
            {
                id: "monkey_infinite",
                name: "Code Monkey Evolution",
                description: "+5% production per level",
                baseCost: 10000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "code_monkey",
                targetGenerator: "code_monkey",
                isInfinite: true,
                unlockCondition: { type: "upgrade_owned", upgrade: "monkey_shakespeare" }
            },
            {
                id: "ai_infinite",
                name: "AI Assistant Learning",
                description: "+5% production per level",
                baseCost: 50000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "ai_assistant",
                targetGenerator: "ai_assistant",
                isInfinite: true,
                unlockCondition: { type: "upgrade_owned", upgrade: "ai_learning" }
            },
            {
                id: "quantum_infinite",
                name: "Quantum Optimization",
                description: "+5% production per level",
                baseCost: 100000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "quantum_computer",
                targetGenerator: "quantum_computer",
                isInfinite: true,
                unlockCondition: { type: "upgrade_owned", upgrade: "quantum_supremacy" }
            },
            {
                id: "coding_farm_infinite",
                name: "Farm Optimization",
                description: "+5% production per level",
                baseCost: 500000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "coding_farm",
                targetGenerator: "coding_farm",
                isInfinite: true,
                unlockCondition: { type: "generator_owned", generator: "coding_farm", count: 1 }
            },
            {
                id: "neural_network_infinite",
                name: "Neural Enhancement",
                description: "+5% production per level",
                baseCost: 2000000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "neural_network",
                targetGenerator: "neural_network",
                isInfinite: true,
                unlockCondition: { type: "generator_owned", generator: "neural_network", count: 1 }
            },
            {
                id: "blockchain_miner_infinite",
                name: "Mining Efficiency",
                description: "+5% production per level",
                baseCost: 10000000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "blockchain_miner",
                targetGenerator: "blockchain_miner",
                isInfinite: true,
                unlockCondition: { type: "generator_owned", generator: "blockchain_miner", count: 1 }
            },
            {
                id: "digital_hivemind_infinite",
                name: "Hivemind Synergy",
                description: "+5% production per level",
                baseCost: 50000000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "digital_hivemind",
                targetGenerator: "digital_hivemind",
                isInfinite: true,
                unlockCondition: { type: "generator_owned", generator: "digital_hivemind", count: 1 }
            },
            {
                id: "time_machine_infinite",
                name: "Temporal Optimization",
                description: "+5% production per level",
                baseCost: 250000000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "time_machine",
                targetGenerator: "time_machine",
                isInfinite: true,
                unlockCondition: { type: "generator_owned", generator: "time_machine", count: 1 }
            },
            {
                id: "multiverse_compiler_infinite",
                name: "Multiverse Optimization",
                description: "+5% production per level",
                baseCost: 2500000000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "multiverse_compiler",
                targetGenerator: "multiverse_compiler",
                isInfinite: true,
                unlockCondition: { type: "generator_owned", generator: "multiverse_compiler", count: 1 }
            },
            {
                id: "god_algorithm_infinite",
                name: "Divine Optimization",
                description: "+5% production per level",
                baseCost: 40000000000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "god_algorithm",
                targetGenerator: "god_algorithm",
                isInfinite: true,
                unlockCondition: { type: "generator_owned", generator: "god_algorithm", count: 1 }
            },
            {
                id: "code_singularity_infinite",
                name: "Singularity Optimization",
                description: "+5% production per level",
                baseCost: 880000000000000,
                effect: "infiniteGeneratorMultiplier",
                value: 0.05,
                icon: "🔄",
                category: "code_singularity",
                targetGenerator: "code_singularity",
                isInfinite: true,
                unlockCondition: { type: "generator_owned", generator: "code_singularity", count: 1 }
            },
            // Infinite Click Upgrades
            {
                id: "click_infinite",
                name: "Click Mastery",
                description: "+10% click power per level",
                baseCost: 10000000,
                effect: "infiniteClickMultiplier",
                value: 0.1,
                icon: "🔄",
                category: "click",
                isInfinite: true,
                unlockCondition: { type: "upgrade_owned", upgrade: "godlike_click" }
            },
            {
                id: "crit_infinite",
                name: "Critical Mastery",
                description: "+1% crit chance per level",
                baseCost: 50000000,
                effect: "infiniteCritChance",
                value: 1,
                icon: "🔄",
                category: "click",
                isInfinite: true,
                unlockCondition: { type: "upgrade_owned", upgrade: "crit_multiplier_3" }
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
        
        // Set up game reset event listener
        this.setupGameResetListener();
    }

    setupGameResetListener() {
        // Listen for game reset messages from server
        if (window.wsClient) {
            window.wsClient.on('game_reset', (message) => {
                console.log('💥 Game reset received, resetting all game state');
                this.resetGameState();
            });
        } else {
            // If WebSocket client isn't ready yet, set up listener when it connects
            document.addEventListener('websocketReady', () => {
                window.wsClient.on('game_reset', (message) => {
                    console.log('💥 Game reset received, resetting all game state');
                    this.resetGameState();
                });
            });
        }
    }

    resetGameState() {
        // Reset all game state to initial values
        this.state = {
            points: 0,
            pointsPerSecond: 0,
            generatorPointsPerSecond: 0,
            generators: {},
            clickPower: 1,
            critChance: 0,
            critMultiplier: 2,
            totalClicks: 0,
            totalPointsEarned: 0,
            achievements: [],
            upgrades: {},
            clicksPerSecond: 0,
            lastClickTime: Date.now(),
            recentClicks: [],
            gameHubRevealed: false,
            upgradesTabUnlocked: false
        };
        
        // Clear player registration status
        this.isRegistered = false;
        this.playerName = null;
        this.playerId = null;
        
        // Update UI immediately
        this.updateUI();
        
        console.log('🔄 Game state has been reset to defaults');
    }

    // Load game state from server via WebSocket
    async loadGameState() {
        try {
            // Check if we have a stored player ID
            let storedPlayerId = localStorage.getItem('playerId');
            let storedPlayerName = localStorage.getItem('playerName');
            
            console.log('🔍 Stored player ID:', storedPlayerId);
            console.log('🔍 Stored player name:', storedPlayerName);
            
            if (storedPlayerId) {
                // Use existing player ID
                this.playerId = storedPlayerId;
                console.log('✅ Using existing player ID:', this.playerId);
            } else {
                // Generate a new player ID only if we don't have one
                this.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('playerId', this.playerId);
                console.log('🆕 Generated new player ID:', this.playerId);
            }
            
            // Load stored player name if available
            if (storedPlayerName) {
                this.playerName = storedPlayerName;
                this.isRegistered = true;
                console.log('✅ Using stored player name:', this.playerName);
                console.log('✅ Player is registered:', this.isRegistered);
            } else {
                this.isRegistered = false;
                console.log('❌ No stored player name found');
            }

            // Wait for WebSocket connection and then load game state
            return new Promise((resolve) => {
                let resolved = false;
                const loadGameState = () => {
                    window.wsClient.on('game_state_loaded', (message) => {
                        if (resolved) return;
                        resolved = true;
                        
                        const data = message.state;
                        
                        // Only merge if this is actually existing data, not default
                        if (data.points > 0 || data.total_clicks > 0 || Object.keys(data.generators || {}).length > 0) {
                            this.state = { ...this.state, ...data };
                            console.log('Game state loaded from server:', this.state);
                        } else {
                            console.log('Using default state for new player (server returned empty state)');
                        }
                        
                        // Validate and sanitize loaded state to prevent NaN corruption
                        this.validateGameState();
                        
                        // If we have a stored player name, register with WebSocket server
                        if (this.isRegistered && this.playerName) {
                            window.wsClient.registerPlayer(this.playerName);
                            console.log('Re-registered player with server:', this.playerName);
                        }
                        
                        resolve();
                    });
                    
                    // Request game state via WebSocket
                    window.wsClient.loadGameState(this.playerId);
                    
                    // Add timeout to prevent hanging
                    setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            console.log('⏰ Game state load timeout, using default state');
                            resolve();
                        }
                    }, 1000); // 1 second timeout for faster startup
                };

                // Check if WebSocket is already connected
                if (window.wsClient && window.wsClient.isConnected) {
                    loadGameState();
                } else {
                    // Wait for WebSocket connection
                    const checkConnection = () => {
                        if (window.wsClient && window.wsClient.isConnected) {
                            loadGameState();
                        } else {
                            setTimeout(checkConnection, 100);
                        }
                    };
                    checkConnection();
                    
                    // Add timeout for connection wait
                    setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            console.log('⏰ WebSocket connection timeout, using default state');
                            resolve();
                        }
                    }, 2000); // 2 second timeout for faster startup
                }
            });
        } catch (error) {
            console.error('Error loading game state:', error);
            // Fall back to default state
        }
    }

    // Validate and sanitize game state to prevent NaN corruption
    validateGameState() {
        // Sanitize numeric values
        this.state.points = isFinite(this.state.points) && !isNaN(this.state.points) ? Math.max(0, this.state.points) : 0;
        this.state.pointsPerSecond = isFinite(this.state.pointsPerSecond) && !isNaN(this.state.pointsPerSecond) ? Math.max(0, this.state.pointsPerSecond) : 0;
        this.state.generatorPointsPerSecond = isFinite(this.state.generatorPointsPerSecond) && !isNaN(this.state.generatorPointsPerSecond) ? Math.max(0, this.state.generatorPointsPerSecond) : 0;
        this.state.clickPower = isFinite(this.state.clickPower) && !isNaN(this.state.clickPower) ? Math.max(1, this.state.clickPower) : 1;
        this.state.critChance = isFinite(this.state.critChance) && !isNaN(this.state.critChance) ? Math.max(0, Math.min(100, this.state.critChance)) : 0;
        this.state.critMultiplier = isFinite(this.state.critMultiplier) && !isNaN(this.state.critMultiplier) ? Math.max(1, this.state.critMultiplier) : 2;
        this.state.totalClicks = isFinite(this.state.totalClicks) && !isNaN(this.state.totalClicks) ? Math.max(0, this.state.totalClicks) : 0;
        this.state.totalPointsEarned = isFinite(this.state.totalPointsEarned) && !isNaN(this.state.totalPointsEarned) ? Math.max(0, this.state.totalPointsEarned) : 0;
        this.state.clicksPerSecond = isFinite(this.state.clicksPerSecond) && !isNaN(this.state.clicksPerSecond) ? Math.max(0, this.state.clicksPerSecond) : 0;
        this.state.lastActiveTime = isFinite(this.state.lastActiveTime) && !isNaN(this.state.lastActiveTime) ? this.state.lastActiveTime : Date.now();
        this.state.offlineEarningsRate = isFinite(this.state.offlineEarningsRate) && !isNaN(this.state.offlineEarningsRate) ? Math.max(0, Math.min(1, this.state.offlineEarningsRate)) : 0.4;
        
        // Sanitize objects
        this.state.generators = this.state.generators && typeof this.state.generators === 'object' ? this.state.generators : {};
        this.state.upgrades = this.state.upgrades && typeof this.state.upgrades === 'object' ? this.state.upgrades : {};
        this.state.infiniteUpgrades = this.state.infiniteUpgrades && typeof this.state.infiniteUpgrades === 'object' ? this.state.infiniteUpgrades : {};
        this.state.achievements = Array.isArray(this.state.achievements) ? this.state.achievements : [];
        this.state.recentClicks = Array.isArray(this.state.recentClicks) ? this.state.recentClicks : [];
        
        // Sanitize generator counts
        Object.keys(this.state.generators).forEach(genId => {
            const count = this.state.generators[genId];
            if (!isFinite(count) || isNaN(count) || count < 0) {
                this.state.generators[genId] = 0;
            }
        });
        
        // Sanitize infinite upgrade levels
        Object.keys(this.state.infiniteUpgrades).forEach(upgradeId => {
            const level = this.state.infiniteUpgrades[upgradeId];
            if (!isFinite(level) || isNaN(level) || level < 0) {
                this.state.infiniteUpgrades[upgradeId] = 0;
            }
        });
        
        console.log('🔍 Game state validated and sanitized');
    }

    // Save game state to server via WebSocket (only if user has generators or is registered)
    async saveGameState() {
        try {
            if (!this.playerId) return;
            
            // Only save if user has at least one generator OR is registered
            const hasGenerators = Object.values(this.state.generators).some(count => count > 0);
            if (!hasGenerators && !this.isRegistered) {
                console.log('Not saving - no generators and not registered');
                return;
            }
            
            const stateToSave = {
                ...this.state,
                player_name: this.isRegistered ? this.playerName : null,
                // Convert camelCase to snake_case for server compatibility
                total_points_earned: this.state.totalPointsEarned,
                total_clicks: this.state.totalClicks,
                click_power: this.state.clickPower,
                crit_chance: this.state.critChance,
                crit_multiplier: this.state.critMultiplier,
                game_hub_revealed: this.state.gameHubRevealed,
                upgrades_tab_unlocked: this.state.upgradesTabUnlocked,
                last_active_time: this.state.lastActiveTime,
                offline_earnings_rate: this.state.offlineEarningsRate
            };
            
            // Check if WebSocket client is available and connected
            if (window.wsClient && window.wsClient.isConnected) {
                window.wsClient.saveGameState(this.playerId, stateToSave);
                console.log('Game state save requested via WebSocket');
            } else {
                console.log('WebSocket not available for game state save - will retry when connected');
                // Queue the save for when WebSocket becomes available
                if (window.wsClient) {
                    window.wsClient.on('connected', () => {
                        console.log('WebSocket connected, saving queued game state');
                        window.wsClient.saveGameState(this.playerId, stateToSave);
                    });
                }
            }
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    // Register user when they submit to leaderboard
    async registerUser(playerName) {
        console.log('🔐 Registering user:', playerName);
        this.isRegistered = true;
        this.playerName = playerName;
        
        // Save player name to localStorage
        localStorage.setItem('playerName', playerName);
        console.log('💾 Saved player name to localStorage:', playerName);
        
        // Register via WebSocket
        if (window.wsClient && window.wsClient.isConnected) {
            window.wsClient.registerPlayer(playerName);
        } else {
            console.log('WebSocket not ready for player registration - will register when connected');
            // Queue registration for when WebSocket becomes available
            if (window.wsClient) {
                window.wsClient.on('connected', () => {
                    console.log('WebSocket connected, registering queued player');
                    window.wsClient.registerPlayer(playerName);
                });
            }
        }
        
        // Enable player tracking
        if (window.playerTracker) {
            window.playerTracker.enableTracking(playerName);
            console.log('👥 Player tracking enabled for:', playerName);
        }
        
        // Save the registered state
        await this.saveGameState();
        
        console.log('✅ User registered:', playerName);
    }

    // Initialize the game
    async initialize() {
        await this.loadGameState();
        await this.loadGenerators();
        
        // Load greetings cache in background (non-blocking)
        setTimeout(() => this.loadGreetings(), 500);
        
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
            await this.saveGameState();
            console.log('Game hub revealed for returning player');
        } else {
            console.log('New player - game hub will be hidden until 15 clicks');
        }
        
        // Initialize progressive unlock system
        if (!this.state.upgradesTabUnlocked) {
            this.hideUpgradesTab();
        }
        this.checkProgressiveUnlocks();
        
        // Enable player tracking if user is registered
        if (this.isRegistered && this.playerName && window.playerTracker) {
            window.playerTracker.enableTracking(this.playerName);
            console.log('👥 Player tracking enabled during initialization for:', this.playerName);
        }
        
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
            const owned = Math.max(0, this.state.generators[gen.id] || 0);
            let generatorMultiplier = this.getGeneratorMultiplier(gen.id);
            const baseProduction = parseFloat(gen.baseProduction) || 0;
            
            // Validate multiplier
            if (!isFinite(generatorMultiplier) || isNaN(generatorMultiplier) || generatorMultiplier <= 0) {
                console.warn(`Invalid generator multiplier for ${gen.id}, using 1`);
                generatorMultiplier = 1;
            }
            
            const generatorCPS = owned * baseProduction * generatorMultiplier;
            
            // Validate the calculated CPS
            if (isFinite(generatorCPS) && !isNaN(generatorCPS) && generatorCPS >= 0) {
                total += generatorCPS;
                gen.currentCPS = generatorCPS;
            } else {
                console.warn(`Invalid CPS calculated for ${gen.id}, setting to 0`);
                gen.currentCPS = 0;
            }
        });
        
        // Validate and store generator CPS
        this.state.generatorPointsPerSecond = isFinite(total) && !isNaN(total) ? Math.max(0, total) : 0;
        
        // For display purposes, include clicking rate in total CPS shown to user
        const clickPower = isFinite(this.state.clickPower) && !isNaN(this.state.clickPower) ? this.state.clickPower : 1;
        const clicksPerSecond = isFinite(this.state.clicksPerSecond) && !isNaN(this.state.clicksPerSecond) ? this.state.clicksPerSecond : 0;
        const clickingCPS = clicksPerSecond * clickPower;
        
        this.state.pointsPerSecond = this.state.generatorPointsPerSecond + (isFinite(clickingCPS) && !isNaN(clickingCPS) ? clickingCPS : 0);
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
        
        // Regular upgrades
        this.upgradeData.forEach(upgrade => {
            if (this.state.upgrades[upgrade.id] && 
                upgrade.effect === 'generatorMultiplier' && 
                upgrade.targetGenerator === generatorId) {
                multiplier *= upgrade.value;
            }
        });
        
        // Infinite upgrades
        multiplier *= this.getInfiniteGeneratorMultiplier(generatorId);
        
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
        // Get effective click power including infinite upgrades
        const infiniteMultipliers = this.getInfiniteClickMultipliers();
        const effectiveClickPower = this.state.clickPower * infiniteMultipliers.clickMultiplier;
        const effectiveCritChance = Math.min(100, this.state.critChance + infiniteMultipliers.critChanceBonus);
        
        document.getElementById('clickPowerDisplay').textContent = this.formatNumber(effectiveClickPower);
        document.getElementById('critChanceDisplay').textContent = effectiveCritChance.toFixed(0) + '%';
        document.getElementById('clickRateDisplay').textContent = this.state.clicksPerSecond.toFixed(1) + '/s';
        document.getElementById('generatorMultiplierDisplay').textContent = this.getGlobalGeneratorMultiplier().toFixed(1) + 'x';
    }

    // Main game loop
    startGameLoop() {
        // Main game loop - runs every 100ms
        setInterval(() => {
            // Validate generator points per second before using it
            const generatorProduction = isFinite(this.state.generatorPointsPerSecond) && !isNaN(this.state.generatorPointsPerSecond) ? 
                this.state.generatorPointsPerSecond : 0;
            
            // Add points from generators ONLY (not from clicking rate)
            const pointsToAdd = generatorProduction / 10; // Update 10 times per second
            
            if (isFinite(pointsToAdd) && !isNaN(pointsToAdd) && pointsToAdd > 0) {
                // Validate current points before adding
                if (!isFinite(this.state.points) || isNaN(this.state.points)) {
                    console.warn('Points corrupted in game loop, resetting to 0');
                    this.state.points = 0;
                }
                if (!isFinite(this.state.totalPointsEarned) || isNaN(this.state.totalPointsEarned)) {
                    console.warn('Total points earned corrupted in game loop, resetting to 0');
                    this.state.totalPointsEarned = 0;
                }
                
                this.state.points += pointsToAdd;
                this.state.totalPointsEarned += pointsToAdd;
            }
            
            this.updateDisplay();
            
            // Auto-save every 60 seconds (less frequent since it's network-based)
            if (Math.random() < 0.002) {
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
        
        // Save every 60 seconds (less frequent since it's network-based)
        setInterval(() => this.saveGameState(), 60000);
        
        // Set up offline earnings tracking
        this.setupOfflineEarnings();
    }
    
    // Offline earnings system
    setupOfflineEarnings() {
        // Track when user leaves the tab/window
        const updateLastActiveTime = () => {
            this.state.lastActiveTime = Date.now();
            // Only save if WebSocket is available to avoid errors
            if (window.wsClient && window.wsClient.isConnected) {
                this.saveGameState();
                console.log('📴 User inactive - saved last active time');
            } else {
                console.log('📴 User inactive - time recorded but no WebSocket to save');
            }
        };
        
        // Track when user returns to the tab/window
        let offlineCheckPending = false;
        const checkOfflineEarningsOnReturn = () => {
            if (offlineCheckPending) {
                console.log('👁️ Offline earnings check already pending, skipping');
                return;
            }
            
            offlineCheckPending = true;
            console.log('👁️ User active - checking for offline earnings');
            
            // Small delay to prevent multiple simultaneous checks
            setTimeout(() => {
                this.checkOfflineEarnings();
                offlineCheckPending = false;
            }, 100);
        };
        
        // Handle visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                updateLastActiveTime();
            } else {
                checkOfflineEarningsOnReturn();
            }
        });
        
        // Handle window focus/blur (switching between windows)
        window.addEventListener('blur', updateLastActiveTime);
        window.addEventListener('focus', checkOfflineEarningsOnReturn);
        
        // Handle page unload (closing browser/tab)
        window.addEventListener('beforeunload', () => {
            this.state.lastActiveTime = Date.now();
            // Use sendBeacon for reliable data sending on page unload
            if (navigator.sendBeacon && this.playerId) {
                const stateToSave = {
                    ...this.state,
                    player_name: this.isRegistered ? this.playerName : null,
                    total_points_earned: this.state.totalPointsEarned,
                    total_clicks: this.state.totalClicks,
                    click_power: this.state.clickPower,
                    crit_chance: this.state.critChance,
                    crit_multiplier: this.state.critMultiplier,
                    game_hub_revealed: this.state.gameHubRevealed,
                    upgrades_tab_unlocked: this.state.upgradesTabUnlocked,
                    last_active_time: this.state.lastActiveTime,
                    offline_earnings_rate: this.state.offlineEarningsRate
                };
                
                // Try to send via beacon API for reliability
                const data = JSON.stringify({
                    type: 'save_game_state',
                    game_player_id: this.playerId,
                    state: stateToSave
                });
                navigator.sendBeacon('/api/save-offline', data);
            }
        });
        
        // Also check on page load in case the browser didn't fire events properly
        setTimeout(() => this.checkOfflineEarnings(), 1000);
    }
    
    checkOfflineEarnings() {
        // Prevent multiple checks from running simultaneously
        if (this.offlineEarningsCheckInProgress) {
            console.log('⚠️ Offline earnings check already in progress, skipping');
            return;
        }
        
        this.offlineEarningsCheckInProgress = true;
        
        const now = Date.now();
        const lastActive = this.state.lastActiveTime || now;
        const timeAway = now - lastActive;
        
        // Validate all values before calculation
        const generatorPointsPerSecond = parseFloat(this.state.generatorPointsPerSecond) || 0;
        const offlineEarningsRate = parseFloat(this.state.offlineEarningsRate) || 0.4;
        
        // Only show popup if away for more than 1 minute and have some production
        if (timeAway > 60000 && generatorPointsPerSecond > 0) {
            const secondsAway = Math.floor(timeAway / 1000);
            
            // Validate secondsAway (prevent infinite time or negative time)
            if (secondsAway <= 0 || !isFinite(secondsAway) || secondsAway > 2592000) { // Max 30 days
                console.log('⚠️ Invalid time away detected, skipping offline earnings');
                this.state.lastActiveTime = now;
                return;
            }
            
            const offlineProduction = generatorPointsPerSecond * secondsAway * offlineEarningsRate;
            
            // Validate the calculated offline production
            if (!isFinite(offlineProduction) || isNaN(offlineProduction) || offlineProduction <= 0) {
                console.log('⚠️ Invalid offline production calculated, skipping offline earnings');
                console.log('Debug values:', {
                    generatorPointsPerSecond,
                    secondsAway,
                    offlineEarningsRate,
                    offlineProduction
                });
                this.state.lastActiveTime = now;
                return;
            }
            
            // Validate current points before adding
            if (!isFinite(this.state.points) || isNaN(this.state.points)) {
                console.log('⚠️ Player points are corrupted, resetting to 0');
                this.state.points = 0;
            }
            
            if (!isFinite(this.state.totalPointsEarned) || isNaN(this.state.totalPointsEarned)) {
                console.log('⚠️ Total points earned is corrupted, resetting to 0');
                this.state.totalPointsEarned = 0;
            }
            
            // Add the offline earnings (with safety checks)
            this.state.points = Math.max(0, this.state.points + offlineProduction);
            this.state.totalPointsEarned = Math.max(0, this.state.totalPointsEarned + offlineProduction);
            
            // Show the popup
            this.showOfflineEarningsPopup(secondsAway, offlineProduction);
            
            console.log(`💰 Offline earnings: ${offlineProduction} points for ${secondsAway} seconds away`);
        }
        
        // Update last active time to now
        this.state.lastActiveTime = now;
        
        // Reset the flag
        this.offlineEarningsCheckInProgress = false;
    }
    
    showOfflineEarningsPopup(secondsAway, pointsEarned) {
        // Prevent multiple popups from being created
        if (document.querySelector('#offlineEarningsPopup')) {
            console.log('⚠️ Offline earnings popup already exists, skipping');
            return;
        }
        
        // Create popup overlay
        const overlay = document.createElement('div');
        overlay.id = 'offlineEarningsPopup';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;
        
        // Create popup content
        const popup = document.createElement('div');
        popup.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 2px solid #FFD700;
            border-radius: 20px;
            padding: 2em;
            text-align: center;
            color: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            animation: popupSlideIn 0.5s ease-out;
        `;
        
        // Add animation keyframes
        if (!document.querySelector('#offlineEarningsStyles')) {
            const style = document.createElement('style');
            style.id = 'offlineEarningsStyles';
            style.textContent = `
                @keyframes popupSlideIn {
                    from {
                        transform: scale(0.8) translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Format time away
        const timeAwayText = this.formatTimeAway(secondsAway);
        
        popup.innerHTML = `
            <h2 style="color: #FFD700; margin-bottom: 0.5em; font-size: 1.5em;">🌙 While you were away...</h2>
            <p style="margin-bottom: 1em; color: #ccc;">You were away for <strong style="color: #FFD700;">${timeAwayText}</strong></p>
            <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid #FFD700; border-radius: 10px; padding: 1em; margin: 1em 0;">
                <p style="margin: 0; font-size: 1.2em;">You earned:</p>
                <p style="margin: 0.5em 0 0 0; font-size: 1.8em; font-weight: bold; color: #FFD700;">${this.formatNumber(pointsEarned)} points</p>
                <p style="margin: 0.5em 0 0 0; font-size: 0.9em; color: #999;">(40% efficiency while offline)</p>
            </div>
            <button id="collectOfflineEarnings" style="
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                border: none;
                border-radius: 10px;
                padding: 0.8em 2em;
                font-size: 1.1em;
                font-weight: bold;
                color: #000;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Collect Earnings! ✨</button>
        `;
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        // Add hover effect to button
        const button = popup.querySelector('#collectOfflineEarnings');
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 5px 15px rgba(255, 215, 0, 0.4)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = 'none';
        });
        
        // Close popup when button is clicked
        button.addEventListener('click', () => {
            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(0.9)';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
            
            // Update display and save
            this.updateDisplay();
            this.saveGameState();
        });
        
        // Also allow clicking overlay to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                button.click();
            }
        });
    }
    
    formatTimeAway(seconds) {
        if (seconds < 60) {
            return `${seconds} seconds`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return hours > 0 ? `${days}d ${hours}h` : `${days} day${days !== 1 ? 's' : ''}`;
        }
    }

    // Buy a generator
    async buyGenerator(generatorId) {
        const generator = this.generatorData.find(g => g.id === generatorId);
        const cost = this.getGeneratorCost(generator);
        
        if (this.state.points >= cost) {
            this.state.points -= cost;
            this.state.generators[generatorId] = (this.state.generators[generatorId] || 0) + 1;
            
            this.calculatePointsPerSecond();
            this.updateDisplay();
            
            // Check for progressive unlocks after purchase
            this.checkProgressiveUnlocks();
            
            await this.saveGameState();
            
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
    async buyUpgrade(upgradeId) {
        const upgrade = this.upgradeData.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.error(`Upgrade not found: ${upgradeId}`);
            return;
        }
        
        if (upgrade.isInfinite) {
            // Handle infinite upgrades
            const currentLevel = this.state.infiniteUpgrades[upgradeId] || 0;
            const cost = this.getInfiniteUpgradeCost(upgrade, currentLevel);
            
            console.log(`Infinite upgrade attempt: ${upgradeId}, cost: ${cost}, points: ${this.state.points}, affordable: ${this.state.points >= cost}`);
            
            if (this.state.points >= cost) {
                this.state.points -= cost;
                this.state.infiniteUpgrades[upgradeId] = currentLevel + 1;
                
                this.applyInfiniteUpgradeEffects(upgradeId);
                
                this.calculatePointsPerSecond();
                this.updateDisplay();
                
                await this.saveGameState();
                
                const newLevel = this.state.infiniteUpgrades[upgradeId];
                window.ui.createFloatingNumber(`${upgrade.name} Lv.${newLevel}!`, '#ff6b6b');
                
                this.checkAchievements();
                
                window.effects.createPurchaseEffect(upgrade.icon);
                
                if (cost > 50000) {
                    window.effects.addScreenShake();
                }
                
                // Re-render upgrades to update costs and availability
                this.renderUpgrades();
            } else {
                console.log(`Cannot afford infinite upgrade: ${upgradeId} (need ${cost}, have ${this.state.points})`);
            }
        } else {
            // Handle regular upgrades
            console.log(`Regular upgrade attempt: ${upgradeId}, cost: ${upgrade.cost}, points: ${this.state.points}, affordable: ${this.state.points >= upgrade.cost}, already owned: ${this.state.upgrades[upgradeId]}`);
            
            if (this.state.points >= upgrade.cost && !this.state.upgrades[upgradeId]) {
                this.state.points -= upgrade.cost;
                this.state.upgrades[upgradeId] = true;
                
                this.applyUpgradeEffects(upgradeId);
                
                this.calculatePointsPerSecond();
                this.updateDisplay();
                
                // Check for progressive unlocks after purchase
                this.checkProgressiveUnlocks();
                
                await this.saveGameState();
                
                window.ui.createFloatingNumber(`+${upgrade.name}!`, '#ff6b6b');
                
                this.checkAchievements();
                
                window.effects.createPurchaseEffect(upgrade.icon);
                
                if (upgrade.cost > 50000) {
                    window.effects.addScreenShake();
                }
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

    // Calculate cost for infinite upgrades (exponential scaling)
    getInfiniteUpgradeCost(upgrade, currentLevel) {
        // Each level costs baseCost * (1.5 ^ currentLevel) for more aggressive scaling
        // This makes each level significantly more expensive than the last
        return Math.floor(upgrade.baseCost * Math.pow(1.5, currentLevel));
    }

    // Apply infinite upgrade effects
    applyInfiniteUpgradeEffects(upgradeId) {
        // Effects are calculated dynamically in the multiplier functions
        // No need to modify state directly here, just trigger recalculation
        this.calculatePointsPerSecond();
    }

    // Get infinite upgrade multiplier for generators
    getInfiniteGeneratorMultiplier(generatorId) {
        let multiplier = 1;
        this.upgradeData.forEach(upgrade => {
            if (upgrade.isInfinite && 
                upgrade.effect === 'infiniteGeneratorMultiplier' && 
                upgrade.targetGenerator === generatorId) {
                const level = this.state.infiniteUpgrades[upgrade.id] || 0;
                multiplier *= Math.pow(1 + upgrade.value, level); // Compound the bonus
            }
        });
        return multiplier;
    }

    // Get infinite upgrade multiplier for clicks
    getInfiniteClickMultipliers() {
        let clickMultiplier = 1;
        let critChanceBonus = 0;
        
        this.upgradeData.forEach(upgrade => {
            if (upgrade.isInfinite) {
                const level = this.state.infiniteUpgrades[upgrade.id] || 0;
                
                if (upgrade.effect === 'infiniteClickMultiplier') {
                    clickMultiplier *= Math.pow(1 + upgrade.value, level);
                } else if (upgrade.effect === 'infiniteCritChance') {
                    critChanceBonus += upgrade.value * level;
                }
            }
        });
        
        return { clickMultiplier, critChanceBonus };
    }

    // Handle click
    async handleClick() {
        try {
            // Validate current points before clicking
            if (!isFinite(this.state.points) || isNaN(this.state.points)) {
                console.warn('Points corrupted during click, resetting to 0');
                this.state.points = 0;
            }
            if (!isFinite(this.state.totalPointsEarned) || isNaN(this.state.totalPointsEarned)) {
                console.warn('Total points earned corrupted during click, resetting to 0');
                this.state.totalPointsEarned = 0;
            }
            
            // Track click timing
            const now = Date.now();
            this.state.recentClicks.push(now);
            this.state.lastClickTime = now;
            
            // Validate click power values and apply infinite upgrades
            let baseClickPower = isFinite(this.state.clickPower) && !isNaN(this.state.clickPower) ? Math.max(1, this.state.clickPower) : 1;
            let baseCritChance = isFinite(this.state.critChance) && !isNaN(this.state.critChance) ? Math.max(0, Math.min(100, this.state.critChance)) : 0;
            const critMultiplier = isFinite(this.state.critMultiplier) && !isNaN(this.state.critMultiplier) ? Math.max(1, this.state.critMultiplier) : 2;
            
            // Apply infinite upgrade bonuses
            const infiniteMultipliers = this.getInfiniteClickMultipliers();
            const clickPower = baseClickPower * infiniteMultipliers.clickMultiplier;
            const critChance = Math.min(100, baseCritChance + infiniteMultipliers.critChanceBonus);
            
            // Calculate click damage with crit chance
            let clickDamage = clickPower;
            let isCrit = false;
            
            if (critChance > 0 && Math.random() * 100 < critChance) {
                clickDamage *= critMultiplier;
                isCrit = true;
            }
            
            // Validate click damage before adding
            if (!isFinite(clickDamage) || isNaN(clickDamage) || clickDamage <= 0) {
                console.warn('Invalid click damage calculated, using default value of 1');
                clickDamage = 1;
                isCrit = false;
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
    async checkGameHubReveal() {
        if (this.state.gameHubRevealed) return; // Only process once
        const hasGenerators = Object.values(this.state.generators).some(count => count > 0);
        const hasSignificantPoints = this.state.points >= 16; // 16+ points
        const hasEnoughClicks = this.state.totalClicks >= 15; // 15+ clicks
        const hasEarnedPoints = this.state.totalPointsEarned >= 16; // Has earned 16+ points total

        // Only log once if revealing
        if (hasEnoughClicks || hasSignificantPoints || hasGenerators || hasEarnedPoints) {
            this.state.gameHubRevealed = true;
            window.ui.revealGameHub();
            await this.saveGameState();
            console.log('Game hub revealed! Criteria met:', {
                hasEnoughClicks,
                hasSignificantPoints, 
                hasGenerators,
                hasEarnedPoints
            });
        }
    }

    // Achievement system
    async checkAchievements() {
        const totalGenerators = Object.values(this.state.generators).reduce((sum, count) => sum + count, 0);
        
        let achievementEarned = false;
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
                    achievementEarned = true;
                }
            }
        });
        
        // Save once if any achievements were earned
        if (achievementEarned) {
            await this.saveGameState();
        }
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
                    let cost;
                    if (upgrade.isInfinite) {
                        const currentLevel = this.state.infiniteUpgrades[upgradeId] || 0;
                        cost = this.getInfiniteUpgradeCost(upgrade, currentLevel);
                        
                        // Update level display in the name
                        const nameElement = card.querySelector('.skill-name');
                        if (nameElement) {
                            nameElement.textContent = `${upgrade.name} (Lv.${currentLevel})`;
                        }
                    } else {
                        cost = upgrade.cost;
                    }
                    
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
        
        // Show unlocked upgrades (regular ones that haven't been purchased, or infinite ones)
        const unlockedUpgrades = this.getUnlockedUpgrades().filter(upgrade => 
            upgrade.isInfinite || !this.state.upgrades[upgrade.id]
        );
        
        // Group upgrades by category
        const categories = ['click', 'junior_dev', 'senior_dev', 'code_monkey', 'ai_assistant', 'quantum_computer', 'coding_farm', 'neural_network', 'blockchain_miner', 'digital_hivemind', 'time_machine'];
        
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
                    'quantum_computer': '⚛️ Quantum Computer Upgrades',
                    'coding_farm': '🏭 Coding Farm Upgrades',
                    'neural_network': '🧠 Neural Network Upgrades',
                    'blockchain_miner': '⛏️ Blockchain Miner Upgrades',
                    'digital_hivemind': '🧬 Digital Hivemind Upgrades',
                    'time_machine': '⏰ Time Machine Upgrades'
                };
                categoryHeader.textContent = categoryNames[category];
                upgradesContainer.appendChild(categoryHeader);
                
                // Add upgrades for this category
                categoryUpgrades.forEach(upgrade => {
                    let cost, levelText = '';
                    
                    if (upgrade.isInfinite) {
                        const currentLevel = this.state.infiniteUpgrades[upgrade.id] || 0;
                        cost = this.getInfiniteUpgradeCost(upgrade, currentLevel);
                        levelText = ` (Lv.${currentLevel})`;
                    } else {
                        cost = upgrade.cost;
                    }
                    
                    const affordable = this.state.points >= cost;
                    const upgradeCard = document.createElement('div');
                    upgradeCard.className = `skill-card ${affordable ? 'affordable' : 'locked'}`;
                    upgradeCard.setAttribute('data-upgrade-id', upgrade.id);
                    
                    upgradeCard.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        this.buyUpgrade(upgrade.id);
                    });
                    
                    upgradeCard.innerHTML = `
                        <div class="skill-icon">${upgrade.icon}</div>
                        <div class="skill-name">${upgrade.name}${levelText}</div>
                        <div class="skill-description">${upgrade.description}</div>
                        <div class="skill-stats">
                            <span class="skill-cost">${this.formatNumber(cost)} pts</span>
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
