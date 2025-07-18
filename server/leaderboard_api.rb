# Sinatra-based Ruby API for leaderboard
require 'sinatra'
require 'json'
require 'sqlite3'

set :port, 5678

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
