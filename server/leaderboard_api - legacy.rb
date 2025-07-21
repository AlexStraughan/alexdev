# Sinatra-based Ruby API for leaderboard
require 'sinatra'
require 'json'
require 'sqlite3'
require 'securerandom'

set :port, 5678

# Track active players
ACTIVE_PLAYERS = {}
PLAYER_TIMEOUT = 360 # 6 minutes (give 1 minute buffer after 5-minute heartbeat)

# Track chat messages
CHAT_MESSAGES = []
MAX_CHAT_MESSAGES = 50
CHAT_MESSAGE_TIMEOUT = 300 # 5 minutes

before do
  response.headers['Access-Control-Allow-Origin'] = '*'
  response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
end

options '*' do
  200
end

# Game API endpoints
get '/greeting' do
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

get '/generators' do
  content_type :json
  generators = [
    { 
      id: "junior_dev",
      name: "Junior Developer", 
      baseCost: 15,
      baseProduction: 1,
      description: "A fresh coder learning the ropes",
      icon: "👨‍💻",
      unlockCondition: { type: "always" }
    },
    { 
      id: "senior_dev",
      name: "Senior Developer", 
      baseCost: 100,
      baseProduction: 3,
      description: "Experienced programmer with deep knowledge",
      icon: "🧙‍♂️",
      unlockCondition: { type: "always" }
    },
    { 
      id: "code_monkey",
      name: "Code Monkey", 
      baseCost: 1100,
      baseProduction: 8,
      description: "Automated coding assistant",
      icon: "🐵",
      unlockCondition: { type: "always" }
    },
    { 
      id: "ai_assistant",
      name: "AI Assistant", 
      baseCost: 12000,
      baseProduction: 47,
      description: "Advanced AI that writes code automatically",
      icon: "🤖",
      unlockCondition: { type: "always" }
    },
    { 
      id: "quantum_computer",
      name: "Quantum Computer", 
      baseCost: 130000,
      baseProduction: 260,
      description: "Quantum processing power for ultimate coding",
      icon: "⚛️",
      unlockCondition: { type: "generator_owned", generator: "ai_assistant", count: 1 }
    },
    { 
      id: "coding_farm",
      name: "Coding Farm", 
      baseCost: 1400000,
      baseProduction: 1400,
      description: "Massive server farm dedicated to code generation",
      icon: "🏭",
      unlockCondition: { type: "generator_owned", generator: "quantum_computer", count: 1 }
    },
    { 
      id: "neural_network",
      name: "Neural Network", 
      baseCost: 20000000,
      baseProduction: 7800,
      description: "Self-learning neural network that evolves code",
      icon: "🧠",
      unlockCondition: { type: "generator_owned", generator: "coding_farm", count: 1 }
    },
    { 
      id: "code_singularity",
      name: "Code Singularity", 
      baseCost: 330000000,
      baseProduction: 44000,
      description: "The ultimate coding consciousness",
      icon: "🌌",
      unlockCondition: { type: "generator_owned", generator: "neural_network", count: 1 }
    }
  ]
  
  { generators: generators }.to_json
end

DB = SQLite3::Database.new 'leaderboard.db'
DB.execute <<-SQL
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
SQL

# Create game state table for server-side persistence
DB.execute <<-SQL
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
SQL

# POST /submit_score { name: "Player", score: 1000 }
post '/submit_score' do
  data = JSON.parse(request.body.read)
  name = data['name']
  score = data['score']
  halt 400, { error: 'Invalid score' }.to_json unless score.is_a?(Integer) && score >= 0
  
  # Check if player already exists
  existing = DB.execute("SELECT id, score FROM scores WHERE name = ? LIMIT 1", [name])
  
  if existing.empty?
    # Insert new player
    DB.execute("INSERT INTO scores (name, score) VALUES (?, ?)", [name, score])
  else
    # Update existing player only if new score is higher
    existing_score = existing[0][1]
    if score > existing_score
      DB.execute("UPDATE scores SET score = ?, created_at = CURRENT_TIMESTAMP WHERE name = ?", [score, name])
    end
  end
  
  { status: 'ok' }.to_json
end

# GET /leaderboard
get '/leaderboard' do
  rows = DB.execute("SELECT name, score FROM scores ORDER BY score DESC LIMIT 10")
  { leaderboard: rows.map { |name, score| { name: name, score: score } } }.to_json
end

# Player tracking endpoints
post '/player-activity' do
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

get '/active-players' do
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
# GET /game-state/:player_id - Get player's game state
get '/game-state/:player_id' do
  content_type :json
  
  begin
    player_id = params[:player_id]
    return { error: 'Invalid player ID' }.to_json if player_id.nil? || player_id.strip.empty?
    
    # Get game state from database
    result = DB.execute("SELECT * FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
    
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
      
      { success: true, state: state }.to_json
    end
  rescue => e
    status 500
    { error: "Error fetching game state: #{e.message}" }.to_json
  end
end

# POST /game-state/:player_id - Update player's game state
post '/game-state/:player_id' do
  content_type :json
  
  begin
    request.body.rewind
    data = JSON.parse(request.body.read)
    
    player_id = params[:player_id]
    return { error: 'Invalid player ID' }.to_json if player_id.nil? || player_id.strip.empty?
    
    # Extract state data
    state = data['state']
    return { error: 'Invalid state data' }.to_json unless state.is_a?(Hash)
    
    # Check if player exists
    existing = DB.execute("SELECT id FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
    
    if existing.empty?
      # Insert new player state
      DB.execute(
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
      DB.execute(
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
    
    { success: true }.to_json
  rescue => e
    status 500
    { error: "Error saving game state: #{e.message}" }.to_json
  end
end

# Admin endpoint to get all players for console management
get '/admin/players' do
  content_type :json
  
  begin
    players = DB.execute("SELECT player_id, player_name, points, total_clicks, generators, upgrades, updated_at FROM game_states ORDER BY points DESC")
    
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
post '/admin/player/:player_id' do
  content_type :json
  
  begin
    request.body.rewind
    data = JSON.parse(request.body.read)
    
    player_id = params[:player_id]
    return { error: 'Invalid player ID' }.to_json if player_id.nil? || player_id.strip.empty?
    
    # Build update query dynamically based on provided fields
    updates = []
    values = []
    
    if data['points']
      updates << "points = ?"
      values << data['points']
    end
    
    if data['add_generator']
      # Get current generators
      current = DB.execute("SELECT generators FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
      if current.empty?
        return { error: 'Player not found' }.to_json
      end
      
      generators = JSON.parse(current[0][0] || '{}')
      generators[data['add_generator']] = (generators[data['add_generator']] || 0) + (data['generator_count'] || 1)
      
      updates << "generators = ?"
      values << JSON.generate(generators)
    end
    
    if data['add_upgrade']
      # Get current upgrades
      current = DB.execute("SELECT upgrades FROM game_states WHERE player_id = ? LIMIT 1", [player_id])
      if current.empty?
        return { error: 'Player not found' }.to_json
      end
      
      upgrades = JSON.parse(current[0][0] || '{}')
      upgrades[data['add_upgrade']] = true
      
      updates << "upgrades = ?"
      values << JSON.generate(upgrades)
    end
    
    if updates.empty?
      return { error: 'No valid updates provided' }.to_json
    end
    
    # Add updated timestamp
    updates << "updated_at = CURRENT_TIMESTAMP"
    values << player_id
    
    # Execute update
    DB.execute("UPDATE game_states SET #{updates.join(', ')} WHERE player_id = ?", values)
    
    { success: true }.to_json
  rescue => e
    status 500
    { error: "Error updating player: #{e.message}" }.to_json
  end
end

# Chat endpoints
post '/chat-message' do
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

get '/chat-messages' do
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
