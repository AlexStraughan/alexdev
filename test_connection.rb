#!/usr/bin/env ruby

require 'faye/websocket'
require 'eventmachine'
require 'json'

puts "🧪 Testing WebSocket server connection..."

EventMachine.run do
  App = lambda do |env|
    if Faye::WebSocket.websocket?(env)
      puts "🔌 WebSocket connection attempt detected"
      ws = Faye::WebSocket.new(env)
      
      ws.on :open do |event|
        puts "✅ WebSocket connection opened successfully"
        ws.send(JSON.generate({ type: 'connected', message: 'Hello from test server!' }))
      end

      ws.on :message do |event|
        puts "📨 Received message: #{event.data}"
        ws.send(JSON.generate({ type: 'echo', message: event.data }))
      end

      ws.on :close do |event|
        puts "🔌 WebSocket connection closed: #{event.code} - #{event.reason}"
      end

      ws.on :error do |event|
        puts "❌ WebSocket error: #{event.message}"
      end
      
      ws.rack_response
    else
      puts "🌐 HTTP request received"
      [200, {'Content-Type' => 'text/plain'}, ['Test WebSocket server running']]
    end
  end
  
  puts "🚀 Test WebSocket server running on ws://localhost:9292"
  
  # Use a different port for testing
  require 'thin'
  Thin::Server.new('0.0.0.0', 9292, App).start!
end
