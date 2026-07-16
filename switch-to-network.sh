#!/bin/bash

# Get local IP address
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo "🌐 Switching to NETWORK mode..."
echo "📍 Your IP: $LOCAL_IP"

# Backup current .env.local
cp .env.local .env.local.backup 2>/dev/null

# Switch to network configuration
cp .env.network .env.local

echo ""
echo "✅ Configuration updated!"
echo ""
echo "IMPORTANT: Restart your frontend server:"
echo "  1. Stop the dev server (Ctrl+C)"
echo "  2. Run: npm run dev"
echo ""
echo "Share this with testers: http://$LOCAL_IP:3001"
echo ""
echo "To switch back to localhost, run: ./switch-to-localhost.sh"
