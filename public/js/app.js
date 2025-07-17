// Application initialization and main entry point
class App {
    constructor() {
        this.game = null;
        this.physics = null;
        this.ui = null;
        this.effects = null;
    }

    async initialize() {
        console.log('App initializing...');
        
        // Initialize all systems
        this.effects = new Effects();
        console.log('Effects initialized');
        
        this.ui = new UI();
        console.log('UI initialized');
        
        this.physics = new Physics();
        console.log('Physics initialized');
        
        this.game = new Game();
        console.log('Game initialized');

        // Make them globally available for cross-system communication
        window.game = this.game;
        window.physics = this.physics;
        window.ui = this.ui;
        window.effects = this.effects;

        // Initialize the game
        await this.game.initialize();
        console.log('Game system initialized');

        // Start physics simulation
        this.physics.start();
        console.log('Physics started');

        // Initialize page fade-in effect
        this.ui.initializePageFadeIn();

        // Set up click handler for the main clicker
        this.setupClickHandler();
        
        // Set up debug reset button
        this.setupDebugReset();
        
        console.log('App initialization complete');
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
