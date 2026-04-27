# Load environment variables
$env:NODE_ENV = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }

# Determine API endpoint based on environment
if ($env:NODE_ENV -eq "production") {
    $apiUrl = $env:NEXT_PUBLIC_API
} else {
    # For development, try localhost first, fallback to remote
    $apiUrl = $env:GRAPHQL_SCHEMA_URL -or "http://localhost:3000/graphql"
}

Write-Host "Fetching schema from: $apiUrl"
Write-Host "Environment: $env:NODE_ENV"

# Check if API is reachable
Write-Host "Checking API connectivity..."
try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ API is reachable"
} catch {
    Write-Host "⚠ Warning: API endpoint may not be reachable at $apiUrl"
    Write-Host "Make sure your GraphQL server is running."
}

# Fetch schema using npx
Write-Host "Fetching GraphQL schema..."
try {
    npx get-graphql-schema $apiUrl | Out-File -Encoding UTF8 schema.graphql -ErrorAction Stop
    Write-Host "✓ Schema fetched successfully"
    Write-Host "Running code generation..."
    pnpm run codegen
} catch {
    Write-Host "✗ Failed to fetch schema from $apiUrl"
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "1. Make sure your GraphQL API is running at: $apiUrl"
    Write-Host "2. Check your internet connection"
    Write-Host "3. Try setting the API URL manually:"
    Write-Host "   `$env:GRAPHQL_SCHEMA_URL='http://your-api-url/graphql'"
    Write-Host "   .\schema.ps1"
    exit 1
}
