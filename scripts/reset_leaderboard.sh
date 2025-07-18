#!/bin/bash

# Leaderboard Reset Script
# Usage: ./reset_leaderboard.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_DIR/server/leaderboard.db"
BACKUP_DIR="$PROJECT_DIR/server/backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🏆 Leaderboard Reset Script"
echo "=========================="
echo "Database: $DB_PATH"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found: $DB_PATH"
    exit 1
fi

# Show current stats
echo "📊 Current Leaderboard Stats:"
PLAYER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM leaderboard;")
echo "Total players: $PLAYER_COUNT"

if [ "$PLAYER_COUNT" -gt 0 ]; then
    echo "Top 3 scores:"
    sqlite3 "$DB_PATH" "SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 3;" | while read line; do
        echo "  $line"
    done
fi

echo ""

# Confirm reset
read -p "🔄 Are you sure you want to reset all scores? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled."
    exit 1
fi

# Create backup
BACKUP_PATH="$BACKUP_DIR/leaderboard_backup_$TIMESTAMP.db"
echo "💾 Creating backup: $BACKUP_PATH"
cp "$DB_PATH" "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully"
else
    echo "❌ Backup failed! Aborting reset."
    exit 1
fi

# Reset database
echo "🔄 Resetting leaderboard..."
sqlite3 "$DB_PATH" "DELETE FROM leaderboard;"
sqlite3 "$DB_PATH" "DELETE FROM sqlite_sequence WHERE name='leaderboard';"

# Verify reset
NEW_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM leaderboard;")
echo "✅ Reset complete! Player count: $NEW_COUNT"

# Clean up old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
ls -t "$BACKUP_DIR"/leaderboard_backup_*.db | tail -n +11 | xargs rm -f 2>/dev/null || true

echo "🎉 Leaderboard reset completed successfully!"
echo "📁 Backup saved to: $BACKUP_PATH"
