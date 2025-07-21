#!/bin/bash

# Server Manager Script for alexdev
# This script manages both the Ruby API server (app.rb) and WebSocket server (websocket_server.rb)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/alexdev"
APP_FILE="app.rb"
WEBSOCKET_FILE="websocket_server.rb"
APP_PORT=4568
WEBSOCKET_PORT=4567

echo -e "${BLUE}=== AlexDev Server Manager ===${NC}"
echo "Working directory: $APP_DIR"
echo "API Server: $APP_FILE (port $APP_PORT)"
echo "WebSocket Server: $WEBSOCKET_FILE (port $WEBSOCKET_PORT)"
echo ""

# Function to check if a process is running on a port
check_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    echo "$pid"
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    local service_name=$2
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Stopping $service_name on port $port...${NC}"
        echo "Found PIDs: $pids"
        kill -9 $pids 2>/dev/null
        sleep 2
        
        # Verify processes are killed
        local remaining=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining" ]; then
            echo -e "${RED}Warning: Some processes still running on port $port${NC}"
        else
            echo -e "${GREEN}✅ $service_name stopped successfully${NC}"
        fi
    else
        echo -e "${YELLOW}No processes found on port $port${NC}"
    fi
}

# Function to start the API server
start_api() {
    echo -e "${BLUE}Starting API Server...${NC}"
    cd "$APP_DIR"
    
    # Check if app.rb exists
    if [ ! -f "$APP_FILE" ]; then
        echo -e "${RED}Error: $APP_FILE not found in $APP_DIR${NC}"
        return 1
    fi
    
    # Start the server in background
    nohup env RACK_ENV=production PORT=$APP_PORT ruby "$APP_FILE" > api_server.log 2>&1 &
    local pid=$!
    echo "API Server started with PID: $pid"
    
    # Wait a moment and check if it's running
    sleep 3
    if ps -p $pid > /dev/null; then
        echo -e "${GREEN}✅ API Server is running on port $APP_PORT${NC}"
    else
        echo -e "${RED}❌ API Server failed to start. Check api_server.log${NC}"
        return 1
    fi
}

# Function to start the WebSocket server
start_websocket() {
    echo -e "${BLUE}Starting WebSocket Server...${NC}"
    cd "$APP_DIR"
    
    # Check if websocket_server.rb exists
    if [ ! -f "$WEBSOCKET_FILE" ]; then
        echo -e "${RED}Error: $WEBSOCKET_FILE not found in $APP_DIR${NC}"
        return 1
    fi
    
    # Start the WebSocket server in background
    nohup ruby "$WEBSOCKET_FILE" > websocket_server.log 2>&1 &
    local pid=$!
    echo "WebSocket Server started with PID: $pid"
    
    # Wait a moment and check if it's running
    sleep 3
    if ps -p $pid > /dev/null; then
        echo -e "${GREEN}✅ WebSocket Server is running on port $WEBSOCKET_PORT${NC}"
    else
        echo -e "${RED}❌ WebSocket Server failed to start. Check websocket_server.log${NC}"
        return 1
    fi
}

# Function to show server status
status() {
    echo -e "${BLUE}=== Server Status ===${NC}"
    
    # Check API server
    local api_pid=$(check_port $APP_PORT)
    if [ -n "$api_pid" ]; then
        echo -e "${GREEN}✅ API Server: Running (PID: $api_pid, Port: $APP_PORT)${NC}"
    else
        echo -e "${RED}❌ API Server: Not running${NC}"
    fi
    
    # Check WebSocket server
    local ws_pid=$(check_port $WEBSOCKET_PORT)
    if [ -n "$ws_pid" ]; then
        echo -e "${GREEN}✅ WebSocket Server: Running (PID: $ws_pid, Port: $WEBSOCKET_PORT)${NC}"
    else
        echo -e "${RED}❌ WebSocket Server: Not running${NC}"
    fi
    
    echo ""
    echo "Recent log entries:"
    echo "--- API Server (last 5 lines) ---"
    if [ -f "api_server.log" ]; then
        tail -5 api_server.log
    else
        echo "No log file found"
    fi
    echo ""
    echo "--- WebSocket Server (last 5 lines) ---"
    if [ -f "websocket_server.log" ]; then
        tail -5 websocket_server.log
    else
        echo "No log file found"
    fi
}

# Function to restart everything
restart() {
    echo -e "${YELLOW}=== Restarting All Servers ===${NC}"
    
    # Stop both servers
    kill_port $APP_PORT "API Server"
    kill_port $WEBSOCKET_PORT "WebSocket Server"
    
    echo ""
    echo -e "${BLUE}Waiting 3 seconds before restart...${NC}"
    sleep 3
    
    # Start both servers
    start_api
    sleep 2
    start_websocket
    
    echo ""
    status
}

# Function to stop all servers
stop() {
    echo -e "${YELLOW}=== Stopping All Servers ===${NC}"
    kill_port $APP_PORT "API Server"
    kill_port $WEBSOCKET_PORT "WebSocket Server"
}

# Function to start all servers
start() {
    echo -e "${BLUE}=== Starting All Servers ===${NC}"
    start_api
    sleep 2
    start_websocket
    echo ""
    status
}

# Function to show logs
logs() {
    local service=$1
    case $service in
        "api")
            echo -e "${BLUE}=== API Server Log ===${NC}"
            if [ -f "api_server.log" ]; then
                tail -50 api_server.log
            else
                echo "No API server log found"
            fi
            ;;
        "websocket"|"ws")
            echo -e "${BLUE}=== WebSocket Server Log ===${NC}"
            if [ -f "websocket_server.log" ]; then
                tail -50 websocket_server.log
            else
                echo "No WebSocket server log found"
            fi
            ;;
        *)
            echo -e "${BLUE}=== All Server Logs ===${NC}"
            echo "--- API Server ---"
            if [ -f "api_server.log" ]; then
                tail -25 api_server.log
            else
                echo "No API server log found"
            fi
            echo ""
            echo "--- WebSocket Server ---"
            if [ -f "websocket_server.log" ]; then
                tail -25 websocket_server.log
            else
                echo "No WebSocket server log found"
            fi
            ;;
    esac
}

# Function to test endpoints
test() {
    echo -e "${BLUE}=== Testing Endpoints ===${NC}"
    
    echo "Testing API Server..."
    if curl -s http://localhost:$APP_PORT/api/greeting > /dev/null; then
        echo -e "${GREEN}✅ API Server responding${NC}"
    else
        echo -e "${RED}❌ API Server not responding${NC}"
    fi
    
    echo "Testing WebSocket Server..."
    if nc -z localhost $WEBSOCKET_PORT; then
        echo -e "${GREEN}✅ WebSocket Server port open${NC}"
    else
        echo -e "${RED}❌ WebSocket Server port not responding${NC}"
    fi
}

# Function to show help
help() {
    echo -e "${BLUE}=== Server Manager Commands ===${NC}"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start both servers"
    echo "  stop        - Stop both servers"
    echo "  restart     - Restart both servers"
    echo "  status      - Show server status"
    echo "  logs [api|ws] - Show server logs (default: both)"
    echo "  test        - Test if endpoints are responding"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 restart"
    echo "  $0 logs api"
    echo "  $0 status"
}

# Main command handling
case "${1:-help}" in
    "start")
        start
        ;;
    "stop")
        stop
        ;;
    "restart")
        restart
        ;;
    "status")
        status
        ;;
    "logs")
        logs "$2"
        ;;
    "test")
        test
        ;;
    "help"|"-h"|"--help")
        help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        help
        exit 1
        ;;
esac
