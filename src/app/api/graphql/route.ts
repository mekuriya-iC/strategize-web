import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINT =
  process.env.API_GRAPHQL_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:3000/graphql'
    : process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://127.0.0.1:3000/graphql');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    return NextResponse.json(
      {
        errors: [
          {
            message:
              'The web server could not reach the GraphQL API. Check API_GRAPHQL_URL and ensure the API is running.',
          },
        ],
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'GraphQL endpoint - use POST requests' },
    { status: 200 }
  );
}
