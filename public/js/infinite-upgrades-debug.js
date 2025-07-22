// Infinite Upgrades Debugging Console Tool
// Use this in browser console to debug infinite upgrades issues

window.debugInfiniteUpgrades = function() {
    console.group('🔧 INFINITE UPGRADES DEBUG REPORT');
    
    if (!window.game) {
        console.error('❌ Game instance not found! Make sure the game has loaded.');
        console.groupEnd();
        return;
    }
    
    const game = window.game;
    
    // 1. Check game state
    console.group('📊 GAME STATE');
    console.log('Total Points:', game.state.points);
    console.log('Infinite Upgrades State:', game.state.infiniteUpgrades);
    console.log('Regular Upgrades State:', game.state.upgrades);
    console.groupEnd();
    
    // 2. Analyze infinite upgrades
    console.group('⚡ INFINITE UPGRADES ANALYSIS');
    const infiniteUpgrades = game.upgradeData.filter(u => u.isInfinite);
    console.log(`Total infinite upgrades defined: ${infiniteUpgrades.length}`);
    
    infiniteUpgrades.forEach((upgrade, index) => {
        const currentLevel = game.state.infiniteUpgrades[upgrade.id] || 0;
        const cost = game.getInfiniteUpgradeCost(upgrade, currentLevel);
        const affordable = game.state.points >= cost;
        const unlocked = game.checkUnlockCondition(upgrade.unlockCondition);
        
        console.log(`${index + 1}. ${upgrade.name} (${upgrade.id}):`);
        console.log('   • Level:', currentLevel);
        console.log('   • Cost:', cost.toLocaleString());
        console.log('   • Base Cost:', upgrade.baseCost.toLocaleString());
        console.log('   • Affordable:', affordable);
        console.log('   • Unlocked:', unlocked);
        console.log('   • Category:', upgrade.category);
        console.log('   • Effect:', upgrade.effect);
        console.log('   • Unlock Condition:', upgrade.unlockCondition);
        console.log('   ---');
    });
    console.groupEnd();
    
    // 3. Check unlock conditions
    console.group('🔓 UNLOCK CONDITIONS');
    infiniteUpgrades.forEach(upgrade => {
        const unlocked = game.checkUnlockCondition(upgrade.unlockCondition);
        const condition = upgrade.unlockCondition;
        
        if (!unlocked) {
            console.log(`❌ ${upgrade.name} is LOCKED:`);
            if (condition.type === 'upgrade_owned') {
                const requiredUpgrade = condition.upgrade;
                const hasRequired = game.state.upgrades[requiredUpgrade];
                console.log(`   Needs upgrade: ${requiredUpgrade} (owned: ${hasRequired})`);
            } else if (condition.type === 'generator_count') {
                const requiredCount = condition.count;
                const currentCount = game.state.generators[condition.generator] || 0;
                console.log(`   Needs ${requiredCount} ${condition.generator} (have: ${currentCount})`);
            }
        } else {
            console.log(`✅ ${upgrade.name} is unlocked`);
        }
    });
    console.groupEnd();
    
    // 4. Check UI rendering
    console.group('🎨 UI RENDERING');
    const upgradesGrid = document.getElementById('upgradesGrid');
    if (upgradesGrid) {
        const allCards = upgradesGrid.querySelectorAll('.skill-card[data-upgrade-id]');
        const infiniteCards = Array.from(allCards).filter(card => {
            const upgradeId = card.getAttribute('data-upgrade-id');
            const upgrade = game.upgradeData.find(u => u.id === upgradeId);
            return upgrade && upgrade.isInfinite;
        });
        
        console.log('Total upgrade cards in DOM:', allCards.length);
        console.log('Infinite upgrade cards in DOM:', infiniteCards.length);
        console.log('Infinite cards:', infiniteCards.map(card => ({
            id: card.getAttribute('data-upgrade-id'),
            visible: card.style.display !== 'none',
            affordable: card.classList.contains('affordable')
        })));
    } else {
        console.error('❌ upgradesGrid not found in DOM');
    }
    console.groupEnd();
    
    // 5. Test cost calculations
    console.group('💰 COST CALCULATIONS TEST');
    const testUpgrade = infiniteUpgrades[0];
    if (testUpgrade) {
        console.log(`Testing costs for ${testUpgrade.name}:`);
        for (let level = 0; level <= 5; level++) {
            const cost = game.getInfiniteUpgradeCost(testUpgrade, level);
            console.log(`Level ${level}: ${cost.toLocaleString()} pts`);
        }
    }
    console.groupEnd();
    
    // 6. Recommendations
    console.group('💡 RECOMMENDATIONS');
    const unlockedInfinites = infiniteUpgrades.filter(u => game.checkUnlockCondition(u.unlockCondition));
    const affordableInfinites = unlockedInfinites.filter(u => {
        const level = game.state.infiniteUpgrades[u.id] || 0;
        const cost = game.getInfiniteUpgradeCost(u, level);
        return game.state.points >= cost;
    });
    
    if (unlockedInfinites.length === 0) {
        console.log('🎯 No infinite upgrades are unlocked yet.');
        console.log('   • Buy more regular upgrades to unlock infinite ones');
        console.log('   • Focus on getting more generators first');
    } else if (affordableInfinites.length === 0) {
        console.log('🎯 Infinite upgrades are unlocked but not affordable.');
        console.log('   • Keep clicking and earning points');
        const cheapest = unlockedInfinites.reduce((min, u) => {
            const level = game.state.infiniteUpgrades[u.id] || 0;
            const cost = game.getInfiniteUpgradeCost(u, level);
            return cost < min.cost ? { upgrade: u, cost } : min;
        }, { cost: Infinity });
        console.log(`   • Next affordable: ${cheapest.upgrade.name} for ${cheapest.cost.toLocaleString()} pts`);
        console.log(`   • Need ${(cheapest.cost - game.state.points).toLocaleString()} more points`);
    } else {
        console.log('✅ You can buy these infinite upgrades:');
        affordableInfinites.forEach(u => {
            const level = game.state.infiniteUpgrades[u.id] || 0;
            const cost = game.getInfiniteUpgradeCost(u, level);
            console.log(`   • ${u.name} Level ${level + 1} for ${cost.toLocaleString()} pts`);
        });
    }
    console.groupEnd();
    
    console.log('🔧 Debug complete! Use window.game to interact with the game state.');
    console.groupEnd();
};

// Quick fix for common infinite upgrade issues
window.fixInfiniteUpgrades = function() {
    console.log('🔧 Attempting to fix infinite upgrades...');
    
    if (!window.game) {
        console.error('Game not found!');
        return;
    }
    
    // Ensure infinite upgrades object exists
    if (!window.game.state.infiniteUpgrades) {
        window.game.state.infiniteUpgrades = {};
        console.log('✅ Created infiniteUpgrades object');
    }
    
    // Force re-render
    window.game.renderUpgrades();
    console.log('✅ Forced upgrade re-render');
    
    // Refresh infinite upgrades manager
    if (window.infiniteUpgradesManager) {
        window.infiniteUpgradesManager.forceRefresh();
        console.log('✅ Refreshed infinite upgrades manager');
    }
    
    console.log('🎯 Try running debugInfiniteUpgrades() to see if issues are resolved');
};

// Auto-run a quick check when this script loads
setTimeout(() => {
    if (window.game && document.getElementById('upgradesGrid')) {
        console.log('%c🚀 Infinite upgrades debugging tools loaded!', 'color: #4facfe; font-weight: bold;');
        console.log('%cAvailable commands:', 'color: #666; font-size: 12px;');
        console.log('%c  • debugInfiniteUpgrades() - Full diagnostic', 'color: #888; font-size: 11px;');
        console.log('%c  • fixInfiniteUpgrades() - Quick fixes', 'color: #888; font-size: 11px;');
        console.log('%c  • Ctrl+Shift+I - Toggle debug mode in manager', 'color: #888; font-size: 11px;');
        
        // Quick status (only show if there are issues)
        const infiniteCount = window.game.upgradeData.filter(u => u.isInfinite).length;
        const unlockedCount = window.game.upgradeData.filter(u => 
            u.isInfinite && window.game.checkUnlockCondition(u.unlockCondition)
        ).length;
        
        if (unlockedCount < infiniteCount) {
            console.log(`%c📊 Status: ${unlockedCount}/${infiniteCount} infinite upgrades unlocked`, 'color: #ff6b6b; font-size: 11px;');
        }
    }
}, 2000);

console.log('🔧 Infinite Upgrades Debug Tools loaded!');
