// Physics Manager - Main physics simulation controller
// Requires floating-elements.js and interactive-elements.js to be loaded first

class Physics {
    constructor() {
        this.elements = [];
        this.interactiveElements = [];
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.isMouseDown = false;
        this.orbitStartTime = 0;
        this.orbitStopTime = 0;
        this.isOrbiting = false;
        this.holdTimer = null; // Timer for hold delay
        this.holdDelay = 500; // 0.5 seconds in milliseconds
        this.emojis = [
            '💻', '🚀', '⚡', '🎯', '✨', '🔧', '💡', '🎨', '📱', '⚙️',
            '🖥️', '📊', '🌟', '💎', '🔮', '🎪', '🎭', '🎨', '🎯',
            '⭐', '🌙', '☄️', '🪐', '🌈', '🔥', '💫', '✨', '⚡', '💥',
            '🎵', '🎶', '🎹', '🎸', '🥁', '🎺', '🎻', '🎤', '🎧', '📻',
            '🎮', '🕹️', '🎲', '🃏', '🎯', '🏆', '🥇', '🏅', '🎖️', '👑',
            '🛸', '🌍', '🌌', '⭐', '🌠', '🔭', '🛰️', '🌑', '🌒', '🌓'
        ];
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Mouse tracking
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            // If we're orbiting, update the orbit target (only if not locked)
            if (this.isOrbiting) {
                this.interactiveElements.forEach(element => {
                    if (element.isOrbiting && !element.orbitCenterLocked) {
                        element.orbitTarget.x = this.mouseX;
                        element.orbitTarget.y = this.mouseY;
                    }
                });
            }
        });
        
        // Mouse down - start orbiting for interactive elements after delay
        document.addEventListener('mousedown', (e) => {
            // Check if the click is on a UI element or button
            const target = e.target;
            const isUIElement = target.closest('.greeting-card') || 
                               target.closest('.game-hub') || 
                               target.closest('.tab-button') || 
                               target.closest('.skill-card') ||
                               target.classList.contains('interactive-element');
            
            if (!isUIElement) {
                this.isMouseDown = true;
                this.orbitStartTime = Date.now();
                
                // Clear any existing timer
                if (this.holdTimer) {
                    clearTimeout(this.holdTimer);
                }
                
                // Set timer for 0.5 second delay
                this.holdTimer = setTimeout(() => {
                    if (this.isMouseDown) { // Only start if still holding
                        this.isOrbiting = true;
                        
                        // Start orbiting for all interactive elements
                        this.interactiveElements.forEach(element => {
                            element.startOrbiting(this.mouseX, this.mouseY);
                        });
                        
                        console.log('Started orbiting interactive elements after hold delay');
                    }
                }, this.holdDelay);
            }
        });
        
        // Mouse up - stop orbiting after delay
        document.addEventListener('mouseup', () => {
            if (this.isMouseDown) {
                this.isMouseDown = false;
                
                // Clear the hold timer if mouse is released before delay
                if (this.holdTimer) {
                    clearTimeout(this.holdTimer);
                    this.holdTimer = null;
                }
                
                // Only proceed with orbit stopping if we were actually orbiting
                if (this.isOrbiting) {
                    this.orbitStopTime = Date.now();
                    
                    // Stop following mouse but continue orbiting at current position
                    this.interactiveElements.forEach(element => {
                        if (element.isOrbiting) {
                            // Lock the orbit center to current mouse position
                            element.lockOrbitCenter();
                        }
                    });
                    
                    // Continue orbiting for 1 second after mouse up
                    setTimeout(() => {
                        this.isOrbiting = false;
                        this.interactiveElements.forEach(element => {
                            element.stopOrbiting();
                        });
                        console.log('Stopped orbiting interactive elements');
                    }, 1000);
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.elements.forEach(element => {
                if (element.x > window.innerWidth - element.radius) {
                    element.x = window.innerWidth - element.radius;
                }
                if (element.y > window.innerHeight - element.radius) {
                    element.y = window.innerHeight - element.radius;
                }
            });
        });
    }
    
    createFloatingElements() {
        // Reduce console logging for performance
        // console.log('Creating floating elements...');
        const numElements = 40; // Reduced slightly for better performance
        
        // Get actual viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // console.log('Viewport dimensions:', viewportWidth, 'x', viewportHeight);
        
        // Create interactive elements (LinkedIn, GitHub, Email, etc.)
        const interactiveTypes = ['linkedin', 'github', 'email', 'twitter', 'portfolio', 'submit_score'];
        const numInteractive = 6; // Create all 6 types
        
        for (let i = 0; i < numInteractive; i++) {
            const type = interactiveTypes[i];
            // Spread them around the screen
            const x = viewportWidth * 0.1 + Math.random() * viewportWidth * 0.8;
            const y = viewportHeight * 0.1 + Math.random() * viewportHeight * 0.8;
            
            const interactiveElement = new InteractiveElement(type, x, y);
            this.elements.push(interactiveElement);
            this.interactiveElements.push(interactiveElement);
        }
        // console.log('Created', numInteractive, 'interactive elements');
        
        // Create regular floating elements
        for (let i = 0; i < numElements; i++) {
            const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
            
            // Ensure elements don't spawn too close to edges
            const margin = 100;
            const x = margin + Math.random() * (viewportWidth - 2 * margin);
            const y = margin + Math.random() * (viewportHeight - 2 * margin);
            
            // Random sizes for variety
            const sizeRand = Math.random();
            const size = sizeRand < 0.15 ? 'large' : sizeRand < 0.7 ? 'medium' : 'small';
            
            this.elements.push(new FloatingElement(emoji, x, y, size));
        }
        
        // console.log('Created', this.elements.length, 'total floating elements');
    }
    
    // Animation loop with frame rate control
    animate() {
        // Limit to ~60fps by only updating every 16ms
        const now = performance.now();
        if (!this.lastFrameTime) this.lastFrameTime = now;
        
        if (now - this.lastFrameTime >= 16) {
            this.elements.forEach(element => {
                element.update(this.mouseX, this.mouseY, this.elements);
            });
            this.lastFrameTime = now;
            
            // Debug: Log every 60 frames (about once per second)
            if (!this.frameCount) this.frameCount = 0;
            this.frameCount++;
            if (this.frameCount % 60 === 0) {
                // console.log('Animation running, frame:', this.frameCount, 'elements:', this.elements.length);
            }
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    start() {
        console.log('Starting physics simulation...');
        this.createFloatingElements();
        console.log('Created', this.elements.length, 'total elements for animation');
        this.animate();
        console.log('Physics animation loop started');
        
        // Debug: Check if elements are actually in the DOM after a short delay
        setTimeout(() => {
            const container = document.getElementById('floatingContainer');
            if (container) {
                console.log('FloatingContainer found with', container.children.length, 'child elements');
                // Check if any elements have movement
                if (this.elements.length > 0) {
                    const firstElement = this.elements[0];
                    console.log('First element position:', firstElement.x, firstElement.y, 'velocity:', firstElement.vx, firstElement.vy);
                }
            } else {
                console.error('FloatingContainer not found in DOM!');
            }
        }, 1000);
    }
}

// Export the Physics class
window.Physics = Physics;
