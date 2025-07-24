// Client-side encryption helper for secure WebSocket communication
class GameEncryption {
    constructor() {
        this.secureToken = null;
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
        this.lastSaveTime = 0;
        this.saveAttempts = 0;
        this.maxSaveAttempts = 10; // Per minute
    }

    // Set the secure token received from server
    setSecureToken(token) {
        this.secureToken = token;
        localStorage.setItem('gameSecureToken', token);
        console.log('🔒 Secure token updated');
    }

    // Get stored secure token
    getSecureToken() {
        if (!this.secureToken) {
            this.secureToken = localStorage.getItem('gameSecureToken');
        }
        return this.secureToken;
    }

    // Check client-side rate limiting
    checkRateLimit() {
        const now = Date.now();
        const oneMinute = 60 * 1000;
        
        // Reset counter if more than a minute has passed
        if (now - this.lastSaveTime > oneMinute) {
            this.saveAttempts = 0;
        }
        
        if (this.saveAttempts >= this.maxSaveAttempts) {
            console.warn('🚫 Client-side rate limit exceeded. Please wait before saving again.');
            return false;
        }
        
        this.saveAttempts++;
        this.lastSaveTime = now;
        return true;
    }

    // Enhanced client-side encryption using Web Crypto API
    async encryptGameData(data) {
        try {
            // Add client-side validation
            if (!this.validateDataBeforeEncryption(data)) {
                console.error('🚫 Data validation failed before encryption');
                return null;
            }
            
            // Convert data to JSON string
            const jsonString = JSON.stringify(data);
            const dataBuffer = this.encoder.encode(jsonString);

            // Generate a random key for this session
            const key = await window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256,
                },
                true,
                ["encrypt", "decrypt"]
            );

            // Generate random IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Encrypt the data
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                key,
                dataBuffer
            );

            // Export the key
            const exportedKey = await window.crypto.subtle.exportKey("raw", key);

            // Combine key, IV, and encrypted data
            const combined = new Uint8Array(exportedKey.byteLength + iv.length + encrypted.byteLength);
            combined.set(new Uint8Array(exportedKey), 0);
            combined.set(iv, exportedKey.byteLength);
            combined.set(new Uint8Array(encrypted), exportedKey.byteLength + iv.length);

            // Return base64 encoded result
            return btoa(String.fromCharCode.apply(null, combined));
        } catch (error) {
            console.error('🚫 Client encryption failed:', error);
            return null;
        }
    }

    // Validate data before encryption
    validateDataBeforeEncryption(data) {
        // Check for reasonable values
        const points = data.points || 0;
        const totalEarned = data.total_points_earned || 0;
        const totalClicks = data.total_clicks || 0;

        // Basic sanity checks (no arbitrary caps)
        if (points < 0 || totalEarned < 0 || totalClicks < 0) {
            console.error('🚫 Negative values detected');
            return false;
        }

        // Check for NaN or Infinity
        if (!isFinite(points) || !isFinite(totalEarned) || !isFinite(totalClicks)) {
            console.error('🚫 Invalid numeric values detected');
            return false;
        }

        // Check generators for reasonable counts (increased limit)
        const generators = data.generators || {};
        for (const [type, count] of Object.entries(generators)) {
            if (count < 0 || !isFinite(count) || count > 100000) { // Much higher limit
                console.error(`🚫 Invalid generator count: ${type} = ${count}`);
                return false;
            }
        }

        // Basic ratio check (warning only)
        if (totalClicks > 0 && totalEarned / totalClicks < 0.1) {
            console.warn('⚠️ Unusual click-to-point ratio detected');
        }

        return true;
    }

    // Enhanced integrity hash for critical game data
    async createIntegrityHash(data) {
        try {
            // Extract critical fields that shouldn't be tampered with
            const criticalData = {
                points: data.points,
                total_points_earned: data.total_points_earned,
                total_clicks: data.total_clicks,
                generators: data.generators,
                timestamp: Date.now(),
                // Add client fingerprint for additional security
                clientFingerprint: this.getClientFingerprint()
            };

            const jsonString = JSON.stringify(criticalData);
            const dataBuffer = this.encoder.encode(jsonString);

            // Create SHA-256 hash
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = new Uint8Array(hashBuffer);
            
            // Convert to hex string
            return Array.from(hashArray)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            console.error('🚫 Integrity hash creation failed:', error);
            return null;
        }
    }

    // Generate a simple client fingerprint
    getClientFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Client fingerprint', 2, 2);
        
        return canvas.toDataURL().slice(-50); // Last 50 chars as fingerprint
    }

    // Create message signature for anti-tampering
    async createMessageSignature(messageData) {
        try {
            const token = this.getSecureToken();
            if (!token) return null;

            const signatureData = {
                message: messageData,
                token: token,
                timestamp: Date.now()
            };

            const jsonString = JSON.stringify(signatureData);
            const dataBuffer = this.encoder.encode(jsonString);
            
            // Create hash for signature
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = new Uint8Array(hashBuffer);
            
            return Array.from(hashArray)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            console.error('🚫 Message signature creation failed:', error);
            return null;
        }
    }

    // Enhanced validation of game state changes
    validateGameState(oldState, newState) {
        if (!oldState) return true; // First save is always valid

        // Check that totals don't decrease inappropriately
        if ((newState.total_points_earned || 0) < (oldState.total_points_earned || 0)) {
            console.warn('🚫 Total points earned decreased');
            return false;
        }

        if ((newState.total_clicks || 0) < (oldState.total_clicks || 0)) {
            console.warn('🚫 Total clicks decreased');
            return false;
        }

        // Check for reasonable point increases
        const oldPoints = oldState.points || 0;
        const newPoints = newState.points || 0;
        const pointsGained = newPoints - oldPoints;

        // Allow reasonable increases based on time elapsed and generators
        const timeElapsed = Math.max(1, (Date.now() - (oldState.lastSaveTime || Date.now())) / 1000);
        const generators = newState.generators || {};
        
        // Calculate theoretical maximum income (more conservative than server)
        let maxGeneratorIncome = 0;
        Object.entries(generators).forEach(([type, count]) => {
            switch (type) {
                case 'junior_dev':
                    maxGeneratorIncome += count * 1;
                    break;
                case 'senior_dev':
                    maxGeneratorIncome += count * 5;
                    break;
                case 'code_monkey':
                    maxGeneratorIncome += count * 15;
                    break;
                case 'ai_assistant':
                    maxGeneratorIncome += count * 50;
                    break;
                case 'neural_network':
                    maxGeneratorIncome += count * 200;
                    break;
                case 'quantum_computer':
                    maxGeneratorIncome += count * 1000;
                    break;
                case 'blockchain_miner':
                    maxGeneratorIncome += count * 5000;
                    break;
                case 'time_machine':
                    maxGeneratorIncome += count * 25000;
                    break;
                case 'multiverse_compiler':
                    maxGeneratorIncome += count * 100000;
                    break;
                case 'god_algorithm':
                    maxGeneratorIncome += count * 500000;
                    break;
                case 'code_singularity':
                    maxGeneratorIncome += count * 2500000;
                    break;
            }
        });

        // Client-side is more conservative than server
        const maxTheoreticalGain = (maxGeneratorIncome * timeElapsed) + ((newState.click_power || 1) * 3 * timeElapsed);
        
        if (pointsGained > maxTheoreticalGain * 1.5 && pointsGained > 50) { // Allow small gains
            console.warn('🚫 Suspicious point gain detected on client:', pointsGained, 'vs max:', maxTheoreticalGain);
            return false;
        }

        // Check generator purchase validity
        if (!this.validateGeneratorPurchases(oldState, newState)) {
            return false;
        }

        return true;
    }

    // Validate generator purchases make sense
    validateGeneratorPurchases(oldState, newState) {
        const oldGenerators = oldState.generators || {};
        const newGenerators = newState.generators || {};
        
        let totalCost = 0;
        
        for (const [type, newCount] of Object.entries(newGenerators)) {
            const oldCount = oldGenerators[type] || 0;
            const purchased = newCount - oldCount;
            
            if (purchased < 0) {
                console.warn(`🚫 Generator count decreased: ${type}`);
                return false;
            }
            
            if (purchased > 0) {
                totalCost += purchased * this.getGeneratorBaseCost(type);
            }
        }
        
        // Check if purchases were affordable
        const oldPoints = oldState.points || 0;
        if (totalCost > oldPoints * 1.1 && totalCost > 100) { // 10% buffer
            console.warn('🚫 Unaffordable purchases detected:', totalCost, 'vs', oldPoints);
            return false;
        }
        
        return true;
    }

    // Get base cost for generators (should match server)
    getGeneratorBaseCost(type) {
        const costs = {
            'junior_dev': 10,
            'senior_dev': 100,
            'code_monkey': 500,
            'ai_assistant': 2500,
            'neural_network': 12500,
            'quantum_computer': 62500,
            'blockchain_miner': 312500,
            'time_machine': 1562500,
            'multiverse_compiler': 7812500,
            'god_algorithm': 39062500,
            'code_singularity': 195312500
        };
        return costs[type] || 1000;
    }

    // Add timestamp to game state for validation
    addTimestamp(gameState) {
        return {
            ...gameState,
            lastSaveTime: Date.now()
        };
    }
}

// Global instance
window.gameEncryption = new GameEncryption();
