// Performance monitoring for startup optimization
class PerformanceMonitor {
    constructor() {
        this.timings = {};
        this.startTime = performance.now();
        
        // Mark page start
        this.mark('page_start');
        
        // Monitor key events
        this.setupEventListeners();
    }
    
    mark(eventName) {
        const now = performance.now();
        this.timings[eventName] = {
            time: now,
            relative: now - this.startTime
        };
        console.log(`🔍 Performance: ${eventName} at ${this.timings[eventName].relative.toFixed(0)}ms`);
    }
    
    setupEventListeners() {
        // Monitor DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.mark('dom_ready'));
        } else {
            this.mark('dom_ready');
        }
        
        // Monitor window load
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => this.mark('window_load'));
        } else {
            this.mark('window_load');
        }
        
        // Monitor WebSocket connection
        document.addEventListener('websocketReady', () => this.mark('websocket_ready'));
        
        // Monitor when game becomes interactive
        this.checkForGameReady();
    }
    
    checkForGameReady() {
        const checkInterval = setInterval(() => {
            if (window.game && window.game.state) {
                this.mark('game_ready');
                clearInterval(checkInterval);
                
                // Report final summary after everything is loaded
                setTimeout(() => this.reportSummary(), 1000);
            }
        }, 50);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
    
    reportSummary() {
        console.log('📊 Performance Summary:');
        console.log('═'.repeat(50));
        
        const events = [
            'page_start',
            'dom_ready', 
            'window_load',
            'websocket_ready',
            'game_ready'
        ];
        
        events.forEach(event => {
            if (this.timings[event]) {
                console.log(`${event.padEnd(20)}: ${this.timings[event].relative.toFixed(0).padStart(6)}ms`);
            }
        });
        
        console.log('═'.repeat(50));
        
        // Highlight slow areas
        if (this.timings.game_ready && this.timings.game_ready.relative > 3000) {
            console.warn('⚠️ Slow startup detected (>3s). Consider further optimization.');
        } else if (this.timings.game_ready && this.timings.game_ready.relative > 1500) {
            console.log('💡 Startup is moderately fast but could be improved.');
        } else if (this.timings.game_ready) {
            console.log('✅ Fast startup achieved!');
        }
    }
}

// Auto-start performance monitoring
if (!window.perfMonitor) {
    window.perfMonitor = new PerformanceMonitor();
}
