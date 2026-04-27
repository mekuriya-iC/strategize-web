#!/bin/bash

# Load environment variables
NODE_ENV=${NODE_ENV:-development}

# Determine API endpoint based on environment
if [ "$NODE_ENV" = "production" ]; then
    API_URL="${NEXT_PUBLIC_API}"
else
    # For development, try localhost first, fallback to env variable
    API_URL="${GRAPHQL_SCHEMA_URL:-http://localhost:3000/graphql}"
fi

echo "Fetching schema from: $API_URL"
echo "Environment: $NODE_ENV"

# Check if API is reachable
echo "Checking API connectivity..."
if ! curl -s -f "$API_URL" > /dev/null 2>&1; then
    echo "⚠ Warning: API endpoint may not be reachable at $API_URL"
    echo "Make sure your GraphQL server is running."
fi

# Fetch schema using npx
echo "Fetching GraphQL schema..."
if npx get-graphql-schema "$API_URL" > schema.graphql 2>/dev/null; then
    echo "✓ Schema fetched successfully"
    echo "Running code generation..."
    pnpm run codegen
else
    echo "✗ Failed to fetch schema from $API_URL"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure your GraphQL API is running at: $API_URL"
    echo "2. Check your internet connection"
    echo "3. Try setting the API URL manually:"
    echo "   export GRAPHQL_SCHEMA_URL=http://your-api-url/graphql"
    echo "   sh schema.sh"
    exit 1
fi
