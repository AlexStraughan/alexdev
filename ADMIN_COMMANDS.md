# WebSocket Server Admin Commands

This document describes the admin commands available in the WebSocket server for managing the game leaderboard.

## Authentication

All admin commands require the admin password. The system will **prompt you for the password** when you first use any admin command.

- **Password Caching**: The password is cached for 5 minutes for convenience
- **Clear Cache**: Use `adminCommands.clearPassword()` to force re-authentication
- **Default Password**: `admin123` (can be changed via `ADMIN_PASSWORD` environment variable)

**⚠️ SECURITY NOTE:** The admin password can be set via the `ADMIN_PASSWORD` environment variable in `.env` file or falls back to the default `admin123`. Change this for production use.

## Command Format

All admin commands are sent as WebSocket messages with this structure:

```javascript
{
  type: 'admin_command',
  password: '[prompted_password]',
  command: 'command_name',
  // additional parameters...
}
```

**Note**: You don't need to worry about the password field - the system will automatically prompt you and handle authentication.

## Available Commands

### 1. Help - `help`
Shows all available admin commands and their usage.

**Usage:**
```javascript
adminCommands.help()
```

**WebSocket Message:**
```javascript
{
  type: 'admin_command',
  password: 'admin123',
  command: 'help'
}
```

### 2. List Players - `list_players`
Lists top 20 players with their IDs, names, and total points earned (lifetime score).

**Usage:**
```javascript
adminCommands.listPlayers()
```

**WebSocket Message:**
```javascript
{
  type: 'admin_command',
  password: 'admin123',
  command: 'list_players'
}
```

### 3. Add Player - `add_player`
Creates a new player with specified name and points.

**Parameters:**
- `player_name` (required): Name for the new player
- `points` (optional): Starting points (default: 0)

**Usage:**
```javascript
adminCommands.addPlayer("TestUser", 5000)
adminCommands.addPlayer("NewPlayer") // 0 points
```

**WebSocket Message:**
```javascript
{
  type: 'admin_command',
  password: 'admin123',
  command: 'add_player',
  player_name: 'TestUser',
  points: 5000
}
```

### 4. Edit Player - `edit_player`
Modifies an existing player's data.

**Parameters:**
- `target_player_id` (required): ID of player to edit
- `points` (optional): New points value
- `player_name` (optional): New name

**Usage:**
```javascript
// Edit points only
adminCommands.editPlayer("player_123", {points: 9999})

// Edit name only
adminCommands.editPlayer("player_123", {name: "SuperPlayer"})

// Edit both
adminCommands.editPlayer("player_123", {points: 15000, name: "Hacker"})

// Edit your own score
adminCommands.giveMyself(99999)
```

**WebSocket Message:**
```javascript
{
  type: 'admin_command',
  password: 'admin123',
  command: 'edit_player',
  target_player_id: 'player_123',
  points: 9999,
  player_name: 'SuperPlayer'
}
```

### 5. Delete Player - `delete_player`
Removes a player from the database completely.

**Parameters:**
- `target_player_id` (required): ID of player to delete

**Usage:**
```javascript
adminCommands.deletePlayer("player_123")
```

**WebSocket Message:**
```javascript
{
  type: 'admin_command',
  password: 'admin123',
  command: 'delete_player',
  target_player_id: 'player_123'
}
```

### 6. Reset Leaderboard - `reset_leaderboard`
⚠️ **DANGEROUS** - Deletes ALL players from the database.

**Parameters:**
- `confirm` (required): Must be exactly `'YES_DELETE_ALL'`

**Usage:**
```javascript
adminCommands.resetLeaderboard() // Shows confirmation dialog
```

**WebSocket Message:**
```javascript
{
  type: 'admin_command',
  password: 'admin123',
  command: 'reset_leaderboard',
  confirm: 'YES_DELETE_ALL'
}
```

## Helper Functions

Additional convenience functions available in browser console:

### Quick Test Players
```javascript
adminCommands.addTestPlayers()
```
Adds 5 test players with different scores for testing purposes.

### Give Yourself Points
```javascript
adminCommands.giveMyself(50000)
```
Edits your own player's score (requires game to be loaded).

### Clear Admin Password Cache
```javascript
adminCommands.clearPassword()
```
Clears the cached admin password, forcing re-authentication on next command.

## Usage Examples

### Browser Console Usage
Open browser developer tools (F12) and use the console:

```javascript
// Get help
adminCommands.help()

// List current players
adminCommands.listPlayers()

// Add some test data
adminCommands.addPlayer("ProGamer", 10000)
adminCommands.addPlayer("SpeedRunner", 7500)

// Edit a player
adminCommands.editPlayer("player_123", {points: 15000})

// Give yourself lots of points for testing
adminCommands.giveMyself(99999)

// Add multiple test players
adminCommands.addTestPlayers()

// Clear cached admin password (forces re-authentication)
adminCommands.clearPassword()

// Clean up - delete a player
adminCommands.deletePlayer("admin_12345678")

// Nuclear option - reset everything
adminCommands.resetLeaderboard()
```

### Direct WebSocket Usage
If you prefer to send raw WebSocket messages:

```javascript
// Using the WebSocket client directly
window.wsClient.sendMessage('admin_command', {
  password: 'admin123',
  command: 'add_player',
  player_name: 'TestUser',
  points: 1000
})
```

## Server Responses

All admin commands return responses in this format:

```javascript
{
  type: 'admin_response',
  success: true/false,
  message: 'Response message'
}
```

**Success responses** appear in green in the console.
**Error responses** appear in red in the console.

## Security Notes

1. **Change the admin password** in production
2. Admin commands are logged to the server console
3. No rate limiting is implemented - use responsibly
4. The reset command is irreversible
5. Consider implementing IP-based restrictions for production

## Troubleshooting

**"WebSocket not connected"**: Ensure the WebSocket server is running and you've loaded the game page.

**"Invalid admin password"**: The system will prompt you for the password. Check that you're entering the correct password (default: `admin123`). Use `adminCommands.clearPassword()` to clear the cached password and try again.

**"Player not found"**: Use `listPlayers()` to get valid player IDs.

**Password prompt not appearing**: Make sure you're running commands in the browser console where the game page is loaded.

**Functions not available**: Ensure you've loaded the game page where `websocket-client.js` is included.
