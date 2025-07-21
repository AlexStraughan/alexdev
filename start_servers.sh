#!/bin/bash

# Start WebSocket Game Server
# This script starts both the WebSocket server and the main app

echo "🚀 Starting WebSocket Game Server..."

# Install gems if needed
bundle install

# Start WebSocket server in background
echo "Starting WebSocket server on port 9292..."
ruby websocket_server.rb &
WS_PID=$!

# Wait a moment for WebSocket server to start
sleep 2

# Start main app
echo "Starting main app on port 4567..."
ruby app.rb &
APP_PID=$!

echo "✅ Servers started!"
echo "🔌 WebSocket server: ws://localhost:9292"
echo "🌐 Main app: http://localhost:4567"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt signal
trap 'echo "🛑 Stopping servers..."; kill $WS_PID $APP_PID; exit' INT
wait
