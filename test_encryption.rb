#!/usr/bin/env ruby
# Test script to verify enhanced WebSocket encryption features

require_relative 'server/game_encryption'

puts "🔒 Testing Enhanced WebSocket Encryption Features"
puts "=" * 50

# Test 1: Rate limiting
puts "\n1. Testing Rate Limiting:"
player_id = "test_player_123"

5.times do |i|
  result = GameEncryption.check_rate_limit(player_id, 'save_game_state')
  puts "  Attempt #{i+1}: #{result ? '✅ Allowed' : '❌ Rate limited'}"
end

# Test 2: Token generation and verification
puts "\n2. Testing JWT Token System:"
token = GameEncryption.generate_player_token("player_123", "TestPlayer", "127.0.0.1")
puts "  Generated token: #{token[0..50]}..."

verification = GameEncryption.verify_player_token(token, "player_123", "127.0.0.1")
puts "  Token verification: #{verification ? '✅ Valid' : '❌ Invalid'}"

# Test 3: Data encryption/decryption
puts "\n3. Testing Data Encryption:"
test_data = {
  'points' => 1000,
  'total_points_earned' => 5000,
  'total_clicks' => 100,
  'generators' => {'junior_dev' => 5}
}

encrypted = GameEncryption.encrypt_game_data(test_data)
puts "  Encrypted data: #{encrypted[0..50]}..."

decrypted = GameEncryption.decrypt_game_data(encrypted)
puts "  Decryption success: #{decrypted == test_data ? '✅ Valid' : '❌ Invalid'}"

# Test 4: Integrity hash
puts "\n4. Testing Integrity Hash:"
hash = GameEncryption.create_integrity_hash(test_data)
puts "  Generated hash: #{hash[0..20]}..."

validation = GameEncryption.verify_integrity_hash(test_data, hash, true)
puts "  Hash validation: #{validation ? '✅ Valid' : '❌ Invalid'}"

# Test 5: Game state validation
puts "\n5. Testing Game State Validation:"
old_state = {
  'points' => 1000,
  'total_points_earned' => 5000,
  'total_clicks' => 100,
  'generators' => '{"junior_dev": 5}'
}

new_state = {
  'points' => 1050, # Reasonable increase
  'total_points_earned' => 5050,
  'total_clicks' => 105,
  'generators' => '{"junior_dev": 5}'
}

time_elapsed = 60 # 1 minute
valid = GameEncryption.validate_game_state_change(old_state, new_state, time_elapsed, "test_player")
puts "  Valid state change: #{valid ? '✅ Valid' : '❌ Invalid'}"

# Test suspicious change
new_state_suspicious = {
  'points' => 10000, # Suspicious increase
  'total_points_earned' => 15000,
  'total_clicks' => 105,
  'generators' => '{"junior_dev": 5}'
}

valid_suspicious = GameEncryption.validate_game_state_change(old_state, new_state_suspicious, time_elapsed, "test_player")
puts "  Suspicious change: #{valid_suspicious ? '❌ Allowed (bad!)' : '✅ Blocked (good!)'}"

puts "\n🎉 Enhanced encryption system test completed!"
