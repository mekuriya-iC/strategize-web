#!/bin/bash

# Get local IP address
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo "🌐 Starting Strategize Web for network access..."
echo "📍 Your local IP: $LOCAL_IP"
echo ""
echo "Frontend will be accessible at:"
echo "  - http://$LOCAL_IP:3001"
echo ""
echo "Share this URL with testers on the same network!"
echo ""
echo "⚠️  Make sure your backend is running at http://$LOCAL_IP:3000"
echo ""

# Start the frontend (already configured with -H 0.0.0.0)
npm run dev
