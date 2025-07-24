#!/usr/bin/env ruby
# Security Setup Script for Game WebSocket Server
# This script generates secure encryption keys for production use

require 'securerandom'
require 'fileutils'

puts "🔐 Game Security Setup Script"
puts "=" * 40

# Generate secure keys
encryption_key = SecureRandom.hex(32)
jwt_secret = SecureRandom.hex(32)
hmac_secret = SecureRandom.hex(32)
admin_password = SecureRandom.alphanumeric(16)

puts "Generated secure keys:"
puts "📧 Encryption Key: #{encryption_key[0..15]}..."
puts "🎫 JWT Secret: #{jwt_secret[0..15]}..."
puts "🔒 HMAC Secret: #{hmac_secret[0..15]}..."
puts "👑 Admin Password: #{admin_password}"
puts

# Create .env file
env_content = <<~ENV
  # Game Security Configuration - Generated #{Time.now}
  # DO NOT COMMIT THIS FILE TO VERSION CONTROL!

  # Encryption keys for secure WebSocket communication
  GAME_ENCRYPTION_KEY=#{encryption_key}
  JWT_SECRET=#{jwt_secret}
  HMAC_SECRET=#{hmac_secret}

  # Admin password for WebSocket admin commands
  ADMIN_PASSWORD=#{admin_password}

  # Server configuration
  PORT=3001
  HOST=0.0.0.0

  # Security settings
  MAX_CONNECTIONS_PER_IP=10
  RATE_LIMIT_WINDOW=60
  RATE_LIMIT_MAX_REQUESTS=100
ENV

File.write('.env', env_content)

# Add .env to .gitignore if it exists
gitignore_path = '.gitignore'
if File.exist?(gitignore_path)
  gitignore_content = File.read(gitignore_path)
  unless gitignore_content.include?('.env')
    File.write(gitignore_path, gitignore_content + "\n# Environment variables\n.env\n")
    puts "✅ Added .env to .gitignore"
  end
else
  File.write(gitignore_path, "# Environment variables\n.env\n")
  puts "✅ Created .gitignore with .env"
end

puts "✅ Created .env file with secure keys"
puts "⚠️  IMPORTANT: Keep these keys secure and never commit the .env file!"
puts
puts "🚀 To start your secure server:"
puts "   ruby websocket_server.rb"
puts
puts "🔧 Admin commands will require the password: #{admin_password}"
puts "   Store this password securely!"
