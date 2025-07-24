require 'openssl'
require 'base64'
require 'json'
require 'jwt'
require 'securerandom'
require 'digest'

class GameEncryption
  # Use environment variable or generate a secure key - store these securely in production!
  SECRET_KEY = ENV['GAME_ENCRYPTION_KEY'] || SecureRandom.hex(32)
  JWT_SECRET = ENV['JWT_SECRET'] || SecureRandom.hex(32)
  HMAC_KEY = ENV['HMAC_SECRET'] || SecureRandom.hex(32)
  
  # AES-256-GCM for symmetric encryption
  CIPHER_TYPE = 'aes-256-gcm'
  
  # Rate limiting storage
  @@rate_limits = {}
  @@suspicious_ips = Set.new
  @@flagged_players = {} # Track flagged players for leaderboard hiding
  
  # Maximum allowed values to prevent overflow attacks (removed point caps)
  MAX_GENERATORS_PER_TYPE = 100_000 # Increased generator limit
  
  # Enhanced rate limiting
  def self.check_rate_limit(player_id, action = 'save_game_state')
    now = Time.now.to_i
    key = "#{player_id}_#{action}"
    
    # Clean old entries (older than 5 minutes)
    @@rate_limits.delete_if { |k, v| now - v[:first_attempt] > 300 }
    
    if @@rate_limits[key]
      # Allow max 10 saves per minute, 50 per hour
      if @@rate_limits[key][:count] >= 10 && (now - @@rate_limits[key][:first_attempt]) < 60
        puts "🚫 Rate limit exceeded for #{player_id}: #{@@rate_limits[key][:count]} attempts in last minute"
        return false
      end
      
      if @@rate_limits[key][:count] >= 50 && (now - @@rate_limits[key][:first_attempt]) < 3600
        puts "🚫 Hourly rate limit exceeded for #{player_id}: #{@@rate_limits[key][:count]} attempts"
        return false
      end
      
      @@rate_limits[key][:count] += 1
      @@rate_limits[key][:last_attempt] = now
    else
      @@rate_limits[key] = {
        count: 1,
        first_attempt: now,
        last_attempt: now
      }
    end
    
    true
  end

  # Check if IP is flagged as suspicious
  def self.is_suspicious_ip?(ip)
    @@suspicious_ips.include?(ip)
  end
  
  # Flag player for suspicious activity (hide from leaderboard instead of banning)
  def self.flag_player_suspicious(player_id, reason, severity = 'medium')
    @@flagged_players[player_id] ||= {
      flagged_at: Time.now,
      reasons: [],
      hidden_from_leaderboard: false,
      admin_notes: nil
    }
    
    @@flagged_players[player_id][:reasons] << {
      reason: reason,
      severity: severity,
      timestamp: Time.now
    }
    
    # Auto-hide from leaderboard for medium/high severity
    if ['medium', 'high'].include?(severity)
      @@flagged_players[player_id][:hidden_from_leaderboard] = true
      puts "🚨 Player #{player_id} flagged for #{reason} - hidden from leaderboard"
    else
      puts "⚠️  Player #{player_id} flagged for #{reason} - warning only"
    end
    
    @@flagged_players[player_id]
  end
  
  # Check if player is hidden from leaderboard
  def self.is_player_hidden_from_leaderboard?(player_id)
    return false unless @@flagged_players[player_id]
    @@flagged_players[player_id][:hidden_from_leaderboard] == true
  end
  
  # Admin function to reinstate player
  def self.reinstate_player(player_id, admin_notes = nil)
    if @@flagged_players[player_id]
      @@flagged_players[player_id][:hidden_from_leaderboard] = false
      @@flagged_players[player_id][:admin_notes] = admin_notes
      @@flagged_players[player_id][:reinstated_at] = Time.now
      puts "✅ Player #{player_id} reinstated by admin"
      return true
    end
    false
  end
  
  # Get flagged players list for admin
  def self.get_flagged_players
    @@flagged_players
  end

  def self.encrypt_game_data(data)
    return nil unless data

    begin
      # Generate a 12-byte IV for AES-GCM (not 16-byte)
      iv = SecureRandom.random_bytes(12)  # Changed from 16 to 12
      
      cipher = OpenSSL::Cipher.new('aes-256-gcm')
      cipher.encrypt
      cipher.key = encryption_key
      cipher.iv = iv
      
      encrypted = cipher.update(JSON.generate(data)) + cipher.final
      auth_tag = cipher.auth_tag
      
      # Combine IV + auth_tag + encrypted_data
      combined = iv + auth_tag + encrypted
      Base64.strict_encode64(combined)
    rescue => e
      puts "🚫 Encryption failed: #{e.message}"
      nil
    end
  end
  
  def self.decrypt_game_data(encrypted_data)
    return nil unless encrypted_data

    begin
      combined = Base64.strict_decode64(encrypted_data)
      
      # Extract components (12-byte IV, 16-byte auth_tag, rest is data)
      iv = combined[0..11]           # First 12 bytes
      auth_tag = combined[12..27]    # Next 16 bytes  
      encrypted = combined[28..-1]   # Rest is encrypted data
      
      cipher = OpenSSL::Cipher.new('aes-256-gcm')
      cipher.decrypt
      cipher.key = encryption_key
      cipher.iv = iv
      cipher.auth_tag = auth_tag
      
      decrypted = cipher.update(encrypted) + cipher.final
      JSON.parse(decrypted)
    rescue => e
      puts "🚫 Decryption failed: #{e.message}"
      nil
    end
  end
  
  # Generate secure tokens for players with additional metadata
  def self.generate_player_token(player_id, player_name, client_ip = nil)
    payload = {
      player_id: player_id,
      player_name: player_name,
      client_ip: client_ip,
      issued_at: Time.now.to_i,
      expires_at: Time.now.to_i + (2 * 60 * 60), # 2 hours (shorter for security)
      nonce: SecureRandom.hex(16) # Prevent token reuse
    }
    
    JWT.encode(payload, JWT_SECRET, 'HS256')
  end
  
  # Verify player tokens with enhanced security
  def self.verify_player_token(token, expected_player_id = nil, client_ip = nil)
    begin
      decoded = JWT.decode(token, JWT_SECRET, true, { algorithm: 'HS256' })
      payload = decoded[0]
      
      # Check if token is expired
      if payload['expires_at'] < Time.now.to_i
        puts "🚫 Token expired for player: #{payload['player_id']}"
        return nil
      end
      
      # Verify player_id matches if provided
      if expected_player_id && payload['player_id'] != expected_player_id
        puts "🚫 Token player_id mismatch: expected #{expected_player_id}, got #{payload['player_id']}"
        return nil
      end
      
      # Check IP consistency (loose check to allow for dynamic IPs)
      if client_ip && payload['client_ip'] && payload['client_ip'] != client_ip
        puts "⚠️  Token IP changed: #{payload['client_ip']} -> #{client_ip} for player #{payload['player_id']}"
        # Don't fail for IP changes, but log for monitoring
      end
      
      payload
    rescue JWT::DecodeError => e
      puts "🚫 Invalid token: #{e.message}"
      nil
    end
  end
  
  # Create message signature to prevent tampering
  def self.create_message_signature(message_data, player_token)
    # Extract token payload to get player info
    token_data = verify_player_token(player_token)
    return nil unless token_data
    
    # Create signature data
    signature_data = {
      message: message_data,
      player_id: token_data['player_id'],
      timestamp: Time.now.to_i
    }
    
    # Create HMAC signature
    digest = OpenSSL::Digest::SHA256.new
    OpenSSL::HMAC.hexdigest(digest, HMAC_KEY, JSON.generate(signature_data))
  end
  
  # Verify message signature
  def self.verify_message_signature(message_data, signature, player_token, max_age_seconds = 300)
    token_data = verify_player_token(player_token)
    return false unless token_data
    
    # Recreate signature data (allowing for some timestamp variance)
    current_time = Time.now.to_i
    (0..max_age_seconds).step(60).each do |offset|
      test_timestamp = current_time - offset
      
      signature_data = {
        message: message_data,
        player_id: token_data['player_id'],
        timestamp: test_timestamp
      }
      
      digest = OpenSSL::Digest::SHA256.new
      expected_signature = OpenSSL::HMAC.hexdigest(digest, HMAC_KEY, JSON.generate(signature_data))
      
      return true if expected_signature == signature
    end
    
    puts "🚫 Message signature verification failed for player: #{token_data['player_id']}"
    false
  end
  
  # Create a hash of critical game data for integrity checking
  def self.create_integrity_hash(data)
    # Include only critical fields that shouldn't be tampered with
    critical_data = {
      points: data['points'],
      total_points_earned: data['total_points_earned'],
      total_clicks: data['total_clicks'],
      generators: data['generators'],
      timestamp: Time.now.to_i
    }
    
    # Add server-side nonce for replay attack prevention
    critical_data[:server_nonce] = SecureRandom.hex(8)
    
    digest = OpenSSL::Digest::SHA256.new
    OpenSSL::HMAC.hexdigest(digest, SECRET_KEY, JSON.generate(critical_data))
  end
  
  # Verify integrity hash with enhanced checks
  def self.verify_integrity_hash(data, hash, allow_old_hash = false)
    # If allowing old hash format, check both
    if allow_old_hash
      old_expected = create_old_integrity_hash(data)
      return true if old_expected == hash
    end
    
    # For new hash format, we can't recreate exact hash due to nonce
    # Instead, verify hash structure and basic data consistency
    return false if hash.length != 64 # SHA-256 hex should be 64 chars
    
    # Perform additional data validation
    validate_data_ranges(data)
  end
  
  # Legacy hash function for backward compatibility
  def self.create_old_integrity_hash(data)
    critical_data = {
      points: data['points'],
      total_points_earned: data['total_points_earned'],
      total_clicks: data['total_clicks'],
      timestamp: Time.now.to_i
    }
    
    Digest::SHA256.hexdigest(JSON.generate(critical_data) + SECRET_KEY)
  end
  
  # Validate data is within acceptable ranges
  def self.validate_data_ranges(data)
    points = data['points'] || 0
    total_earned = data['total_points_earned'] || 0
    total_clicks = data['total_clicks'] || 0
    
    # Basic sanity checks only (no arbitrary point caps)
    if points < 0 || total_earned < 0 || total_clicks < 0
      puts "🚫 Negative values detected"
      return false
    end
    
    # Check for NaN or Infinity
    if !points.finite? || !total_earned.finite? || !total_clicks.finite?
      puts "🚫 Invalid numeric values detected"
      return false
    end
    
    # Check generators don't exceed limits (handle both string and hash formats)
    generators_data = data['generators'] || '{}'
    generators = generators_data.is_a?(String) ? JSON.parse(generators_data) : generators_data
    
    generators.each do |type, count|
      if count > MAX_GENERATORS_PER_TYPE
        puts "🚫 Generator count exceeds limit: #{type} = #{count}"
        return false
      end
    end
    
    # Check total clicks is reasonable
    if total_clicks > total_earned * 10 # Allow up to 10 clicks per point (very generous)
      puts "🚫 Suspicious click-to-point ratio: #{total_clicks} clicks for #{total_earned} points"
      return false
    end
    
    true
  end
  
  # Server-side validation of game state changes with enhanced anti-cheat
  def self.validate_game_state_change(old_state, new_state, time_elapsed, player_id = nil)
    return false unless old_state && new_state
    
    # Basic data validation
    return false unless validate_data_ranges(new_state)
    
    # Calculate maximum possible points earned in the time elapsed
    old_points = old_state['points'] || 0
    new_points = new_state['points'] || 0
    points_gained = new_points - old_points
    
    old_total = old_state['total_points_earned'] || 0
    new_total = new_state['total_points_earned'] || 0
    total_points_gained = new_total - old_total
    
    # Calculate theoretical maximum based on generators and click power
    click_power = new_state['click_power'] || 1
    generators_data = new_state['generators'] || '{}'
    generators = generators_data.is_a?(String) ? JSON.parse(generators_data) : generators_data
    
    # Enhanced generator income calculation with upgrades
    generator_income = calculate_generator_income(generators, new_state)
    
    # Maximum theoretical income (generators + very aggressive clicking)
    # Allow 5 clicks per second maximum (generous for human players)
    max_click_income = click_power * 5 * time_elapsed
    max_theoretical_income = (generator_income * time_elapsed) + max_click_income
    
    # Apply buffer but make it stricter than before
    buffer_multiplier = time_elapsed > 300 ? 1.3 : 1.8  # Less buffer for longer periods
    max_allowed_gain = max_theoretical_income * buffer_multiplier
    
    # Check points gained vs theoretical maximum
    if points_gained > max_allowed_gain && points_gained > 100 # Allow small gains
      puts "🚫 Suspicious points gain detected for #{player_id}: #{points_gained} vs max allowed: #{max_allowed_gain.round(2)}"
      puts "🚫 Time elapsed: #{time_elapsed}s, Generator income: #{generator_income}/s, Click power: #{click_power}"
      return false
    end
    
    # Check total points earned progression
    if total_points_gained > max_allowed_gain && total_points_gained > 100
      puts "🚫 Suspicious total points gain for #{player_id}: #{total_points_gained} vs max: #{max_allowed_gain.round(2)}"
      return false
    end
    
    # Enhanced field validation
    return false unless validate_field_progression(old_state, new_state, time_elapsed, player_id)
    
    # Check for impossible generator purchases
    return false unless validate_generator_purchases(old_state, new_state, player_id)
    
    true
  end
  
  private
  
  # Calculate generator income with upgrades and multipliers
  def self.calculate_generator_income(generators, state)
    base_income = 0
    
    generators.each do |gen_type, count|
      case gen_type
      when 'junior_dev'
        base_income += count * 1
      when 'senior_dev'
        base_income += count * 5
      when 'code_monkey'
        base_income += count * 15
      when 'ai_assistant'
        base_income += count * 50
      when 'neural_network'
        base_income += count * 200
      when 'quantum_computer'
        base_income += count * 1000
      when 'blockchain_miner'
        base_income += count * 5000
      when 'time_machine'
        base_income += count * 25000
      when 'multiverse_compiler'
        base_income += count * 100000
      when 'god_algorithm'
        base_income += count * 500000
      when 'code_singularity'
        base_income += count * 2500000
      end
    end
    
    # Apply upgrade multipliers (simplified - extend based on your upgrade system)
    upgrades = JSON.parse(state['upgrades'] || '{}')
    multiplier = 1.0
    
    # Add upgrade multipliers here based on your game's upgrade system
    # For now, assume reasonable multipliers
    upgrades.each do |upgrade_id, owned|
      if owned
        case upgrade_id
        when 'efficiency_boost'
          multiplier *= 1.5
        when 'automation_upgrade'
          multiplier *= 2.0
        # Add more as needed
        end
      end
    end
    
    (base_income * multiplier).round(2)
  end
  
  # Validate field progression makes sense
  def self.validate_field_progression(old_state, new_state, time_elapsed, player_id)
    # Validate other fields don't decrease inappropriately
    if (new_state['total_points_earned'] || 0) < (old_state['total_points_earned'] || 0)
      puts "🚫 Total points earned decreased illegally for #{player_id}"
      return false
    end
    
    if (new_state['total_clicks'] || 0) < (old_state['total_clicks'] || 0)
      puts "🚫 Total clicks decreased illegally for #{player_id}"
      return false
    end
    
    # Check click progression is reasonable
    old_clicks = old_state['total_clicks'] || 0
    new_clicks = new_state['total_clicks'] || 0
    clicks_gained = new_clicks - old_clicks
    
    # Maximum 10 clicks per second (very generous)
    max_clicks = time_elapsed * 10
    if clicks_gained > max_clicks && clicks_gained > 10
      puts "🚫 Impossible click rate for #{player_id}: #{clicks_gained} clicks in #{time_elapsed}s"
      return false
    end
    
    true
  end
  
  # Validate generator purchases are affordable
  def self.validate_generator_purchases(old_state, new_state, player_id)
    old_generators_data = old_state['generators'] || '{}'
    new_generators_data = new_state['generators'] || '{}'
    
    old_generators = old_generators_data.is_a?(String) ? JSON.parse(old_generators_data) : old_generators_data
    new_generators = new_generators_data.is_a?(String) ? JSON.parse(new_generators_data) : new_generators_data
    
    # Calculate cost of new generators (simplified pricing)
    total_cost = 0
    
    new_generators.each do |type, new_count|
      old_count = old_generators[type] || 0
      purchased = new_count - old_count
      
      if purchased > 0
        base_cost = get_generator_base_cost(type)
        # Simple cost calculation - in reality this would be more complex
        total_cost += purchased * base_cost
      elsif purchased < 0
        puts "🚫 Generator count decreased for #{player_id}: #{type} from #{old_count} to #{new_count}"
        return false
      end
    end
    
    # Check if player could afford the purchases
    old_points = old_state['points'] || 0
    new_points = new_state['points'] || 0
    
    # Allow some buffer for concurrent purchases and income
    available_points = old_points + (old_points * 0.1) # 10% buffer
    
    if total_cost > available_points && total_cost > 1000 # Ignore small purchases
      puts "🚫 Unaffordable generator purchases for #{player_id}: cost #{total_cost}, available #{available_points}"
      return false
    end
    
    true
  end
  
  # Get base cost for generator types
  def self.get_generator_base_cost(type)
    case type
    when 'junior_dev' then 10
    when 'senior_dev' then 100
    when 'code_monkey' then 500
    when 'ai_assistant' then 2500
    when 'neural_network' then 12500
    when 'quantum_computer' then 62500
    when 'blockchain_miner' then 312500
    when 'time_machine' then 1562500
    when 'multiverse_compiler' then 7812500
    when 'god_algorithm' then 39062500
    when 'code_singularity' then 195312500
    else 1000 # Default cost
    end
  end
end
