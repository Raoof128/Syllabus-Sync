import { NextRequest, NextResponse } from 'next/server';

// Use server-only env var (no NEXT_PUBLIC_ prefix) for security
// The API key is only used on the server side, so it should not be exposed to the client
const ORS_API_KEY = process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

export async function POST(request: NextRequest) {
  if (!ORS_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing API Key' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { start, end } = body;

    if (!start || !end) {
      return NextResponse.json({ error: 'Missing start or end coordinates' }, { status: 400 });
    }

    const orsResponse = await fetch(ORS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
        instructions: true,
      }),
    });

    if (!orsResponse.ok) {
      const errText = await orsResponse.text();
      console.error('ORS Upstream Error:', orsResponse.status, errText);
      return NextResponse.json(
        { error: `ORS Gateway Error: ${orsResponse.status}`, details: errText },
        { status: orsResponse.status },
      );
    }

    const data = await orsResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Navigate Proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
