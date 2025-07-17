# Ruby server-side encryption example for leaderboard anti-cheat
require 'active_support'
require 'active_support/core_ext'
require 'active_support/message_encryptor'

# Generate a secure key (store this safely, e.g. ENV variable)
KEY = ActiveSupport::KeyGenerator.new('your-secret-password').generate_key('salt', 32)
CRYPT = ActiveSupport::MessageEncryptor.new(KEY)

def encrypt_score(score)
  CRYPT.encrypt_and_sign(score)
end

def decrypt_score(encrypted_score)
  CRYPT.decrypt_and_verify(encrypted_score)
rescue ActiveSupport::MessageVerifier::InvalidSignature
  nil
end

# Example usage:
score = 12345
encrypted = encrypt_score(score)
puts "Encrypted: #{encrypted}"
decrypted = decrypt_score(encrypted)
puts "Decrypted: #{decrypted}"
