require 'sinatra'
require 'sinatra/reloader' if development?
require 'net/http'
require 'uri'
require 'json'
require 'sqlite3'

# Configure Sinatra
configure do
  set :port, ENV['PORT'] || 4567
  set :bind, '0.0.0.0'
  enable :sessions
end

# Track active players
ACTIVE_PLAYERS = {}
PLAYER_TIMEOUT = 30 # seconds

# Development API endpoints (only in development)
if development?
  # CORS headers for development
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

  # Leaderboard endpoints
  get '/api/leaderboard' do
    content_type :json
    
    begin
      db = SQLite3::Database.new('leaderboard.db')
      db.results_as_hash = true
      
      scores = db.execute('SELECT name, score FROM scores ORDER BY score DESC LIMIT 10')
      db.close
      
      { leaderboard: scores }.to_json
    rescue => e
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
      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          score INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      SQL
      
      # Check if player exists
      existing = db.execute('SELECT score FROM scores WHERE name = ?', [name]).first
      
      if existing
        # Update only if new score is higher
        if score > existing[0]
          db.execute('UPDATE scores SET score = ? WHERE name = ?', [score, name])
          db.close
          { success: true, message: 'High score updated!' }.to_json
        else
          db.close
          { success: false, message: 'Score not higher than existing record' }.to_json
        end
      else
        # Insert new player
        db.execute('INSERT INTO scores (name, score) VALUES (?, ?)', [name, score])
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
      
      # Update player activity
      ACTIVE_PLAYERS[player_id] = {
        'id' => player_id,
        'name' => player_name,
        'last_seen' => Time.now,
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
    
    # Return active players
    {
      players: ACTIVE_PLAYERS.values,
      count: ACTIVE_PLAYERS.size
    }.to_json
  end

end

# Homepage route
get '/' do
  erb :index
end
