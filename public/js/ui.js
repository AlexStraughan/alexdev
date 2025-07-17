// UI Manager for handling UI interactions and display
class UI {
    constructor() {
        console.log('UI class initialized');
        // This will be initialized when needed
    }

    // Create floating number effect with variety
    createFloatingNumber(text, color) {
        const floatingNum = document.createElement('div');
        floatingNum.textContent = text;
        floatingNum.style.position = 'fixed';
        floatingNum.style.color = color;
        floatingNum.style.fontSize = '1.5rem';
        floatingNum.style.fontWeight = 'bold';
        floatingNum.style.pointerEvents = 'none';
        floatingNum.style.zIndex = '1000';
        floatingNum.style.textShadow = '0 0 10px rgba(79, 172, 254, 0.5)';
        
        const greetingCard = document.getElementById('greetingCard');
        const rect = greetingCard.getBoundingClientRect();
        
        // Add variety to starting position
        const randomX = (Math.random() - 0.5) * 100; // ±50px horizontal spread
        floatingNum.style.left = (rect.left + rect.width / 2 + randomX) + 'px';
        floatingNum.style.top = (rect.top + rect.height / 2) + 'px';
        
        document.body.appendChild(floatingNum);
        
        // Animate the floating number with variety
        let y = 0;
        let x = (Math.random() - 0.5) * 60; // Random horizontal drift ±30px
        let opacity = 1;
        const driftSpeed = (Math.random() - 0.5) * 0.8; // Random horizontal drift speed
        
        const animate = () => {
            y -= 2 + Math.random() * 1; // Slightly variable upward speed
            x += driftSpeed;
            opacity -= 0.015 + Math.random() * 0.01; // Slightly variable fade speed
            
            floatingNum.style.transform = `translate(${x}px, ${y}px)`;
            floatingNum.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(floatingNum);
            }
        };
        requestAnimationFrame(animate);
    }

    // Reveal the game hub with animation
    revealGameHub() {
        const gameHubSection = document.getElementById('gameHubSection');
        const cpsDisplay = document.getElementById('cpsDisplay');
        const clickHint = document.getElementById('clickHint');
        
        // Update the hint text
        clickHint.textContent = "Welcome to your coding empire!";
        
        // Show CPS display
        cpsDisplay.style.display = 'block';
        cpsDisplay.style.animation = 'fadeInUp 0.5s ease-out';
        
        // Show game hub with animation
        gameHubSection.style.display = 'block';
        gameHubSection.classList.add('revealed');
        
        // Show milestone celebration
        window.effects.showMilestone("Development Hub Unlocked! 🏭");
        
        // Add screen shake for emphasis - now safe with improved targeting
        window.effects.addScreenShake();
    }

    // Show achievement popup
    showAchievement(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div>🏆 Achievement Unlocked!</div>
            <div><strong>${achievement.name}</strong></div>
            <div style="font-size: 0.9rem; opacity: 0.9;">${achievement.description}</div>
        `;
        
        document.body.appendChild(popup);
        
        // Show animation
        setTimeout(() => popup.classList.add('show'), 100);
        
        // Hide after 4 seconds
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => document.body.removeChild(popup), 500);
        }, 4000);
    }

    // Initialize page fade-in effect
    initializePageFadeIn() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease-in';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    }
}

// Tab switching function (global function for onclick handlers)
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const tabButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    const tabContent = document.getElementById(tabName);
    
    if (tabButton) tabButton.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

// Make switchTab globally available immediately
window.switchTab = switchTab;

// Export the UI class
window.UI = UI;
