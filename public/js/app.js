// Application initialization and main entry point
class App {
    constructor() {
        this.game = null;
        this.physics = null;
        this.ui = null;
        this.effects = null;
    }

    async waitForWebSocketReady() {
        return new Promise((resolve) => {
            // If WebSocket is already connected, resolve immediately
            if (window.wsClient && window.wsClient.isConnected) {
                resolve();
                return;
            }
            
            // Otherwise, wait for the websocketReady event
            const handleWebSocketReady = () => {
                document.removeEventListener('websocketReady', handleWebSocketReady);
                resolve();
            };
            
            document.addEventListener('websocketReady', handleWebSocketReady);
            
            // Also listen for connection event as fallback
            if (window.wsClient) {
                window.wsClient.on('connected', () => {
                    document.removeEventListener('websocketReady', handleWebSocketReady);
                    resolve();
                });
            }
            
            // Timeout after 1 second if connection fails (reduced for faster startup)
            setTimeout(() => {
                console.warn('⚠️ WebSocket connection timeout, continuing anyway...');
                document.removeEventListener('websocketReady', handleWebSocketReady);
                resolve();
            }, 1000);
        });
    }

    async initialize() {
        console.log('App initializing...');
        window.perfMonitor?.mark('app_init_start');
        
        // Initialize core systems first for immediate usability
        this.ui = new UI();
        window.perfMonitor?.mark('ui_initialized');
        console.log('UI initialized');
        
        this.game = new Game();
        window.perfMonitor?.mark('game_created');
        console.log('Game initialized');

        // Make them globally available
        window.game = this.game;
        window.ui = this.ui;

        // Initialize the game system first
        await this.game.initialize();
        window.perfMonitor?.mark('game_initialized');
        console.log('Game system initialized');

        // Set up click handler for immediate interaction
        this.setupClickHandler();
        window.perfMonitor?.mark('click_handler_setup');
        
        // Initialize page fade-in effect
        this.ui.initializePageFadeIn();
        window.perfMonitor?.mark('page_fade_setup');

        // Load heavy systems in the background after core functionality is ready
        this.initializeBackgroundSystems();
        
        console.log('App core initialization complete - background systems loading...');
    }

    async initializeBackgroundSystems() {
        // Use setTimeout to allow the main thread to breathe
        setTimeout(async () => {
            try {
                window.perfMonitor?.mark('background_init_start');
                
                // Wait for WebSocket but don't block core functionality
                await this.waitForWebSocketReady();
                window.perfMonitor?.mark('websocket_connected');
                console.log('WebSocket client ready');

                // Initialize effects (lightweight)
                this.effects = new Effects();
                window.effects = this.effects;
                window.perfMonitor?.mark('effects_initialized');
                console.log('Effects initialized');

                // Initialize physics last as it's the heaviest
                setTimeout(() => {
                    this.physics = new Physics();
                    window.physics = this.physics;
                    window.perfMonitor?.mark('physics_created');
                    console.log('Physics initialized');
                    
                    // Start physics with reduced elements on slower connections
                    this.physics.start();
                    window.perfMonitor?.mark('physics_started');
                    console.log('Physics started');
                }, 100);

                // Set up debug reset button
                this.setupDebugReset();
                
                console.log('Background systems initialization complete');
            } catch (error) {
                console.error('Error initializing background systems:', error);
            }
        }, 10);
    }

    setupClickHandler() {
        document.getElementById('greetingCard').addEventListener('click', () => {
            this.game.handleClick();
        });
    }
    
    setupDebugReset() {
        const resetButton = document.getElementById('debugReset');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                // Clear localStorage
                localStorage.removeItem('codeClickerSave');
                console.log('Game progress cleared');
                // Reload page
                window.location.reload();
            });
        }
    }
}

// Initialize everything when page loads
window.addEventListener('load', () => {
    const app = new App();
    app.initialize();
});

// Export the App class
window.App = App;
