#!/usr/bin/env ruby

# Admin Console Helper for Game State Management
# Usage: ruby admin_console.rb [dev|prod] [command] [args...]

require 'net/http'
require 'uri'
require 'json'

class GameAdminConsole
  def initialize(environment = 'dev')
    @base_url = case environment
                when 'dev'
                  'http://localhost:4567'
                when 'prod'
                  'http://localhost:5678'
                else
                  raise "Invalid environment: #{environment}. Use 'dev' or 'prod'"
                end
    
    puts "🎮 Game Admin Console - #{environment.upcase} Environment"
    puts "Base URL: #{@base_url}"
    puts "=" * 50
  end

  def list_players
    begin
      uri = URI("#{@base_url}/api/admin/players")
      response = Net::HTTP.get_response(uri)
      
      if response.code == '200'
        data = JSON.parse(response.body)
        players = data['players']
        
        puts "📋 Active Players (#{players.length}):"
        puts "-" * 80
        printf "%-20s %-15s %-10s %-10s %-15s\n", "Player ID", "Name", "Points", "Clicks", "Last Active"
        puts "-" * 80
        
        players.each do |player|
          printf "%-20s %-15s %-10d %-10d %-15s\n", 
                 player['player_id'][0..19], 
                 (player['player_name'] || 'Anonymous')[0..14], 
                 player['points'], 
                 player['total_clicks'],
                 player['updated_at'] ? player['updated_at'][0..15] : 'Never'
        end
      else
        puts "❌ Error fetching players: #{response.code}"
      end
    rescue => e
      puts "❌ Error: #{e.message}"
    end
  end

  def give_points(player_id, points)
    modify_player(player_id, { 'points' => points.to_i })
  end

  def give_generator(player_id, generator_id, count = 1)
    modify_player(player_id, { 
      'add_generator' => generator_id, 
      'generator_count' => count.to_i 
    })
  end

  def give_upgrade(player_id, upgrade_id)
    modify_player(player_id, { 'add_upgrade' => upgrade_id })
  end

  def show_generators
    puts "🏭 Available Generators:"
    puts "-" * 40
    generators = [
      'junior_dev - Junior Developer',
      'senior_dev - Senior Developer', 
      'code_monkey - Code Monkey',
      'ai_assistant - AI Assistant',
      'quantum_computer - Quantum Computer',
      'coding_farm - Coding Farm',
      'neural_network - Neural Network',
      'code_singularity - Code Singularity'
    ]
    generators.each { |g| puts "  • #{g}" }
  end

  def show_upgrades
    puts "⚡ Available Upgrades:"
    puts "-" * 40
    upgrades = [
      'double_click - Better Mouse',
      'super_click - Mechanical Keyboard',
      'crit_chance_1 - Lucky Fingers',
      'crit_chance_2 - Perfect Timing',
      'crit_multiplier_1 - Critical Strike',
      'junior_coffee - Coffee for Juniors',
      'senior_mentorship - Senior Mentorship',
      'ai_optimization - AI Optimization'
    ]
    upgrades.each { |u| puts "  • #{u}" }
  end

  private

  def modify_player(player_id, data)
    begin
      uri = URI("#{@base_url}/api/admin/player/#{player_id}")
      http = Net::HTTP.new(uri.host, uri.port)
      
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request.body = data.to_json
      
      response = http.request(request)
      
      if response.code == '200'
        puts "✅ Player #{player_id} updated successfully!"
      else
        result = JSON.parse(response.body)
        puts "❌ Error: #{result['error']}"
      end
    rescue => e
      puts "❌ Error: #{e.message}"
    end
  end
end

# Command-line interface
if ARGV.length < 2
  puts <<~USAGE
    Usage: ruby admin_console.rb [dev|prod] [command] [args...]
    
    Commands:
      list                          - List all players
      give_points [player_id] [points] - Give points to a player
      give_generator [player_id] [generator_id] [count] - Give generator to player
      give_upgrade [player_id] [upgrade_id] - Give upgrade to player
      show_generators              - Show available generators
      show_upgrades                - Show available upgrades
    
    Examples:
      ruby admin_console.rb dev list
      ruby admin_console.rb prod give_points player_123 10000
      ruby admin_console.rb dev give_generator player_123 junior_dev 5
      ruby admin_console.rb prod give_upgrade player_123 double_click
  USAGE
  exit
end

environment = ARGV[0]
command = ARGV[1]
console = GameAdminConsole.new(environment)

case command
when 'list'
  console.list_players
when 'give_points'
  if ARGV.length < 4
    puts "Usage: give_points [player_id] [points]"
    exit
  end
  console.give_points(ARGV[2], ARGV[3])
when 'give_generator'
  if ARGV.length < 4
    puts "Usage: give_generator [player_id] [generator_id] [count]"
    exit
  end
  count = ARGV[4] ? ARGV[4].to_i : 1
  console.give_generator(ARGV[2], ARGV[3], count)
when 'give_upgrade'
  if ARGV.length < 4
    puts "Usage: give_upgrade [player_id] [upgrade_id]"
    exit
  end
  console.give_upgrade(ARGV[2], ARGV[3])
when 'show_generators'
  console.show_generators
when 'show_upgrades'
  console.show_upgrades
else
  puts "Unknown command: #{command}"
  puts "Use 'ruby admin_console.rb' for usage help"
end
