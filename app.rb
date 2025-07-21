require 'sinatra'
require 'sinatra/reloader' if development?
require 'net/http'
require 'uri'
require 'json'
require 'sqlite3'
require 'securerandom'

# Configure Sinatra
configure do
  set :port, ENV['PORT'] || 4567
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
    generators = [
      { 
        id: "junior_dev",
        name: "Junior Developer", 
        baseCost: 15,
        baseProduction: 1,
        description: "Me, sometimes I write code, poorly",
        icon: "👨‍💻",
        unlockCondition: { type: "always" }
      },
      { 
        id: "senior_dev",
        name: "Senior Developer", 
        baseCost: 100,
        baseProduction: 3,
        description: "Honestly me on a good day",
        icon: "🧙‍♂️",
        unlockCondition: { type: "always" }
      },
      { 
        id: "code_monkey",
        name: "Code Monkey", 
        baseCost: 1100,
        baseProduction: 8,
        description: "Outsourcing code to the jungle/ Fiver",
        icon: "🐵",
        unlockCondition: { type: "always" }
      },
      { 
        id: "ai_assistant",
        name: "AI Assistant", 
        baseCost: 12000,
        baseProduction: 47,
        description: "Average Linkedin user",
        icon: "🤖",
        unlockCondition: { type: "always" }
      },
      { 
        id: "quantum_computer",
        name: "Quantum Computer", 
        baseCost: 130000,
        baseProduction: 260,
        description: "Encryption is now useless prepare for collapse",
        icon: "⚛️",
        unlockCondition: { type: "generator_owned", generator: "ai_assistant", count: 1 }
      },
      { 
        id: "coding_farm",
        name: "Coding Farm", 
        baseCost: 1400000,
        baseProduction: 1400,
        description: "Like the ones that make food, but worse?",
        icon: "🏭",
        unlockCondition: { type: "generator_owned", generator: "quantum_computer", count: 1 }
      },
      { 
        id: "neural_network",
        name: "Neural Network", 
        baseCost: 20000000,
        baseProduction: 7800,
        description: "The human brain, but worse",
        icon: "🧠",
        unlockCondition: { type: "generator_owned", generator: "coding_farm", count: 1 }
      },
      { 
        id: "blockchain_miner",
        name: "Blockchain Miner", 
        baseCost: 280000000,
        baseProduction: 28000,
        description: "Mining cryptocurrency to fund more code",
        icon: "⛏️",
        unlockCondition: { type: "generator_owned", generator: "neural_network", count: 1 }
      },
      { 
        id: "digital_hivemind",
        name: "Digital Hivemind", 
        baseCost: 3600000000,
        baseProduction: 125000,
        description: "Collective consciousness of all programmers",
        icon: "🧬",
        unlockCondition: { type: "generator_owned", generator: "blockchain_miner", count: 1 }
      },
      { 
        id: "time_machine",
        name: "Time Machine", 
        baseCost: 58000000000,
        baseProduction: 580000,
        description: "Steal code from the future, obviously",
        icon: "⏰",
        unlockCondition: { type: "generator_owned", generator: "digital_hivemind", count: 1 }
      },
      { 
        id: "multiverse_compiler",
        name: "Multiverse Compiler", 
        baseCost: 940000000000,
        baseProduction: 2700000,
        description: "Compiles code across infinite realities",
        icon: "🌌",
        unlockCondition: { type: "generator_owned", generator: "time_machine", count: 1 }
      },
      { 
        id: "god_algorithm",
        name: "God Algorithm", 
        baseCost: 15000000000000,
        baseProduction: 12500000,
        description: "The algorithm that created everything",
        icon: "👁️",
        unlockCondition: { type: "generator_owned", generator: "multiverse_compiler", count: 1 }
      },
      { 
        id: "code_singularity",
        name: "Code Singularity", 
        baseCost: 330000000000000,
        baseProduction: 58000000,
        description: "Me on an average wednesday tbh",
        icon: "🌌",
        unlockCondition: { type: "generator_owned", generator: "god_algorithm", count: 1 }
      }
    ]
    
    { generators: generators }.to_json
  end

  get '/api/upgrades' do
    content_type :json
    upgrades = [
      # Junior Developer Upgrades
      { 
        id: "coffee_addiction",
        name: "Coffee Addiction", 
        cost: 100,
        description: "Doubles Junior Developer output",
        icon: "☕",
        affects: "junior_dev",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "junior_dev", count: 5 }
      },
      { 
        id: "stack_overflow_premium",
        name: "Stack Overflow Premium", 
        cost: 2500,
        description: "Triples Junior Developer output",
        icon: "📚",
        affects: "junior_dev",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "coffee_addiction" }
      },
      
      # Senior Developer Upgrades
      { 
        id: "agile_methodology",
        name: "Agile Methodology", 
        cost: 800,
        description: "Doubles Senior Developer output",
        icon: "🔄",
        affects: "senior_dev",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "senior_dev", count: 3 }
      },
      { 
        id: "code_review_skills",
        name: "Code Review Skills", 
        cost: 15000,
        description: "Triples Senior Developer output",
        icon: "👀",
        affects: "senior_dev",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "agile_methodology" }
      },
      
      # Code Monkey Upgrades
      { 
        id: "banana_incentive",
        name: "Banana Incentive", 
        cost: 8000,
        description: "Doubles Code Monkey output",
        icon: "🍌",
        affects: "code_monkey",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "code_monkey", count: 2 }
      },
      { 
        id: "jungle_gym_office",
        name: "Jungle Gym Office", 
        cost: 120000,
        description: "Quadruples Code Monkey output",
        icon: "🌴",
        affects: "code_monkey",
        multiplier: 4,
        unlockCondition: { type: "upgrade_owned", upgrade: "banana_incentive" }
      },
      
      # AI Assistant Upgrades
      { 
        id: "neural_optimization",
        name: "Neural Optimization", 
        cost: 80000,
        description: "Doubles AI Assistant output",
        icon: "⚡",
        affects: "ai_assistant",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "ai_assistant", count: 1 }
      },
      { 
        id: "consciousness_upgrade",
        name: "Consciousness Upgrade", 
        cost: 1200000,
        description: "Triples AI Assistant output",
        icon: "🧩",
        affects: "ai_assistant",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "neural_optimization" }
      },
      
      # Quantum Computer Upgrades
      { 
        id: "quantum_entanglement",
        name: "Quantum Entanglement", 
        cost: 900000,
        description: "Doubles Quantum Computer output",
        icon: "🔗",
        affects: "quantum_computer",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "quantum_computer", count: 1 }
      },
      { 
        id: "superposition_coding",
        name: "Superposition Coding", 
        cost: 18000000,
        description: "Triples Quantum Computer output",
        icon: "⚛️",
        affects: "quantum_computer",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "quantum_entanglement" }
      },
      
      # Coding Farm Upgrades
      { 
        id: "hydroponic_setup",
        name: "Hydroponic Setup", 
        cost: 12000000,
        description: "Doubles Coding Farm output",
        icon: "💧",
        affects: "coding_farm",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "coding_farm", count: 1 }
      },
      { 
        id: "automation_drones",
        name: "Automation Drones", 
        cost: 240000000,
        description: "Quadruples Coding Farm output",
        icon: "🚁",
        affects: "coding_farm",
        multiplier: 4,
        unlockCondition: { type: "upgrade_owned", upgrade: "hydroponic_setup" }
      },
      
      # Neural Network Upgrades
      { 
        id: "deep_learning",
        name: "Deep Learning", 
        cost: 180000000,
        description: "Doubles Neural Network output",
        icon: "🔍",
        affects: "neural_network",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "neural_network", count: 1 }
      },
      { 
        id: "backpropagation_boost",
        name: "Backpropagation Boost", 
        cost: 3500000000,
        description: "Triples Neural Network output",
        icon: "↩️",
        affects: "neural_network",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "deep_learning" }
      },
      
      # Blockchain Miner Upgrades
      { 
        id: "asic_miners",
        name: "ASIC Miners", 
        cost: 2500000000,
        description: "Doubles Blockchain Miner output",
        icon: "🔧",
        affects: "blockchain_miner",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "blockchain_miner", count: 1 }
      },
      { 
        id: "proof_of_stake",
        name: "Proof of Stake", 
        cost: 48000000000,
        description: "Triples Blockchain Miner output",
        icon: "🎯",
        affects: "blockchain_miner",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "asic_miners" }
      },
      
      # Digital Hivemind Upgrades
      { 
        id: "consciousness_link",
        name: "Consciousness Link", 
        cost: 32000000000,
        description: "Doubles Digital Hivemind output",
        icon: "🔗",
        affects: "digital_hivemind",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "digital_hivemind", count: 1 }
      },
      { 
        id: "collective_intelligence",
        name: "Collective Intelligence", 
        cost: 620000000000,
        description: "Quadruples Digital Hivemind output",
        icon: "🧠",
        affects: "digital_hivemind",
        multiplier: 4,
        unlockCondition: { type: "upgrade_owned", upgrade: "consciousness_link" }
      },
      
      # Time Machine Upgrades
      { 
        id: "temporal_stabilizer",
        name: "Temporal Stabilizer", 
        cost: 520000000000,
        description: "Doubles Time Machine output",
        icon: "⚖️",
        affects: "time_machine",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "time_machine", count: 1 }
      },
      { 
        id: "paradox_resolver",
        name: "Paradox Resolver", 
        cost: 9800000000000,
        description: "Triples Time Machine output",
        icon: "🔀",
        affects: "time_machine",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "temporal_stabilizer" }
      },
      
      # Multiverse Compiler Upgrades
      { 
        id: "dimensional_bridge",
        name: "Dimensional Bridge", 
        cost: 8400000000000,
        description: "Doubles Multiverse Compiler output",
        icon: "🌉",
        affects: "multiverse_compiler",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "multiverse_compiler", count: 1 }
      },
      { 
        id: "reality_merger",
        name: "Reality Merger", 
        cost: 160000000000000,
        description: "Quintuples Multiverse Compiler output",
        icon: "🌀",
        affects: "multiverse_compiler",
        multiplier: 5,
        unlockCondition: { type: "upgrade_owned", upgrade: "dimensional_bridge" }
      },
      
      # God Algorithm Upgrades
      { 
        id: "divine_optimization",
        name: "Divine Optimization", 
        cost: 135000000000000,
        description: "Doubles God Algorithm output",
        icon: "✨",
        affects: "god_algorithm",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "god_algorithm", count: 1 }
      },
      { 
        id: "omniscient_debugging",
        name: "Omniscient Debugging", 
        cost: 2600000000000000,
        description: "Triples God Algorithm output",
        icon: "👁️‍🗨️",
        affects: "god_algorithm",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "divine_optimization" }
      },
      
      # Code Singularity Upgrades
      { 
        id: "universal_constants",
        name: "Universal Constants", 
        cost: 2900000000000000,
        description: "Doubles Code Singularity output",
        icon: "🌟",
        affects: "code_singularity",
        multiplier: 2,
        unlockCondition: { type: "generator_owned", generator: "code_singularity", count: 1 }
      },
      { 
        id: "reality_rewrite",
        name: "Reality Rewrite", 
        cost: 56000000000000000,
        description: "Code Singularity produces 10x more",
        icon: "🔄",
        affects: "code_singularity",
        multiplier: 10,
        unlockCondition: { type: "upgrade_owned", upgrade: "universal_constants" }
      },
      
      # Global Upgrades
      { 
        id: "global_efficiency",
        name: "Global Efficiency", 
        cost: 50000,
        description: "All generators produce 50% more",
        icon: "🌍",
        affects: "all",
        multiplier: 1.5,
        unlockCondition: { type: "total_generators", count: 10 }
      },
      { 
        id: "quantum_acceleration",
        name: "Quantum Acceleration", 
        cost: 2000000,
        description: "All generators produce 100% more",
        icon: "🚀",
        affects: "all",
        multiplier: 2,
        unlockCondition: { type: "upgrade_owned", upgrade: "global_efficiency" }
      },
      { 
        id: "cosmic_synergy",
        name: "Cosmic Synergy", 
        cost: 100000000000,
        description: "All generators produce 200% more",
        icon: "💫",
        affects: "all",
        multiplier: 3,
        unlockCondition: { type: "upgrade_owned", upgrade: "quantum_acceleration" }
      }
    ]
    
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
