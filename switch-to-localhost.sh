#!/bin/bash

echo "🏠 Switching to LOCALHOST mode..."

# Create localhost configuration
cat > .env.local << 'EOF'
# For development (default is http://localhost:3000/graphql)
# Backend GraphQL endpoint
GRAPHQL_SCHEMA_URL=http://localhost:3000/graphql
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql

# Default Organization ID (UUID format required by backend)
# Replace with your actual organization ID from the database
NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=00000000-0000-0000-0000-000000000001

# 💡 Network Testing:
# To share with others on same network, run: ./switch-to-network.sh
EOF

echo ""
echo "✅ Configuration updated to localhost!"
echo ""
echo "IMPORTANT: Restart your frontend server:"
echo "  1. Stop the dev server (Ctrl+C)"
echo "  2. Run: npm run dev"
echo ""
echo "Your app will be available at: http://localhost:3001"
echo ""
echo "To enable network sharing again, run: ./switch-to-network.sh"
