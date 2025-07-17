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
