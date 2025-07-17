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
        this.mouseRepelForce = size === 'large' ? 50000 : size === 'small' ? 60000 : 55000;
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
        this.element.style.pointerEvents = 'none';
        
        const container = document.getElementById('floatingContainer');
        if (container) {
            container.appendChild(this.element);
            // Reduce console logging for performance
            // console.log('Created floating element:', this.emoji, 'at', this.x, this.y);
        } else {
            console.error('floatingContainer not found!');
        }
    }
    
    update(mouseX, mouseY, otherElements) {
        // Mouse repulsion - optimize distance calculation
        const mouseDx = this.x - mouseX;
        const mouseDy = this.y - mouseY;
        const mouseDistanceSquared = mouseDx * mouseDx + mouseDy * mouseDy;
        const mouseRepelDistanceSquared = this.mouseRepelDistance * this.mouseRepelDistance;
        
        if (mouseDistanceSquared < mouseRepelDistanceSquared && mouseDistanceSquared > 0) {
            // Only calculate sqrt when needed
            const mouseDistance = Math.sqrt(mouseDistanceSquared);
            const mouseForce = this.mouseRepelForce / (mouseDistance * 100);
            const mouseNormalX = mouseDx / mouseDistance;
            const mouseNormalY = mouseDy / mouseDistance;
            this.vx += mouseNormalX * mouseForce;
            this.vy += mouseNormalY * mouseForce;
        }
        
        // Element-to-element collisions - optimize with early exit
        for (let i = 0; i < otherElements.length; i++) {
            const other = otherElements[i];
            if (other === this || other.isInteractive) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distanceSquared = dx * dx + dy * dy;
            const minDistance = this.radius + other.radius;
            const minDistanceSquared = minDistance * minDistance;
            
            if (distanceSquared < minDistanceSquared && distanceSquared > 0) {
                // Only calculate sqrt for actual collisions
                const distance = Math.sqrt(distanceSquared);
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
                if (relativeSpeed > 0) continue;
                
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
        
        // Batch DOM updates - only update if position changed significantly
        const deltaX = Math.abs(this.x - (this.lastX || this.x));
        const deltaY = Math.abs(this.y - (this.lastY || this.y));
        
        // Force update on first frame or if position changed significantly
        if (!this.lastX || !this.lastY || deltaX > 0.5 || deltaY > 0.5) {
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
            
            // Add rotation based on velocity for extra visual appeal
            const rotation = Math.atan2(this.vy, this.vx) * (180 / Math.PI);
            this.element.style.transform = `rotate(${rotation * 0.1}deg)`;
            
            this.lastX = this.x;
            this.lastY = this.y;
        }
    }
}

// Export for use in other modules
window.FloatingElement = FloatingElement;
