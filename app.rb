require 'sinatra'
require 'sinatra/reloader' if development?
require 'net/http'
require 'uri'
require 'json'
require 'sqlite3'
require 'securerandom'
require_relative 'game_data'

# Configure Sinatra
configure do
  set :port, ENV['PORT'] || 4568
  set :bind, '0.0.0.0'
  enable :sessions
end

# Track active players
ACTIVE_PLAYERS = {}
PLAYER_TIMEOUT = 360 # 6 minutes (give 1 minute buffer after 5-minute heartbeat)

# Track chat messages
CHAT_MESSAGES = []
MAX_CHAT_MESSAGES = 50
CHAT_MESSAGE_TIMEOUT = 300 # 5 minutes

# CORS headers for API endpoints
before '/api/*' do
  response.headers['Access-Control-Allow-Origin'] = '*'
  response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
end

options '/api/*' do
  200
end

# Game API endpoints
get '/api/greeting' do
    content_type :json
    greetings = [
      "Code your way to success! 🚀",
      "Building the digital future! 💻",
      "Every click brings more power! ⚡",
      "The code flows through you! ✨",
      "Generating infinite possibilities! 🌟"
    ]
    
    { greeting: greetings.sample }.to_json
end

get '/api/generators' do
    content_type :json
    generators = GameData.load_generators
    { generators: generators }.to_json
end

get '/api/upgrades' do
    content_type :json
    upgrades = GameData.load_upgrades
    { upgrades: upgrades }.to_json
end

# Leaderboard endpoints
get '/api/leaderboard' do
    content_type :json
    
    begin
      db = SQLite3::Database.new('leaderboard.db')
      db.results_as_hash = true
      
      # Get players from game_states table, ordered by total_points_earned
      players = db.execute('SELECT player_name, total_points_earned, total_clicks, generators, upgrades, updated_at FROM game_states WHERE player_name IS NOT NULL ORDER BY total_points_earned DESC LIMIT 10')
      db.close
      
      leaderboard = players.map do |row|
        {
          name: row['player_name'],
          score: row['total_points_earned'],
          total_clicks: row['total_clicks'],
          generators: JSON.parse(row['generators'] || '{}'),
          upgrades: JSON.parse(row['upgrades'] || '{}'),
          updated_at: row['updated_at']
        }
      end
      
      { leaderboard: leaderboard }.to_json
    rescue => e
      puts "❌ Leaderboard error: #{e.message}"
      { leaderboard: [] }.to_json
    end
  end

post '/api/submit_score' do
    content_type :json
    
    begin
      request.body.rewind
      data = JSON.parse(request.body.read)
      
      name = data['name']
      score = data['score'].to_i
      
      if name.nil? || name.strip.empty? || score <= 0
        status 400
        return { error: 'Invalid name or score' }.to_json
      end
      
      # Initialize database if it doesn't exist
      db = SQLite3::Database.new('leaderboard.db')
      
      # Create game state table for server-side persistence
      db.execute <<-SQL
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      SQL
      
      # Check if player exists by name (for leaderboard submission)
      existing = db.execute('SELECT total_points_earned FROM game_states WHERE player_name = ?', [name]).first
      
      if existing
        # Update only if new score is higher
        if score > existing[0]
          db.execute('UPDATE game_states SET total_points_earned = ?, updated_at = CURRENT_TIMESTAMP WHERE player_name = ?', [score, name])
          db.close
          { success: true, message: 'High score updated!' }.to_json
        else
          db.close
          { success: false, message: 'Score not higher than existing record' }.to_json
        end
      else
        # Insert new player with generated ID
        player_id = SecureRandom.uuid
        db.execute('INSERT INTO game_states (player_id, player_name, total_points_earned) VALUES (?, ?, ?)', [player_id, name, score])
        db.close
        { success: true, message: 'Score submitted successfully!' }.to_json
      end
    rescue => e
      status 500
      { error: "Database error: #{e.message}" }.to_json
    end
  end


  # Player tracking endpoints - Available in all environments
post '/api/player-activity' do
    content_type :json
    
    begin
      request.body.rewind
      data = JSON.parse(request.body.read)
      
      player_id = data['player_id']
      player_name = data['player_name'] || "Player #{player_id&.slice(0, 6)}"
      
      return { error: 'Invalid player ID' }.to_json if player_id.nil? || player_id.strip.empty?
      
      # Track first_seen for playtime calculation
      now = Time.now
      existing_player = ACTIVE_PLAYERS[player_id]
      first_seen = existing_player && existing_player['first_seen'] ? existing_player['first_seen'] : now
      
      # Update player activity
      ACTIVE_PLAYERS[player_id] = {
        'id' => player_id,
        'name' => player_name,
        'last_seen' => now,
        'first_seen' => first_seen,
        'score' => data['score'] || 0,
        'points_per_second' => data['points_per_second'] || 0,
        'generators_owned' => data['generators_owned'] || 0
      }
      
      { success: true, player_id: player_id }.to_json
    rescue => e
      status 500
      { error: "Player tracking error: #{e.message}" }.to_json
    end
  end

get '/api/active-players' do
    content_type :json
    
    # Remove inactive players
    current_time = Time.now
    ACTIVE_PLAYERS.reject! do |id, player|
      current_time - player['last_seen'] > PLAYER_TIMEOUT
    end
    
    # Return active players with playtime data
    {
      players: ACTIVE_PLAYERS.values.map do |player|
        {
          'id' => player['id'],
          'name' => player['name'],
          'score' => player['score'],
          'points_per_second' => player['points_per_second'],
          'generators_owned' => player['generators_owned'],
          'first_seen' => player['first_seen']&.to_i,
          'last_seen' => player['last_seen']&.to_i,
          'playtime_seconds' => player['first_seen'] ? (player['last_seen'] - player['first_seen']).to_i : 0
        }
      end,
      count: ACTIVE_PLAYERS.size
    }.to_json
  end

  # Game State API Endpoints
  # GET /api/game-state/:player_id - Get player's game state
get '/api/game-state/:player_id' do
    content_type :json
    
    begin
      player_id = params[:player_id]
      return { error: 'Invalid player ID' }.to_json if player_id.nil? || player_id.strip.empty?
      
      db = SQLite3::Database.new('leaderboard.db')
      
      # Get game state from database
      result = db.execute("SELECT * FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
      
      if result.empty?
        # Return default state for new players
        default_state = {
          player_id: player_id,
          points: 0,
          total_clicks: 0,
          total_points_earned: 0,
          click_power: 1,
          crit_chance: 0,
          crit_multiplier: 2,
          generators: {},
          upgrades: {},
          achievements: [],
          game_hub_revealed: false,
          upgrades_tab_unlocked: false
        }
        
        db.close
        { success: true, state: default_state }.to_json
      else
        # Parse existing state
        row = result[0]
        state = {
          player_id: row[1],
          player_name: row[2],
          points: row[3],
          total_clicks: row[4],
          total_points_earned: row[5],
          click_power: row[6],
          crit_chance: row[7],
          crit_multiplier: row[8],
          generators: JSON.parse(row[9] || '{}'),
          upgrades: JSON.parse(row[10] || '{}'),
          achievements: JSON.parse(row[11] || '[]'),
          game_hub_revealed: row[12] == 1,
          upgrades_tab_unlocked: row[13] == 1
        }
        
        db.close
        { success: true, state: state }.to_json
      end
    rescue => e
      status 500
      { error: "Error fetching game state: #{e.message}" }.to_json
    end
  end

  # POST /api/game-state/:player_id - Update player's game state
post '/api/game-state/:player_id' do
    content_type :json
    
    begin
      request.body.rewind
      data = JSON.parse(request.body.read)
      
      player_id = params[:player_id]
      return { error: 'Invalid player ID' }.to_json if player_id.nil? || player_id.strip.empty?
      
      # Extract state data
      state = data['state']
      return { error: 'Invalid state data' }.to_json unless state.is_a?(Hash)
      
      db = SQLite3::Database.new('leaderboard.db')
      
      # Check if player exists
      existing = db.execute("SELECT id FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
      
      if existing.empty?
        # Insert new player state
        db.execute(
          "INSERT INTO game_states (player_id, player_name, points, total_clicks, total_points_earned, click_power, crit_chance, crit_multiplier, generators, upgrades, achievements, game_hub_revealed, upgrades_tab_unlocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            player_id,
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
            state['upgrades_tab_unlocked'] ? 1 : 0
          ]
        )
      else
        # Update existing player state
        db.execute(
          "UPDATE game_states SET player_name = ?, points = ?, total_clicks = ?, total_points_earned = ?, click_power = ?, crit_chance = ?, crit_multiplier = ?, generators = ?, upgrades = ?, achievements = ?, game_hub_revealed = ?, upgrades_tab_unlocked = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?",
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
            player_id
          ]
        )
      end
      
      db.close
      { success: true }.to_json
    rescue => e
      status 500
      { error: "Error saving game state: #{e.message}" }.to_json
    end
  end

  # Admin endpoint to get all players for console management
get '/api/admin/players' do
    content_type :json
    
    begin
      db = SQLite3::Database.new('leaderboard.db')
      players = db.execute("SELECT player_id, player_name, points, total_clicks, generators, upgrades, updated_at FROM game_states ORDER BY points DESC")
      
      db.close
      {
        players: players.map do |row|
          {
            player_id: row[0],
            player_name: row[1],
            points: row[2],
            total_clicks: row[3],
            generators: JSON.parse(row[4] || '{}'),
            upgrades: JSON.parse(row[5] || '{}'),
            updated_at: row[6]
          }
        end
      }.to_json
    rescue => e
      status 500
      { error: "Error fetching players: #{e.message}" }.to_json
    end
  end

  # Admin endpoint to modify player state
post '/api/admin/player/:player_id' do
    content_type :json
    
    begin
      request.body.rewind
      data = JSON.parse(request.body.read)
      
      player_id = params[:player_id]
      return { error: 'Invalid player ID' }.to_json if player_id.nil? || player_id.strip.empty?
      
      db = SQLite3::Database.new('leaderboard.db')
      
      # Build update query dynamically based on provided fields
      updates = []
      values = []
      
      if data['points']
        updates << "points = ?"
        values << data['points']
      end
      
      if data['add_generator']
        # Get current generators
        current = db.execute("SELECT generators FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
        if current.empty?
          db.close
          return { error: 'Player not found' }.to_json
        end
        
        generators = JSON.parse(current[0][0] || '{}')
        generators[data['add_generator']] = (generators[data['add_generator']] || 0) + (data['generator_count'] || 1)
        
        updates << "generators = ?"
        values << JSON.generate(generators)
      end
      
      if data['add_upgrade']
        # Get current upgrades
        current = db.execute("SELECT upgrades FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
        if current.empty?
          db.close
          return { error: 'Player not found' }.to_json
        end
        
        upgrades = JSON.parse(current[0][0] || '{}')
        upgrades[data['add_upgrade']] = true
        
        updates << "upgrades = ?"
        values << JSON.generate(upgrades)
      end
      
      if updates.empty?
        db.close
        return { error: 'No valid updates provided' }.to_json
      end
      
      # Add updated timestamp
      updates << "updated_at = CURRENT_TIMESTAMP"
      values << player_id
      
      # Execute update
      db.execute("UPDATE game_states SET #{updates.join(', ')} WHERE player_id = ?", values)
      
      db.close
      { success: true }.to_json
    rescue => e
      status 500
      { error: "Error updating player: #{e.message}" }.to_json
    end
  end

  # Chat endpoints
post '/api/chat-message' do
    content_type :json
    
    begin
      request.body.rewind
      data = JSON.parse(request.body.read)
      
      player_id = data['player_id']
      message = data['message']
      
      return { error: 'Invalid player ID' }.to_json if player_id.nil? || player_id.strip.empty?
      return { error: 'Invalid message' }.to_json if message.nil? || message.strip.empty?
      return { error: 'Message too long' }.to_json if message.length > 200
      
      # Get player info
      player = ACTIVE_PLAYERS[player_id]
      return { error: 'Player not found' }.to_json unless player
      
      # Create chat message
      chat_message = {
        'id' => SecureRandom.uuid,
        'player_id' => player_id,
        'player_name' => player['name'],
        'message' => message.strip,
        'timestamp' => Time.now,
        'expires_at' => Time.now + CHAT_MESSAGE_TIMEOUT
      }
      
      # Add to messages array
      CHAT_MESSAGES << chat_message
      
      # Keep only recent messages
      if CHAT_MESSAGES.length > MAX_CHAT_MESSAGES
        CHAT_MESSAGES.shift
      end
      
      { success: true, message_id: chat_message['id'] }.to_json
    rescue => e
      status 500
      { error: "Chat error: #{e.message}" }.to_json
    end
  end

get '/api/chat-messages' do
    content_type :json
    
    begin
      current_time = Time.now
      
      # Remove expired messages
      CHAT_MESSAGES.reject! do |msg|
        current_time > msg['expires_at']
      end
      
      # Return recent messages
      {
        messages: CHAT_MESSAGES.map do |msg|
          {
            id: msg['id'],
            player_id: msg['player_id'],
            player_name: msg['player_name'],
            message: msg['message'],
            timestamp: msg['timestamp'].to_i,
            age: (current_time - msg['timestamp']).to_i
          }
        end
      }.to_json
    rescue => e
      status 500
      { error: "Error fetching messages: #{e.message}" }.to_json
    end
  end

  # Offline save endpoint for sendBeacon API
post '/api/save-offline' do
    content_type :json
    
    begin
      # Parse JSON body
      request_body = request.body.read
      data = JSON.parse(request_body)
      
      # Extract game data
      game_player_id = data['game_player_id']
      state = data['state']
      
      return { error: 'Missing player ID or state' }.to_json unless game_player_id && state
      
      # Open database connection
      db = SQLite3::Database.new('leaderboard.db')
      
      # Check if player exists
      existing = db.execute("SELECT id FROM game_states WHERE player_id = ? LIMIT 1", [game_player_id])
      
      if existing.empty?
        # Insert new player state
        db.execute(
          "INSERT INTO game_states (player_id, player_name, points, total_clicks, total_points_earned, click_power, crit_chance, crit_multiplier, generators, upgrades, achievements, game_hub_revealed, upgrades_tab_unlocked, last_active_time, offline_earnings_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
            state['offline_earnings_rate'] || 0.4
          ]
        )
      else
        # Update existing player state
        db.execute(
          "UPDATE game_states SET player_name = ?, points = ?, total_clicks = ?, total_points_earned = ?, click_power = ?, crit_chance = ?, crit_multiplier = ?, generators = ?, upgrades = ?, achievements = ?, game_hub_revealed = ?, upgrades_tab_unlocked = ?, last_active_time = ?, offline_earnings_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?",
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
            game_player_id
          ]
        )
      end
      
      db.close
      { success: true }.to_json
      
    rescue => e
      status 500
      { error: "Offline save error: #{e.message}" }.to_json
    end
  end

# Homepage route
get '/' do
  erb :index
end

# Direct WebSocket test route
get '/direct-websocket-test.html' do
  send_file File.join(settings.root, 'direct-websocket-test.html')
end

# Simple WebSocket test route
get '/simple-websocket-test.html' do
  send_file File.join(settings.root, 'simple-websocket-test.html')
end
