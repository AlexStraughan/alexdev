// Visual Effects Manager
class Effects {
    constructor() {
        this.addShakeCSS();
    }

    // Add shake animation to CSS
    addShakeCSS() {
        const shakeCSS = `
            @keyframes shake {
                0%, 100% { transform: translate(0, 0); }
                10% { transform: translate(-2px, -1px); }
                20% { transform: translate(2px, 1px); }
                30% { transform: translate(-1px, 2px); }
                40% { transform: translate(1px, -2px); }
                50% { transform: translate(-2px, 1px); }
                60% { transform: translate(2px, -1px); }
                70% { transform: translate(-1px, -2px); }
                80% { transform: translate(1px, 2px); }
                90% { transform: translate(-2px, -1px); }
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = shakeCSS;
        document.head.appendChild(style);
    }

    // Screen shake effect - only affects non-fixed elements
    addScreenShake() {
        // Instead of shaking the entire container, shake specific elements that aren't critical UI
        const shakableElements = document.querySelectorAll('#floatingContainer, .game-hub:not(.greeting-card)');
        
        shakableElements.forEach(element => {
            if (!element) return;
            
            // Force remove any existing animation
            element.style.animation = 'none';
            element.style.transform = 'translate(0, 0)';
            
            // Force a reflow to ensure the reset takes effect
            element.offsetHeight;
            
            setTimeout(() => {
                element.style.animation = 'shake 0.3s ease-in-out';
            }, 10);
            
            setTimeout(() => {
                element.style.animation = 'none';
                element.style.transform = 'translate(0, 0)';
                // Force another reflow to ensure the reset takes effect
                element.offsetHeight;
                
                // Additional safety: remove any transform that might be lingering
                setTimeout(() => {
                    element.style.removeProperty('transform');
                    element.style.removeProperty('animation');
                }, 50);
            }, 300);
        });
        
        // If no specific elements found, create a subtle background shake effect
        if (shakableElements.length === 0) {
            const body = document.body;
            body.style.animation = 'none';
            body.style.transform = 'translate(0, 0)';
            
            setTimeout(() => {
                body.style.animation = 'shake 0.2s ease-in-out';
            }, 10);
            
            setTimeout(() => {
                body.style.animation = 'none';
                body.style.transform = 'translate(0, 0)';
                body.style.removeProperty('transform');
                body.style.removeProperty('animation');
            }, 200);
        }
    }

    // Purchase effect
    createPurchaseEffect(icon) {
        const effect = document.createElement('div');
        effect.textContent = icon;
        effect.style.position = 'fixed';
        effect.style.fontSize = '3rem';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1000';
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(effect);
        
        let scale = 0.5;
        let rotation = 0;
        let opacity = 1;
        const animate = () => {
            scale += 0.1;
            rotation += 20;
            opacity -= 0.05;
            effect.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
            effect.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(effect);
            }
        };
        requestAnimationFrame(animate);
    }

    // Click particles
    createClickParticles() {
        const colors = ['#4facfe', '#00f2fe', '#ffffff'];
        const particles = 8;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '999';
            
            const greetingCard = document.getElementById('greetingCard');
            const rect = greetingCard.getBoundingClientRect();
            particle.style.left = (rect.left + rect.width / 2) + 'px';
            particle.style.top = (rect.top + rect.height / 2) + 'px';
            
            document.body.appendChild(particle);
            
            const angle = (Math.PI * 2 * i) / particles;
            const velocity = 5 + Math.random() * 3;
            let x = 0;
            let y = 0;
            let opacity = 1;
            
            const animate = () => {
                x += Math.cos(angle) * velocity;
                y += Math.sin(angle) * velocity;
                opacity -= 0.05;
                
                particle.style.transform = `translate(${x}px, ${y}px)`;
                particle.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    document.body.removeChild(particle);
                }
            };
            requestAnimationFrame(animate);
        }
    }

    // Milestone celebration
    showMilestone(text) {
        const milestone = document.createElement('div');
        milestone.className = 'milestone-effect';
        milestone.textContent = text;
        document.body.appendChild(milestone);
        
        let scale = 0;
        let opacity = 1;
        const animate = () => {
            scale += 0.05;
            opacity -= 0.02;
            milestone.style.transform = `translate(-50%, -50%) scale(${scale})`;
            milestone.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(milestone);
            }
        };
        requestAnimationFrame(animate);
    }
}

// Export the Effects class
window.Effects = Effects;
