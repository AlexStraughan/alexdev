# encoding: UTF-8
require 'eventmachine'
require 'json'
require 'sqlite3'
require 'securerandom'
require 'digest/sha1'
require 'base64'
require 'openssl'
require_relative 'server/game_encryption'

# Load environment variables from .env file if it exists
begin
  require 'dotenv'
  Dotenv.load
rescue LoadError
  # dotenv not available, environment variables should be set manually
  puts "⚠️  dotenv gem not found. Set environment variables manually or install with: gem install dotenv"
end

class GameWebSocketServer
  def initialize
    @clients = {}
    @db = SQLite3::Database.new('leaderboard.db')
    # Set busy timeout to prevent database locks
    @db.busy_timeout = 5000  # 5 seconds
    # Throttle broadcast_active_players to reduce console spam
    @last_broadcast_time = 0
    @broadcast_throttle_seconds = 30  # Only broadcast every 30 seconds max
    # Store last known game states for validation
    @last_game_states = {}
    setup_database
    puts "🚀 WebSocket server initialized with encryption support"
  end

  def setup_database
    # Ensure game_states table exists
    @db.execute <<-SQL
      CREATE TABLE IF NOT EXISTS game_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT UNIQUE,
        player_name TEXT,
        points INTEGER DEFAULT 0,
        total_clicks INTEGER DEFAULT 0,
        total_points_earned INTEGER DEFAULT 0,
        click_power INTEGER DEFAULT 1,
        crit_chance INTEGER DEFAULT 0,
        crit_multiplier INTEGER DEFAULT 2,
        generators TEXT DEFAULT '{}',
        upgrades TEXT DEFAULT '{}',
        achievements TEXT DEFAULT '[]',
        game_hub_revealed BOOLEAN DEFAULT FALSE,
        upgrades_tab_unlocked BOOLEAN DEFAULT FALSE,
        last_active_time INTEGER DEFAULT 0,
        offline_earnings_rate REAL DEFAULT 0.4,
        player_token TEXT,
        last_save_hash TEXT,
        last_validated_at INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    SQL

    # Add offline earnings columns if they don't exist (migration for existing databases)
    begin
      @db.execute("ALTER TABLE game_states ADD COLUMN last_active_time INTEGER DEFAULT 0")
    rescue SQLite3::SQLException => e
      # Column already exists, ignore
    end
    
    begin
      @db.execute("ALTER TABLE game_states ADD COLUMN offline_earnings_rate REAL DEFAULT 0.4")
    rescue SQLite3::SQLException => e
      # Column already exists, ignore
    end

    # Add encryption/security columns
    begin
      @db.execute("ALTER TABLE game_states ADD COLUMN player_token TEXT")
    rescue SQLite3::SQLException => e
      # Column already exists, ignore
    end
    
    begin
      @db.execute("ALTER TABLE game_states ADD COLUMN last_save_hash TEXT")
    rescue SQLite3::SQLException => e
      # Column already exists, ignore
    end
    
    begin
      @db.execute("ALTER TABLE game_states ADD COLUMN last_validated_at INTEGER DEFAULT 0")
    rescue SQLite3::SQLException => e
      # Column already exists, ignore
    end
    
    # Add infinite upgrades column if it doesn't exist
    begin
      @db.execute("ALTER TABLE game_states ADD COLUMN infinite_upgrades TEXT DEFAULT '{}'")
      puts "✅ Added infinite_upgrades column to database"
    rescue SQLite3::SQLException => e
      # Column already exists, ignore
    end

    # Chat messages table
    @db.execute <<-SQL
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT,
        player_name TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    SQL
  end

  def handle_connection(connection)
    player_id = SecureRandom.uuid
    
    # Get client IP for security logging
    client_ip = connection.env['REMOTE_ADDR'] || connection.env['HTTP_X_FORWARDED_FOR'] || 'unknown'
    
    # Check if IP is flagged as suspicious
    if GameEncryption.is_suspicious_ip?(client_ip)
      puts "🚨 Rejecting connection from suspicious IP: #{client_ip}"
      connection.close_connection
      return
    end
    
    @clients[player_id] = {
      connection: connection,
      player_id: player_id,
      player_name: nil,
      last_seen: Time.now,
      registered: false,
      client_ip: client_ip,
      connection_time: Time.now.to_i
    }

    puts "🔌 Client connected: #{player_id} from #{client_ip}"

    # Send initial data
    send_to_client(player_id, {
      type: 'connected',
      player_id: player_id,
      message: 'Connected to game server'
    })
    
    broadcast_active_players_force
    
    # Store player_id in connection for cleanup
    connection.player_id = player_id
  end

  def handle_message(player_id, message)
    client = @clients[player_id]
    return unless client

    puts "📥 Received message: #{message['type']}"

    case message['type']
    when 'load_game_state'
      handle_load_game_state(player_id, message)
    when 'save_game_state'
      handle_save_game_state(player_id, message)
    when 'register_player'
      handle_register_player(player_id, message)
    when 'chat_message'
      handle_chat_message(player_id, message)
    when 'player_activity'
      handle_player_activity(player_id, message)
    when 'heartbeat'
      handle_heartbeat(player_id, message)
    when 'request_leaderboard'
      handle_request_leaderboard(player_id)
    when 'admin_command'
      handle_admin_command(player_id, message)
    else
      puts "❓ Unknown message type: #{message['type']}"
    end
  end

  def handle_load_game_state(player_id, message)
    game_player_id = message['game_player_id']
    puts "🎮 Loading game state for player: #{game_player_id}"
    
    result = @db.execute("SELECT * FROM game_states WHERE player_id = ? LIMIT 1", [game_player_id])
    
    if result.empty?
      puts "🎮 No existing state found, returning default state"
      # Return default state with camelCase for client compatibility
      state = {
        player_id: game_player_id,
        points: 0,
        totalClicks: 0,                     # Convert to camelCase
        totalPointsEarned: 0,               # Convert to camelCase
        clickPower: 1,                      # Convert to camelCase
        critChance: 0,                      # Convert to camelCase
        critMultiplier: 2,                  # Convert to camelCase
        generators: {},
        upgrades: {},
        infiniteUpgrades: {},               # Add infinite upgrades
        achievements: [],
        gameHubRevealed: false,             # Convert to camelCase
        upgradesTabUnlocked: false,         # Convert to camelCase
        lastActiveTime: 0,                  # Convert to camelCase
        offlineEarningsRate: 0.4            # Convert to camelCase
      }
    else
      puts "🎮 Found existing state, loading from database"
      # Parse existing state and convert to camelCase for client compatibility
      row = result[0]
      state = {
        player_id: row[1],
        player_name: row[2],
        points: row[3],
        totalClicks: row[4],                # Convert to camelCase
        totalPointsEarned: row[5],          # Convert to camelCase
        clickPower: row[6],                 # Convert to camelCase
        critChance: row[7],                 # Convert to camelCase
        critMultiplier: row[8],             # Convert to camelCase
        generators: JSON.parse(row[9] || '{}'),
        upgrades: JSON.parse(row[10] || '{}'),
        achievements: JSON.parse(row[11] || '[]'),
        gameHubRevealed: row[12] == 1,      # Convert to camelCase
        upgradesTabUnlocked: row[13] == 1,  # Convert to camelCase
        lastActiveTime: row[14] || 0,       # Convert to camelCase
        offlineEarningsRate: row[15] || 0.4, # Convert to camelCase
        infiniteUpgrades: JSON.parse(row[19] || '{}')  # Add infinite upgrades
      }
    end

    response = {
      type: 'game_state_loaded',
      state: state
    }
    
    puts "🎮 Sending game state response"
    puts "🎮 Infinite upgrades in response: #{state[:infiniteUpgrades]}"
    send_to_client(player_id, response)
  end

  def handle_save_game_state(player_id, message)
    client = @clients[player_id]
    return unless client && client[:registered]
    
    # Rate limiting check
    unless GameEncryption.check_rate_limit(player_id, 'save_game_state')
      puts "🚫 Rate limit exceeded for player #{player_id}"
      send_to_client(player_id, {
        type: 'game_state_saved',
        success: false,
        error: 'Too many save attempts. Please wait before trying again.'
      })
      
      # Flag IP as suspicious after multiple rate limit violations
      GameEncryption.flag_suspicious_ip(client[:client_ip])
      return
    end
    
    # Verify token if present
    secure_token = message['secure_token']
    if secure_token
      token_data = GameEncryption.verify_player_token(secure_token, player_id, client[:client_ip])
      unless token_data
        puts "🚫 Invalid or expired token for player #{player_id}"
        send_to_client(player_id, {
          type: 'game_state_saved',
          success: false,
          error: 'Authentication failed - please refresh the page'
        })
        return
      end
      
      # Check message signature if present
      if message['message_signature']
        message_data = {
          type: message['type'],
          game_player_id: message['game_player_id'],
          encrypted_state: message['encrypted_state'],
          integrity_hash: message['integrity_hash']
        }
        
        unless GameEncryption.verify_message_signature(message_data, message['message_signature'], secure_token)
          puts "🚫 Message signature verification failed for player #{player_id}"
          send_to_client(player_id, {
            type: 'game_state_saved',
            success: false,
            error: 'Message integrity check failed'
          })
          return
        end
      end
    else
      puts "⚠️  No secure token provided for player #{player_id}"
    end
    
    game_player_id = message['game_player_id']
    encrypted_state = message['encrypted_state']
    integrity_hash = message['integrity_hash']
    
    # Try to decrypt the game state
    state = nil
    if encrypted_state
      state = GameEncryption.decrypt_game_data(encrypted_state)
      unless state
        puts "🚫 Failed to decrypt game state for player #{game_player_id}"
        send_to_client(player_id, {
          type: 'game_state_saved',
          success: false,
          error: 'Invalid game data format'
        })
        return
      end
    else
      # Fallback to unencrypted for compatibility (remove this in production!)
      state = message['state']
      puts "⚠️  Received unencrypted game state - security risk!"
    end
    
    # Verify integrity hash with enhanced validation
    if integrity_hash && !GameEncryption.verify_integrity_hash(state, integrity_hash, true)
      puts "🚫 Integrity check failed for player #{game_player_id}"
      send_to_client(player_id, {
        type: 'game_state_saved',
        success: false,
        error: 'Data integrity verification failed'
      })
      return
    end
    
    # Get previous state for validation
    previous_state = @last_game_states[game_player_id]
    current_time = Time.now.to_i
    
    if previous_state
      time_elapsed = current_time - (previous_state['last_validated_at'] || current_time - 60)
      
      # Enhanced game state validation
      unless GameEncryption.validate_game_state_change(previous_state, state, time_elapsed, player_id)
        puts "🚫 Invalid game state change detected for player #{game_player_id}"
        
        # Flag player for suspicious activity instead of banning
        GameEncryption.flag_player_suspicious(game_player_id, "Invalid game state change detected", 'medium')
        
        send_to_client(player_id, {
          type: 'game_state_saved',
          success: false,
          error: 'Unusual activity detected. Please play normally to avoid being flagged.'
        })
        return
      end
    end
    
    # Debug logging for infinite upgrades
    puts "💾 Saving game state for player: #{game_player_id}"
    puts "💾 Infinite upgrades data: #{state['infiniteUpgrades']}"
    
    begin
      # Use transaction with retry for better reliability
      @db.transaction do
        # Check if player exists
        existing = @db.execute("SELECT id FROM game_states WHERE player_id = ? LIMIT 1", [game_player_id])
        
        # Create integrity hash for storage
        save_hash = GameEncryption.create_integrity_hash(state)
        
        if existing.empty?
          # Insert new player state
          @db.execute(
            "INSERT INTO game_states (player_id, player_name, points, total_clicks, total_points_earned, click_power, crit_chance, crit_multiplier, generators, upgrades, achievements, game_hub_revealed, upgrades_tab_unlocked, last_active_time, offline_earnings_rate, infinite_upgrades, last_save_hash, last_validated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              game_player_id,
              state['player_name'],
              state['points'] || 0,
              state['total_clicks'] || 0,
              state['total_points_earned'] || 0,
              state['click_power'] || 1,
              state['crit_chance'] || 0,
              state['crit_multiplier'] || 2,
              JSON.generate(state['generators'] || {}),
              JSON.generate(state['upgrades'] || {}),
              JSON.generate(state['achievements'] || []),
              state['game_hub_revealed'] ? 1 : 0,
              state['upgrades_tab_unlocked'] ? 1 : 0,
              state['last_active_time'] || 0,
              state['offline_earnings_rate'] || 0.4,
              JSON.generate(state['infiniteUpgrades'] || {}),
              save_hash,
              current_time
            ]
          )
        else
          # Update existing player state
          @db.execute(
            "UPDATE game_states SET player_name = ?, points = ?, total_clicks = ?, total_points_earned = ?, click_power = ?, crit_chance = ?, crit_multiplier = ?, generators = ?, upgrades = ?, achievements = ?, game_hub_revealed = ?, upgrades_tab_unlocked = ?, last_active_time = ?, offline_earnings_rate = ?, infinite_upgrades = ?, last_save_hash = ?, last_validated_at = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?",
            [
              state['player_name'],
              state['points'] || 0,
              state['total_clicks'] || 0,
              state['total_points_earned'] || 0,
              state['click_power'] || 1,
              state['crit_chance'] || 0,
              state['crit_multiplier'] || 2,
              JSON.generate(state['generators'] || {}),
              JSON.generate(state['upgrades'] || {}),
              JSON.generate(state['achievements'] || []),
              state['game_hub_revealed'] ? 1 : 0,
              state['upgrades_tab_unlocked'] ? 1 : 0,
              state['last_active_time'] || 0,
              state['offline_earnings_rate'] || 0.4,
              JSON.generate(state['infiniteUpgrades'] || {}),
              save_hash,
              current_time,
              game_player_id
            ]
          )
        end
      end
      
      # Store the validated state for future comparisons
      state['last_validated_at'] = current_time
      @last_game_states[game_player_id] = state

      send_to_client(player_id, {
        type: 'game_state_saved',
        success: true
      })

    rescue SQLite3::BusyException => e
      puts "🚨 Database busy, retrying save operation..."
      sleep(0.1)
      # Send failure response - client can retry
      send_to_client(player_id, {
        type: 'game_state_saved',
        success: false,
        error: 'Database busy, please try again'
      })
    rescue => e
      puts "❌ Error saving game state: #{e.message}"
      send_to_client(player_id, {
        type: 'game_state_saved',
        success: false,
        error: e.message
      })
    end

    # Don't broadcast leaderboard immediately after save to avoid showing temporary low scores
    # Leaderboard updates will be handled by the periodic broadcast timer
  end

  def handle_register_player(player_id, message)
    client = @clients[player_id]
    player_name = message['player_name']
    
    # Basic validation
    if !player_name || player_name.strip.empty? || player_name.length > 50
      send_to_client(player_id, {
        type: 'player_registered',
        success: false,
        error: 'Invalid player name'
      })
      return
    end
    
    # Check for suspicious names (basic filtering)
    if player_name.match?(/admin|script|bot|hack|cheat/i)
      puts "🚫 Suspicious player name attempted: #{player_name} from #{client[:client_ip]}"
      GameEncryption.flag_suspicious_ip(client[:client_ip])
    end
    
    client[:player_name] = player_name.strip
    client[:registered] = true
    
    # Generate secure token with client IP
    player_token = GameEncryption.generate_player_token(player_id, player_name, client[:client_ip])
    client[:token] = player_token
    
    # Update player token in database
    @db.execute(
      "UPDATE game_states SET player_token = ? WHERE player_id = ?",
      [player_token, player_id]
    )
    
    send_to_client(player_id, {
      type: 'player_registered',
      player_name: player_name,
      secure_token: player_token
    })

    broadcast_active_players_force
    
    puts "👤 Player registered: #{player_name} (#{player_id}) from #{client[:client_ip]}"
  end

  def handle_chat_message(player_id, message)
    client = @clients[player_id]
    return unless client && client[:registered]

    chat_message = message['message']
    player_name = client[:player_name]

    # Save to database
    @db.execute(
      "INSERT INTO chat_messages (player_id, player_name, message) VALUES (?, ?, ?)",
      [player_id, player_name, chat_message]
    )

    # Broadcast to all clients
    broadcast_message({
      type: 'chat_message',
      player_id: player_id,
      player_name: player_name,
      message: chat_message,
      timestamp: Time.now.to_i
    })
  end

  def handle_player_activity(player_id, message)
    client = @clients[player_id]
    return unless client

    # Update client activity data
    client[:last_seen] = Time.now
    client[:score] = message['score'] || 0
    client[:level] = message['level'] || 1
    client[:points_per_second] = message['points_per_second'] || 0
    client[:generators_owned] = message['generators_owned'] || 0

    puts "📊 Updated activity for #{client[:player_name]}: #{client[:score]} pts"

    # Broadcast active players update
    broadcast_active_players
  end

  def handle_heartbeat(player_id, message)
    client = @clients[player_id]
    return unless client

    client[:last_seen] = Time.now
    
    # Update player activity data if provided
    if message['activity_data']
      data = message['activity_data']
      client[:score] = data['score']
      client[:points_per_second] = data['points_per_second']
      client[:generators_owned] = data['generators_owned']
      
      # Debug logging to see what scores we're getting
      if client[:player_name] && data['score'] && data['score'] > 0
        puts "💓 Heartbeat from #{client[:player_name]}: score=#{data['score']}, current_points=#{data['current_points']}, pps=#{data['points_per_second']}"
      end
    end

    broadcast_active_players
  end

  def handle_request_leaderboard(player_id)
    send_leaderboard_to_client(player_id)
  end

  def handle_admin_command(player_id, message)
    # Get admin password from environment variable, fallback to default for development
    admin_password = ENV['ADMIN_PASSWORD'] || "admin123"
    
    puts "🔐 Admin command received - Expected password: '#{admin_password}', Received: '#{message['password']}'"
    
    if message['password'] != admin_password
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: 'Invalid admin password'
      })
      puts "❌ Invalid admin password attempt from #{player_id}"
      return
    end

    command = message['command']
    puts "🔧 Admin command: #{command} from #{player_id}"
    
    case command
    when 'add_player'
      handle_admin_add_player(player_id, message)
    when 'edit_player'
      handle_admin_edit_player(player_id, message)
    when 'delete_player'
      handle_admin_delete_player(player_id, message)
    when 'reset_leaderboard'
      handle_admin_reset_leaderboard(player_id, message)
    when 'list_players'
      handle_admin_list_players(player_id, message)
    when 'check_database'
      handle_admin_check_database(player_id, message)
    when 'list_flagged'
      handle_admin_list_flagged(player_id, message)
    when 'flag_player'
      handle_admin_flag_player(player_id, message)
    when 'reinstate_player'
      handle_admin_reinstate_player(player_id, message)
    when 'help'
      handle_admin_help(player_id, message)
    else
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Unknown admin command: #{command}. Use 'help' for available commands."
      })
    end
  end

  def handle_admin_add_player(player_id, message)
    player_name = message['player_name']
    points = message['points'] || 0
    
    if !player_name || player_name.strip.empty?
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: 'Player name is required'
      })
      return
    end
    
    new_player_id = "admin_" + SecureRandom.hex(8)
    
    begin
      @db.execute(
        "INSERT INTO game_states (player_id, player_name, points, total_clicks, total_points_earned, click_power, crit_chance, crit_multiplier, generators, upgrades, achievements, game_hub_revealed, upgrades_tab_unlocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          new_player_id,
          player_name,
          points,
          points / 10,
          points,
          1,
          0,
          2,
          JSON.generate({"junior_dev" => 1}),
          JSON.generate({}),
          JSON.generate(["first_click"]),
          0,  # Changed from false to 0
          0   # Changed from false to 0
        ]
      )
      
      send_to_client(player_id, {
        type: 'admin_response',
        success: true,
        message: "✅ Added player '#{player_name}' with #{points} points (ID: #{new_player_id})"
      })
      
      # Leaderboard will update on next periodic broadcast (every 10 seconds)
      puts "🔧 Admin added player: #{player_name} (#{points} points)"
      
    rescue => e
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Error adding player: #{e.message}"
      })
    end
  end

  def handle_admin_edit_player(player_id, message)
    target_id = message['target_player_id']
    new_points = message['points']
    new_name = message['player_name']
    
    if !target_id || target_id.strip.empty?
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: 'Target player ID is required'
      })
      return
    end
    
    begin
      # Check if player exists
      existing = @db.execute("SELECT player_name FROM game_states WHERE player_id = ? LIMIT 1", [target_id])
      
      if existing.empty?
        send_to_client(player_id, {
          type: 'admin_response',
          success: false,
          message: "Player with ID '#{target_id}' not found"
        })
        return
      end
      
      updates = []
      values = []
      changes = []
      
      if new_points
        updates << "points = ?"
        updates << "total_points_earned = ?"
        values << new_points
        values << new_points
        changes << "points to #{new_points}"
      end
      
      if new_name && !new_name.strip.empty?
        updates << "player_name = ?"
        values << new_name
        changes << "name to '#{new_name}'"
      end
      
      if updates.empty?
        send_to_client(player_id, {
          type: 'admin_response',
          success: false,
          message: 'No valid updates provided (points or player_name required)'
        })
        return
      end
      
      updates << "updated_at = CURRENT_TIMESTAMP"
      values << target_id
      
      @db.execute("UPDATE game_states SET #{updates.join(', ')} WHERE player_id = ?", values)
      
      response = {
        type: 'admin_response',
        success: true,
        message: "✅ Updated player '#{target_id}': #{changes.join(', ')}",
        updated_player_id: target_id
      }
      
      # Include new points in response if points were updated
      if new_points
        response[:new_points] = new_points
      end
      
      # Include new name in response if name was updated
      if new_name && !new_name.strip.empty?
        response[:new_player_name] = new_name
      end
      
      send_to_client(player_id, response)
      
      # Leaderboard will update on next periodic broadcast (every 10 seconds)
      puts "🔧 Admin edited player: #{target_id} - #{changes.join(', ')}"
      
    rescue => e
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Error editing player: #{e.message}"
      })
    end
  end

  def handle_admin_delete_player(player_id, message)
    target_id = message['target_player_id']
    
    if !target_id || target_id.strip.empty?
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: 'Target player ID is required'
      })
      return
    end
    
    begin
      # Check if player exists
      existing = @db.execute("SELECT player_name FROM game_states WHERE player_id = ? LIMIT 1", [target_id])
      
      if existing.empty?
        send_to_client(player_id, {
          type: 'admin_response',
          success: false,
          message: "Player with ID '#{target_id}' not found"
        })
        return
      end
      
      player_name = existing[0][0]
      @db.execute("DELETE FROM game_states WHERE player_id = ?", [target_id])
      
      send_to_client(player_id, {
        type: 'admin_response',
        success: true,
        message: "✅ Deleted player '#{player_name}' (ID: #{target_id})"
      })
      
      # Leaderboard will update on next periodic broadcast (every 10 seconds)
      puts "🔧 Admin deleted player: #{player_name} (#{target_id})"
      
    rescue => e
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Error deleting player: #{e.message}"
      })
    end
  end

  def handle_admin_reset_leaderboard(player_id, message)
    confirm = message['confirm']
    
    if confirm != 'YES_DELETE_ALL'
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "⚠️ To reset leaderboard, send: {confirm: 'YES_DELETE_ALL'}"
      })
      return
    end
    
    begin
      count = @db.execute("SELECT COUNT(*) FROM game_states")[0][0]
      @db.execute("DELETE FROM game_states")
      
      # Broadcast game reset to all connected clients
      broadcast_message({
        type: 'game_reset',
        message: '🎮 Game has been reset by admin. All progress cleared.'
      })
      
      send_to_client(player_id, {
        type: 'admin_response',
        success: true,
        message: "💥 LEADERBOARD RESET! Deleted #{count} players from database. All connected clients have been notified to reset their game state."
      })
      
      broadcast_leaderboard_update
      puts "🔧 Admin reset leaderboard: #{count} players deleted, all clients notified"
    rescue => e
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Error resetting leaderboard: #{e.message}"
      })
    end
  end

  def handle_admin_check_database(player_id, message)
    begin
      # Get basic database info
      total_players = @db.execute("SELECT COUNT(*) FROM game_states").first[0]
      named_players = @db.execute("SELECT COUNT(*) FROM game_states WHERE player_name IS NOT NULL").first[0]
      top_player = @db.execute("SELECT player_name, total_points_earned FROM game_states WHERE player_name IS NOT NULL ORDER BY total_points_earned DESC LIMIT 1").first
      
      # Get sample data
      sample_players = @db.execute("SELECT player_id, player_name, points, total_points_earned FROM game_states WHERE player_name IS NOT NULL ORDER BY total_points_earned DESC LIMIT 3")
      
      info = []
      info << "📊 DATABASE STATUS:"
      info << "Total players: #{total_players}"
      info << "Named players: #{named_players}"
      info << "Top player: #{top_player ? "#{top_player[0]} (#{top_player[1]} points)" : 'None'}"
      info << ""
      info << "📋 SAMPLE DATA:"
      sample_players.each_with_index do |row, index|
        info << "#{index + 1}. #{row[1]} - current: #{row[2]}, total_earned: #{row[3]}"
      end
      
      send_to_client(player_id, {
        type: 'admin_response',
        success: true,
        message: info.join("\n")
      })
      
    rescue => e
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Error checking database: #{e.message}"
      })
    end
  end

  def handle_admin_list_players(player_id, message)
    begin
      players = @db.execute("SELECT player_id, player_name, total_points_earned, total_clicks FROM game_states ORDER BY total_points_earned DESC LIMIT 20")
      
      if players.empty?
        send_to_client(player_id, {
          type: 'admin_response',
          success: true,
          message: "📋 No players found in database"
        })
        return
      end
      
      player_list = players.map.with_index do |row, index|
        "#{index + 1}. #{row[1] || 'Unknown'} (#{row[0]}) - #{row[2]} points"
      end.join("\n")
      
      # Format players data for UI consumption
      players_data = players.map do |row|
        {
          player_id: row[0],
          player_name: row[1],
          total_points_earned: row[2],
          total_clicks: row[3]
        }
      end
      
      send_to_client(player_id, {
        type: 'admin_response',
        success: true,
        message: "📋 Top Players:\n#{player_list}",
        players: players_data
      })
      
    rescue => e
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Error listing players: #{e.message}"
      })
    end
  end

  def handle_admin_help(player_id, message)
    help_text = <<~HELP
      🔧 ADMIN COMMANDS:
      
      📋 LIST PLAYERS:
      {type: 'admin_command', password: 'admin123', command: 'list_players'}
      
      ➕ ADD PLAYER:
      {type: 'admin_command', password: 'admin123', command: 'add_player', player_name: 'TestUser', points: 1000}
      
      ✏️ EDIT PLAYER:
      {type: 'admin_command', password: 'admin123', command: 'edit_player', target_player_id: 'player_123', points: 5000}
      {type: 'admin_command', password: 'admin123', command: 'edit_player', target_player_id: 'player_123', player_name: 'NewName'}
      
      🗑️ DELETE PLAYER:
      {type: 'admin_command', password: 'admin123', command: 'delete_player', target_player_id: 'player_123'}
      
      💥 RESET LEADERBOARD:
      {type: 'admin_command', password: 'admin123', command: 'reset_leaderboard', confirm: 'YES_DELETE_ALL'}
      
      🚨 FLAG MANAGEMENT:
      {type: 'admin_command', password: 'admin123', command: 'list_flagged'}
      {type: 'admin_command', password: 'admin123', command: 'flag_player', target_player_id: 'player_123', reason: 'Manual flag', severity: 'medium'}
      {type: 'admin_command', password: 'admin123', command: 'reinstate_player', target_player_id: 'player_123', notes: 'False positive'}
      
      ❓ HELP:
      {type: 'admin_command', password: 'admin123', command: 'help'}
      
      💡 TIP: Use browser console with window.wsClient.sendMessage() or adminCommands helper functions
    HELP
    
    send_to_client(player_id, {
      type: 'admin_response',
      success: true,
      message: help_text
    })
  end

  def handle_admin_list_flagged(player_id, message)
    flagged_players = GameEncryption.get_flagged_players
    
    if flagged_players.empty?
      send_to_client(player_id, {
        type: 'admin_response',
        success: true,
        message: "No flagged players found."
      })
      return
    end
    
    flagged_info = flagged_players.map do |player_id, info|
      reasons = info[:reasons].map { |r| "#{r[:reason]} (#{r[:severity]}) at #{r[:timestamp]}" }
      
      player_name = nil
      begin
        result = @db.execute("SELECT player_name FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
        player_name = result.first&.first || "Unknown"
      rescue => e
        player_name = "Error: #{e.message}"
      end
      
      <<~INFO
        🚨 Player: #{player_name} (ID: #{player_id})
        Hidden from leaderboard: #{info[:hidden_from_leaderboard] ? 'YES' : 'NO'}
        Flagged at: #{info[:flagged_at]}
        Reasons: #{reasons.join(', ')}
        Admin notes: #{info[:admin_notes] || 'None'}
        #{info[:reinstated_at] ? "Reinstated at: #{info[:reinstated_at]}" : ''}
      INFO
    end
    
    send_to_client(player_id, {
      type: 'admin_response',
      success: true,
      message: "📋 FLAGGED PLAYERS:\n\n#{flagged_info.join("\n---\n")}"
    })
  end

  def handle_admin_flag_player(player_id, message)
    target_player_id = message['target_player_id']
    reason = message['reason'] || 'Manual admin flag'
    severity = message['severity'] || 'medium'
    
    unless target_player_id
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Missing target_player_id parameter"
      })
      return
    end
    
    # Check if player exists
    player_exists = @db.execute("SELECT player_name FROM game_states WHERE player_id = ? LIMIT 1", [target_player_id])
    if player_exists.empty?
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Player #{target_player_id} not found in database"
      })
      return
    end
    
    # Flag the player
    flag_info = GameEncryption.flag_player_suspicious(target_player_id, reason, severity)
    player_name = player_exists.first.first
    
    send_to_client(player_id, {
      type: 'admin_response',
      success: true,
      message: "✅ Player #{player_name} (#{target_player_id}) has been flagged for: #{reason} (severity: #{severity})"
    })
    
    # Refresh leaderboard for all clients
    broadcast_leaderboard_update
  end

  def handle_admin_reinstate_player(player_id, message)
    target_player_id = message['target_player_id']
    admin_notes = message['notes'] || 'Reinstated by admin'
    
    unless target_player_id
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Missing target_player_id parameter"
      })
      return
    end
    
    # Check if player exists and is flagged
    player_exists = @db.execute("SELECT player_name FROM game_states WHERE player_id = ? LIMIT 1", [target_player_id])
    if player_exists.empty?
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "Player #{target_player_id} not found in database"
      })
      return
    end
    
    # Reinstate the player
    if GameEncryption.reinstate_player(target_player_id, admin_notes)
      player_name = player_exists.first.first
      send_to_client(player_id, {
        type: 'admin_response',
        success: true,
        message: "✅ Player #{player_name} (#{target_player_id}) has been reinstated. Notes: #{admin_notes}"
      })
      
      # Refresh leaderboard for all clients
      broadcast_leaderboard_update
    else
      send_to_client(player_id, {
        type: 'admin_response',
        success: false,
        message: "❌ Player #{target_player_id} was not flagged or could not be reinstated"
      })
    end
  end

  def send_leaderboard_to_client(player_id)
    players = @db.execute("SELECT player_id, player_name, total_points_earned, total_clicks, generators, upgrades, updated_at FROM game_states WHERE player_name IS NOT NULL ORDER BY total_points_earned DESC LIMIT 20")
    
    # Filter out players who are hidden from leaderboard
    filtered_players = players.select do |row|
      player_db_id = row[0]
      !GameEncryption.is_player_hidden_from_leaderboard?(player_db_id)
    end
    
    # Take only top 10 after filtering
    leaderboard = filtered_players.first(10).map do |row|
      {
        player_id: row[0],
        player_name: row[1],
        points: row[2],  # This will now contain total_points_earned
        total_clicks: row[3],
        generators: JSON.parse(row[4] || '{}'),
        upgrades: JSON.parse(row[5] || '{}'),
        updated_at: row[6]
      }
    end

    puts "🏆 Sending leaderboard to #{player_id}: #{leaderboard.map { |p| "#{p[:player_name]} (#{p[:points]})" }.join(', ')}"

    send_to_client(player_id, {
      type: 'leaderboard_update',
      leaderboard: leaderboard
    })
  end

  def broadcast_leaderboard_update
    @clients.each do |client_id, client|
      send_leaderboard_to_client(client_id)
    end
  end

  def broadcast_active_players
    # Throttle broadcasts to reduce console spam
    current_time = Time.now.to_i
    return if current_time - @last_broadcast_time < @broadcast_throttle_seconds
    
    @last_broadcast_time = current_time
    
    active_players = @clients.values.select { |client| client[:registered] }.map do |client|
      {
        player_id: client[:player_id],
        player_name: client[:player_name],
        score: client[:score] || 0,
        points_per_second: client[:points_per_second] || 0,
        generators_owned: client[:generators_owned] || 0,
        last_seen: client[:last_seen].to_i
      }
    end

    broadcast_message({
      type: 'active_players_update',
      players: active_players
    })
    puts "👥 Broadcasted active players update to #{@clients.count} clients (throttled)"
  end

  def broadcast_active_players_force
    # Force broadcast without throttling (for connects/disconnects)
    @last_broadcast_time = 0  # Reset throttle
    broadcast_active_players
  end

  def send_to_client(player_id, message)
    client = @clients[player_id]
    return unless client

    begin
      json_message = JSON.generate(message)
      frame = create_websocket_frame(json_message)
      client[:connection].send_data(frame)
      puts "📤 Sent to #{player_id}: #{message[:type]}"
    rescue => e
      puts "❌ Error sending to client #{player_id}: #{e.message}"
      puts "❌ Error backtrace: #{e.backtrace.first(3).join('\n')}"
      @clients.delete(player_id)
    end
  end

  def broadcast_message(message)
    @clients.each do |player_id, client|
      send_to_client(player_id, message)
    end
  end

  def cleanup_old_chat_messages
    # Keep only last 100 messages
    @db.execute("DELETE FROM chat_messages WHERE id NOT IN (SELECT id FROM chat_messages ORDER BY created_at DESC LIMIT 100)")
  end

  def start_cleanup_timer
    # Clean up old chat messages every 5 minutes
    EventMachine.add_periodic_timer(300) do
      cleanup_old_chat_messages
    end
    
    # Broadcast leaderboard updates every 10 minutes (600 seconds)
    EventMachine.add_periodic_timer(600) do
      broadcast_leaderboard_update
    end
  end

  def handle_client_disconnect(player_id)
    puts "🔌 Client disconnected: #{player_id}"
    @clients.delete(player_id)
    broadcast_active_players
  end

  private

  def create_websocket_frame(message)
    begin
      bytes = message.bytes.to_a
      frame = []
      
      # First byte: FIN=1, opcode=1 (text frame)
      frame << 0x81
      
      # Payload length
      if bytes.length < 126
        frame << bytes.length
      elsif bytes.length < 65536
        frame << 126
        frame << ((bytes.length >> 8) & 0xFF)
        frame << (bytes.length & 0xFF)
      else
        frame << 127
        frame << ((bytes.length >> 56) & 0xFF)
        frame << ((bytes.length >> 48) & 0xFF)
        frame << ((bytes.length >> 40) & 0xFF)
        frame << ((bytes.length >> 32) & 0xFF)
        frame << ((bytes.length >> 24) & 0xFF)
        frame << ((bytes.length >> 16) & 0xFF)
        frame << ((bytes.length >> 8) & 0xFF)
        frame << (bytes.length & 0xFF)
      end
      
      # Payload - add each byte individually to avoid array conversion issues
      bytes.each { |byte| frame << byte }
      
      frame.pack('C*')
    rescue => e
      puts "❌ Error in create_websocket_frame: #{e.message}"
      puts "❌ Error backtrace: #{e.backtrace.first(3).join('\n')}"
      raise e
    end
  end
end

class WebSocketConnection < EventMachine::Connection
  attr_accessor :player_id
  
  def initialize(game_server)
    @game_server = game_server
    @handshake_completed = false
    @buffer = ''
  end

  def post_init
    puts "🔌 New connection established"
  end

  def receive_data(data)
    @buffer += data
    
    unless @handshake_completed
      if @buffer.include?("\r\n\r\n")
        handle_handshake
      end
    else
      process_websocket_frames
    end
  end

  def handle_handshake
    lines = @buffer.split("\r\n")
    headers = {}
    
    lines.each do |line|
      if line.include?(':')
        key, value = line.split(':', 2)
        headers[key.strip.downcase] = value.strip
      end
    end
    
    if headers['upgrade'] == 'websocket' && headers['connection'].downcase.include?('upgrade')
      websocket_key = headers['sec-websocket-key']
      
      if websocket_key
        puts "🔑 WebSocket key: #{websocket_key}"
        
        # Generate accept key
        accept_key = Base64.strict_encode64(Digest::SHA1.digest(websocket_key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'))
        
        # Send handshake response
        response = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          "Sec-WebSocket-Accept: #{accept_key}",
          "",
          ""
        ].join("\r\n")
        
        send_data(response)
        puts "📤 Sending handshake response"
        
        @handshake_completed = true
        @buffer = ''
        
        # Handle the connection in the game server
        @game_server.handle_connection(self)
      end
    end
  end

  def process_websocket_frames
    while @buffer.length >= 2
      # Parse frame header
      first_byte = @buffer[0].ord
      second_byte = @buffer[1].ord
      
      fin = (first_byte & 0x80) != 0
      opcode = first_byte & 0x0F
      masked = (second_byte & 0x80) != 0
      payload_length = second_byte & 0x7F
      
      header_length = 2
      
      # Extended payload length
      if payload_length == 126
        return if @buffer.length < 4
        payload_length = (@buffer[2].ord << 8) | @buffer[3].ord
        header_length = 4
      elsif payload_length == 127
        return if @buffer.length < 10
        payload_length = 0
        (2..9).each do |i|
          payload_length = (payload_length << 8) | @buffer[i].ord
        end
        header_length = 10
      end
      
      # Masking key
      if masked
        return if @buffer.length < header_length + 4
        mask = @buffer[header_length, 4].bytes.to_a
        header_length += 4
      end
      
      # Check if we have the full frame
      total_length = header_length + payload_length
      return if @buffer.length < total_length
      
      # Extract payload
      payload = @buffer[header_length, payload_length]
      
      # Unmask payload if needed
      if masked
        payload = payload.bytes.map.with_index { |byte, i| byte ^ mask[i % 4] }.pack('C*')
      end
      
      # Process the frame
      if opcode == 1 # Text frame
        begin
          message = JSON.parse(payload)
          @game_server.handle_message(@player_id, message)
        rescue JSON::ParserError => e
          puts "❌ JSON parse error: #{e.message}"
        end
      elsif opcode == 8 # Close frame
        close_connection
        return
      end
      
      # Remove processed frame from buffer
      @buffer = @buffer[total_length..-1]
    end
  end

  def unbind
    if @player_id
      @game_server.handle_client_disconnect(@player_id)
    end
  end
end

# Start the server
if __FILE__ == $0
  EventMachine.run do
    game_server = GameWebSocketServer.new
    game_server.start_cleanup_timer
    
    # Handle shutdown signals
    Signal.trap('INT') { EventMachine.stop }
    Signal.trap('TERM') { EventMachine.stop }
    
    # For now, start without SSL - we'll use a reverse proxy approach instead
    EventMachine.start_server('0.0.0.0', 9293, WebSocketConnection, game_server)
    puts "🚀 WebSocket server running on ws://0.0.0.0:9293"
    puts "🔧 Note: Use Apache/Nginx proxy for SSL termination"
    puts "Press Ctrl+C to stop"
  end
end
