import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const apiKey = process.env.LEAKX_API_KEY

  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'LeakIX API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://leakix.net/search?scope=leak&page=0&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey
        },
      }
    )

    // Handle rate limiting
    if (response.status === 429) {
      const waitTime = response.headers.get('x-limited-for')
      return NextResponse.json(
        { error: `Rate limited. Please wait ${waitTime} before trying again.` },
        { status: 429 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `LeakIX API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ results: data })

  } catch (error) {
    console.error('LeakIX search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform LeakIX search' },
      { status: 500 }
    )
  }
} 