// Physics-based floating elements with space-like movement
class FloatingElement {
    constructor(emoji, x, y, size = 'medium') {
        this.emoji = emoji;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.size = size;
        this.element = null;
        this.mass = size === 'large' ? 4 : size === 'small' ? 1 : 2;
        this.radius = size === 'large' ? 25 : size === 'small' ? 15 : 20;
        this.maxSpeed = size === 'large' ? 3 : size === 'small' ? 5 : 4;
        this.mouseRepelForce = size === 'large' ? 50000 : size === 'small' ? 60000 : 55000; // Much stronger force
        this.mouseRepelDistance = size === 'large' ? 150 : size === 'small' ? 100 : 120;
        
        this.createElement();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = `floating-element ${this.size}`;
        this.element.textContent = this.emoji;
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        this.element.style.position = 'absolute';
        this.element.style.zIndex = '5';
        // Make floating elements non-clickable but still trackable for mouse position
        this.element.style.pointerEvents = 'none';
        
        const container = document.getElementById('floatingContainer');
        if (container) {
            container.appendChild(this.element);
            console.log('Created floating element:', this.emoji, 'at', this.x, this.y);
        } else {
            console.error('floatingContainer not found!');
        }
    }
    
    update(mouseX, mouseY, otherElements) {
        // Mouse repulsion
        const mouseDx = this.x - mouseX;
        const mouseDy = this.y - mouseY;
        const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        
        if (mouseDistance < this.mouseRepelDistance && mouseDistance > 0) {
            // Use linear distance instead of distance squared for stronger effect
            const mouseForce = this.mouseRepelForce / (mouseDistance * 100);
            const mouseNormalX = mouseDx / mouseDistance;
            const mouseNormalY = mouseDy / mouseDistance;
            this.vx += mouseNormalX * mouseForce;
            this.vy += mouseNormalY * mouseForce;
            
            // Debug logging for mouse repulsion
            console.log(`${this.emoji} repelling from mouse: distance=${mouseDistance.toFixed(1)}, force=${mouseForce.toFixed(2)}, vx=${this.vx.toFixed(2)}, vy=${this.vy.toFixed(2)}`);
        }
        
        // Element-to-element collisions
        otherElements.forEach(other => {
            if (other !== this && !other.isLinkedIn) {
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = this.radius + other.radius;
                
                if (distance < minDistance && distance > 0) {
                    // Collision detected
                    const overlap = minDistance - distance;
                    const separation = overlap / 2;
                    
                    // Normalize direction
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    
                    // Separate elements
                    this.x += normalX * separation;
                    this.y += normalY * separation;
                    other.x -= normalX * separation;
                    other.y -= normalY * separation;
                    
                    // Calculate relative velocity
                    const relativeVx = this.vx - other.vx;
                    const relativeVy = this.vy - other.vy;
                    
                    // Calculate relative velocity in collision normal direction
                    const relativeSpeed = relativeVx * normalX + relativeVy * normalY;
                    
                    // Do not resolve if velocities are separating
                    if (relativeSpeed > 0) return;
                    
                    // Calculate restitution (bounciness)
                    const restitution = 0.8;
                    
                    // Calculate impulse
                    const impulse = -(1 + restitution) * relativeSpeed / (1/this.mass + 1/other.mass);
                    
                    // Apply impulse
                    const impulseX = impulse * normalX;
                    const impulseY = impulse * normalY;
                    
                    this.vx += impulseX / this.mass;
                    this.vy += impulseY / this.mass;
                    other.vx -= impulseX / other.mass;
                    other.vy -= impulseY / other.mass;
                }
            }
        });
        
        // Apply movement
        this.x += this.vx;
        this.y += this.vy;
        
        // Speed limiting
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        
        // Boundary bouncing with energy conservation
        const margin = this.radius;
        if (this.x < margin) {
            this.x = margin;
            this.vx = Math.abs(this.vx) * 0.9; // Energy loss on bounce
        }
        if (this.x > window.innerWidth - margin) {
            this.x = window.innerWidth - margin;
            this.vx = -Math.abs(this.vx) * 0.9;
        }
        if (this.y < margin) {
            this.y = margin;
            this.vy = Math.abs(this.vy) * 0.9;
        }
        if (this.y > window.innerHeight - margin) {
            this.y = window.innerHeight - margin;
            this.vy = -Math.abs(this.vy) * 0.9;
        }
        
        // Add slight random movement to keep things interesting
        if (Math.random() < 0.002) {
            this.vx += (Math.random() - 0.5) * 0.2;
            this.vy += (Math.random() - 0.5) * 0.2;
        }
        
        // Update element position
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        
        // Add rotation based on velocity for extra visual appeal
        const rotation = Math.atan2(this.vy, this.vx) * (180 / Math.PI);
        this.element.style.transform = `rotate(${rotation * 0.1}deg)`;
    }
}

// Special LinkedIn floating element
class LinkedInElement extends FloatingElement {
    constructor(x, y) {
        super('🔗', x, y, 'medium'); // Use link emoji, will replace with LinkedIn styling
        this.isLinkedIn = true;
        this.maxSpeed = 1.5; // Much slower movement
        this.mass = 10; // Heavy so it affects others more
        this.radius = 30; // Larger radius for more influence
        this.angle = Math.random() * Math.PI * 2; // For smooth circular-ish movement
        this.speedMultiplier = 0.3; // Very slow movement
        
        // Override the createElement to add LinkedIn styling and click handler
        this.createLinkedInElement();
    }
    
    createLinkedInElement() {
        // Remove the default element first
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = document.createElement('div');
        this.element.className = 'floating-element linkedin-element medium';
        this.element.innerHTML = '<span style="font-family: Arial, sans-serif; font-weight: bold; color: white; background: #0077B5; padding: 0.2em 0.3em; border-radius: 0.1em; font-size: 0.8em;">in</span>'; // LinkedIn "in" logo
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        this.element.style.position = 'absolute';
        this.element.style.cursor = 'pointer';
        this.element.style.pointerEvents = 'auto'; // Enable clicking
        this.element.style.fontSize = '2.5rem';
        this.element.style.filter = 'drop-shadow(0 0 10px rgba(0, 119, 181, 0.6))'; // LinkedIn blue glow
        this.element.style.transition = 'transform 0.1s ease-out, filter 0.3s ease';
        this.element.style.zIndex = '1001'; // Above all UI elements including buttons
        
        // Add hover effect
        this.element.addEventListener('mouseenter', () => {
            this.element.style.transform = 'scale(1.2)';
            this.element.style.filter = 'drop-shadow(0 0 15px rgba(0, 119, 181, 0.8))';
        });
        
        this.element.addEventListener('mouseleave', () => {
            this.element.style.transform = 'scale(1)';
            this.element.style.filter = 'drop-shadow(0 0 10px rgba(0, 119, 181, 0.6))';
        });
        
        // Add click handler to open LinkedIn
        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open('https://www.linkedin.com/in/alexstraughan/', '_blank');
            
            // Add a special effect when clicked
            this.element.style.transform = 'scale(1.5)';
            this.element.style.filter = 'drop-shadow(0 0 20px rgba(0, 119, 181, 1))';
            
            setTimeout(() => {
                this.element.style.filter = 'drop-shadow(0 0 10px rgba(0, 119, 181, 0.6))';
            }, 200);
        });
        
        const container = document.getElementById('floatingContainer');
        if (container) {
            container.appendChild(this.element);
        } else {
            console.error('floatingContainer not found for LinkedIn element!');
        }
    }
    
    update(mouseX, mouseY, otherElements) {
        // Move in a slow, smooth pattern (not affected by mouse or other elements)
        this.angle += 0.002; // Very slow rotation
        this.vx = Math.cos(this.angle) * this.speedMultiplier;
        this.vy = Math.sin(this.angle) * this.speedMultiplier;
        
        // Apply movement
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary bouncing - just reverse direction smoothly
        const margin = this.radius;
        if (this.x < margin || this.x > window.innerWidth - margin) {
            this.angle = Math.PI - this.angle; // Reflect angle
            this.x = Math.max(margin, Math.min(window.innerWidth - margin, this.x));
        }
        if (this.y < margin || this.y > window.innerHeight - margin) {
            this.angle = -this.angle; // Reflect angle
            this.y = Math.max(margin, Math.min(window.innerHeight - margin, this.y));
        }
        
        // Affect other elements (push them away) but don't be affected by them
        otherElements.forEach(other => {
            if (other !== this && !other.isLinkedIn) {
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = this.radius + other.radius;
                
                if (distance < minDistance * 1.5 && distance > 0) { // Slightly larger influence range
                    // Push other elements away
                    const force = 2; // Stronger force
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    
                    other.vx -= normalX * force;
                    other.vy -= normalY * force;
                }
            }
        });
        
        // Update element position
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }
}

// Physics Manager
class Physics {
    constructor() {
        this.elements = [];
        this.linkedinElement = null;
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        
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
            // Debug: uncomment next line to see mouse tracking
            console.log('Mouse at:', this.mouseX, this.mouseY);
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
        console.log('Creating floating elements...');
        const numElements = 45; // Reduced slightly for better performance with collisions
        
        // Get actual viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        console.log('Viewport dimensions:', viewportWidth, 'x', viewportHeight);
        
        // Create the special LinkedIn element first
        const linkedinX = viewportWidth * 0.2 + Math.random() * viewportWidth * 0.6; // Somewhere in middle area
        const linkedinY = viewportHeight * 0.2 + Math.random() * viewportHeight * 0.6;
        this.linkedinElement = new LinkedInElement(linkedinX, linkedinY);
        this.elements.push(this.linkedinElement);
        console.log('LinkedIn element created');
        
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
        
        console.log('Created', this.elements.length, 'floating elements');
    }
    
    // Animation loop
    animate() {
        this.elements.forEach(element => {
            element.update(this.mouseX, this.mouseY, this.elements);
        });
        requestAnimationFrame(() => this.animate());
    }
    
    start() {
        console.log('Starting physics simulation...');
        this.createFloatingElements();
        this.animate();
        console.log('Physics animation loop started');
    }
}

// Export the Physics class
window.Physics = Physics;
