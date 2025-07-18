// Interactive elements for social media links and score submission
// Requires FloatingElement to be loaded first

// Base class for interactive elements (LinkedIn, GitHub, etc.)
class InteractiveElement extends FloatingElement {
    constructor(type, x, y) {
        super('🔗', x, y, 'medium'); // Placeholder emoji
        this.isInteractive = true;
        this.type = type;
        this.maxSpeed = 1.5; // Much slower movement
        this.mass = 10; // Heavy so it affects others more
        this.radius = 30; // Larger radius for more influence
        this.angle = Math.random() * Math.PI * 2; // For smooth circular-ish movement
        this.speedMultiplier = 0.3; // Very slow movement
        
        // Orbiting state
        this.isOrbiting = false;
        this.orbitTarget = { x: 0, y: 0 };
        this.orbitRadius = 80 + Math.random() * 40; // Random orbit radius between 80-120px
        this.orbitSpeed = 0.02 + Math.random() * 0.01; // Random orbit speed
        this.orbitAngle = Math.random() * Math.PI * 2; // Random starting orbit position
        this.originalPosition = { x: this.x, y: this.y };
        this.moveToOrbitSpeed = 0.1; // Speed when moving to orbit position
        this.orbitCenterLocked = false; // Whether orbit center is locked in place
        
        // Override the createElement based on type
        this.createInteractiveElement();
    }
    
    createInteractiveElement() {
        // Remove the default element first
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = document.createElement('div');
        this.element.className = 'floating-element interactive-element medium';
        
        // Set content and styling based on type
        const config = this.getTypeConfig();
        this.element.innerHTML = config.content;
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        this.element.style.position = 'absolute';
        this.element.style.cursor = 'pointer';
        this.element.style.pointerEvents = 'auto';
        this.element.style.fontSize = '2.5rem';
        this.element.style.filter = config.filter;
        this.element.style.transition = 'transform 0.1s ease-out, filter 0.3s ease';
        this.element.style.zIndex = '1001';
        
        // Add hover effect
        this.element.addEventListener('mouseenter', () => {
            this.element.style.transform = 'scale(1.2)';
            this.element.style.filter = config.hoverFilter;
        });
        
        this.element.addEventListener('mouseleave', () => {
            this.element.style.transform = 'scale(1)';
            this.element.style.filter = config.filter;
        });
        
        // Add click handler
        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (this.type === 'submit_score') {
                this.handleSubmitScore();
            } else {
                window.open(config.url, '_blank');
            }
            
            // Add click effect
            this.element.style.transform = 'scale(1.5)';
            this.element.style.filter = config.clickFilter;
            
            setTimeout(() => {
                this.element.style.filter = config.filter;
            }, 200);
        });
        
        const container = document.getElementById('floatingContainer');
        if (container) {
            container.appendChild(this.element);
        } else {
            console.error('floatingContainer not found for interactive element!');
        }
    }
    
    getTypeConfig() {
        const configs = {
            linkedin: {
                content: '<span style="font-family: Arial, sans-serif; font-weight: bold; color: white; background: #0077B5; padding: 0.2em 0.3em; border-radius: 0.1em; font-size: 0.8em;">in</span>',
                filter: 'drop-shadow(0 0 10px rgba(0, 119, 181, 0.6))',
                hoverFilter: 'drop-shadow(0 0 15px rgba(0, 119, 181, 0.8))',
                clickFilter: 'drop-shadow(0 0 20px rgba(0, 119, 181, 1))',
                url: 'https://www.linkedin.com/in/alexstraughan/'
            },
            github: {
                content: '<span style="font-family: Arial, sans-serif; font-weight: bold; color: white; background: #333; padding: 0.4em; border-radius: 0.1em; font-size: 0.8em; display: inline-flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></span>',
                filter: 'drop-shadow(0 0 10px rgba(51, 51, 51, 0.6))',
                hoverFilter: 'drop-shadow(0 0 15px rgba(51, 51, 51, 0.8))',
                clickFilter: 'drop-shadow(0 0 20px rgba(51, 51, 51, 1))',
                url: 'https://github.com/alexstraughan'
            },
            email: {
                content: '<span style="font-family: Arial, sans-serif; font-weight: bold; color: white; background: #D44638; padding: 0.2em 0.3em; border-radius: 0.1em; font-size: 0.8em;">@</span>',
                filter: 'drop-shadow(0 0 10px rgba(212, 70, 56, 0.6))',
                hoverFilter: 'drop-shadow(0 0 15px rgba(212, 70, 56, 0.8))',
                clickFilter: 'drop-shadow(0 0 20px rgba(212, 70, 56, 1))',
                url: 'mailto:alexstraughan.dev@gmail.com'
            },
            twitter: {
                content: '<span style="font-family: Arial, sans-serif; font-weight: bold; color: white; background: #1DA1F2; padding: 0.2em 0.3em; border-radius: 0.1em; font-size: 0.8em;">X</span>',
                filter: 'drop-shadow(0 0 10px rgba(29, 161, 242, 0.6))',
                hoverFilter: 'drop-shadow(0 0 15px rgba(29, 161, 242, 0.8))',
                clickFilter: 'drop-shadow(0 0 20px rgba(29, 161, 242, 1))',
                url: 'https://twitter.com/alexstraughan'
            },
            portfolio: {
                content: '<span style="font-family: Arial, sans-serif; font-weight: bold; color: white; background: #6366f1; padding: 0.2em 0.3em; border-radius: 0.1em; font-size: 0.8em;">💼</span>',
                filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.6))',
                hoverFilter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.8))',
                clickFilter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 1))',
                url: 'https://straughan.dev'
            },
            submit_score: {
                content: this.getSubmitScoreContent(),
                filter: this.getSubmitScoreFilter(),
                hoverFilter: this.getSubmitScoreHoverFilter(),
                clickFilter: this.getSubmitScoreClickFilter(),
                url: '#'
            }
        };
        
        return configs[this.type] || configs.linkedin;
    }

    getSubmitScoreContent() {
        const playerName = localStorage.getItem('playerName');
        const scoreSubmitted = localStorage.getItem('scoreSubmitted') === 'true';
        
        if (scoreSubmitted && playerName) {
            // Show player name with a different style
            return `<span style="font-family: Arial, sans-serif; font-weight: bold; color: white; background: #10b981; padding: 0.2em 0.3em; border-radius: 0.1em; font-size: 0.7em; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block;">👤 ${playerName}</span>`;
        } else {
            // Show submit score button
            return '<span style="font-family: Arial, sans-serif; font-weight: bold; color: white; background: #4facfe; padding: 0.2em 0.3em; border-radius: 0.1em; font-size: 0.8em;">🏆</span>';
        }
    }

    getSubmitScoreFilter() {
        const scoreSubmitted = localStorage.getItem('scoreSubmitted') === 'true';
        return scoreSubmitted 
            ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))'
            : 'drop-shadow(0 0 10px rgba(79, 172, 254, 0.6))';
    }

    getSubmitScoreHoverFilter() {
        const scoreSubmitted = localStorage.getItem('scoreSubmitted') === 'true';
        return scoreSubmitted 
            ? 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.8))'
            : 'drop-shadow(0 0 15px rgba(79, 172, 254, 0.8))';
    }

    getSubmitScoreClickFilter() {
        const scoreSubmitted = localStorage.getItem('scoreSubmitted') === 'true';
        return scoreSubmitted 
            ? 'drop-shadow(0 0 20px rgba(16, 185, 129, 1))'
            : 'drop-shadow(0 0 20px rgba(79, 172, 254, 1))';
    }
    
    async handleSubmitScore() {
        let playerName = localStorage.getItem('playerName');
        let scoreSubmitted = localStorage.getItem('scoreSubmitted') === 'true';
        
        // If already submitted, show info message instead
        if (scoreSubmitted && playerName) {
            alert(`Score tracking is active for ${playerName}. Your high score is automatically updated every 5 minutes!`);
            return;
        }
        
        if (!playerName) {
            playerName = prompt('Enter your name for the leaderboard:');
            if (!playerName || playerName.trim().length < 1) return;
            localStorage.setItem('playerName', playerName);
        }
        
        // Get score from game state
        let score = 0;
        if (window.game && window.game.state) {
            score = Math.floor(window.game.state.totalPointsEarned || window.game.state.points || 0);
        }
        
        if (score <= 0) {
            alert('You need to earn some points first!');
            return;
        }
        
        // Submit to backend
        try {
            await fetch('/api/submit_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: playerName, score: score })
            });
            
            if (!scoreSubmitted) {
                localStorage.setItem('scoreSubmitted', 'true');
                this.startPeriodicScoreUpdate(playerName);
                // Update the element appearance
                this.updateSubmitScoreElement();
            }
            
            alert('Score submitted! You are now being tracked automatically every 5 minutes.');
        } catch (err) {
            alert('Failed to submit score.');
        }
    }
    
    updateSubmitScoreElement() {
        if (this.type === 'submit_score') {
            const config = this.getTypeConfig();
            this.element.innerHTML = config.content;
            this.element.style.filter = config.filter;
        }
    }
    
    startPeriodicScoreUpdate(playerName) {
        setInterval(async () => {
            if (!playerName) return;
            let score = 0;
            if (window.game && window.game.state) {
                score = Math.floor(window.game.state.totalPointsEarned || window.game.state.points || 0);
            }
            if (score <= 0) return;
            
            try {
                await fetch('/api/submit_score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: playerName, score: score })
                });
            } catch (err) {
                // Silent fail
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    startOrbiting(targetX, targetY) {
        this.isOrbiting = true;
        this.orbitTarget.x = targetX;
        this.orbitTarget.y = targetY;
        this.originalPosition.x = this.x;
        this.originalPosition.y = this.y;
        this.orbitCenterLocked = false; // Allow following mouse initially
    }
    
    lockOrbitCenter() {
        this.orbitCenterLocked = true; // Lock orbit center when mouse is released
    }
    
    stopOrbiting() {
        this.isOrbiting = false;
        this.orbitCenterLocked = false;
    }
    
    update(mouseX, mouseY, otherElements) {
        if (this.isOrbiting) {
            // Calculate distance to orbit target
            const dx = this.orbitTarget.x - this.x;
            const dy = this.orbitTarget.y - this.y;
            const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
            
            // If far from orbit center, move towards it
            if (distanceToTarget > this.orbitRadius + 20) {
                this.x += dx * this.moveToOrbitSpeed;
                this.y += dy * this.moveToOrbitSpeed;
            } else {
                // Orbit around the target
                this.orbitAngle += this.orbitSpeed;
                const orbitX = this.orbitTarget.x + Math.cos(this.orbitAngle) * this.orbitRadius;
                const orbitY = this.orbitTarget.y + Math.sin(this.orbitAngle) * this.orbitRadius;
                
                // Smoothly move to orbit position
                this.x += (orbitX - this.x) * 0.1;
                this.y += (orbitY - this.y) * 0.1;
            }
        } else {
            // Normal floating behavior when not orbiting
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
        }
        
        // Affect other elements (push them away) but don't be affected by them
        for (let i = 0; i < otherElements.length; i++) {
            const other = otherElements[i];
            if (other === this || other.isInteractive) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distanceSquared = dx * dx + dy * dy;
            const minDistance = this.radius + other.radius;
            const influenceDistanceSquared = (minDistance * 1.5) * (minDistance * 1.5);
            
            if (distanceSquared < influenceDistanceSquared && distanceSquared > 0) {
                // Push other elements away
                const distance = Math.sqrt(distanceSquared);
                const force = 2; // Stronger force
                const normalX = dx / distance;
                const normalY = dy / distance;
                
                other.vx -= normalX * force;
                other.vy -= normalY * force;
            }
        }
        
        // Batch DOM updates - only update if position changed significantly
        const deltaX = Math.abs(this.x - (this.lastX || this.x));
        const deltaY = Math.abs(this.y - (this.lastY || this.y));
        
        // Force update on first frame or if position changed significantly
        if (!this.lastX || !this.lastY || deltaX > 0.5 || deltaY > 0.5) {
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
            this.lastX = this.x;
            this.lastY = this.y;
        }
    }
}

// Legacy LinkedIn class for backward compatibility
class LinkedInElement extends InteractiveElement {
    constructor(x, y) {
        super('linkedin', x, y);
        this.isLinkedIn = true; // Keep for backward compatibility
    }
}

// Export for use in other modules
window.InteractiveElement = InteractiveElement;
window.LinkedInElement = LinkedInElement;
