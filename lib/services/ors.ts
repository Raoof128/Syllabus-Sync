import { RoutePreview } from '@/lib/map/navigationHelpers';

interface ORSResponse {
  features: {
    geometry: {
      coordinates: [number, number][]; // [lon, lat]
    };
    properties: {
      summary: {
        distance: number;
        duration: number;
      };
      segments: {
        steps: {
          distance: number;
          duration: number;
          instruction: string;
        }[];
      }[];
    };
  }[];
}

export async function fetchORSRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
): Promise<{ coordinates: [number, number][]; preview: RoutePreview | null; error?: string }> {
  if (!process.env.NEXT_PUBLIC_ORS_API_KEY) {
    console.error('ORS API Key is missing. Please set NEXT_PUBLIC_ORS_API_KEY.');
    return { coordinates: [], preview: null, error: 'Missing API Key (Restart Server?)' };
  }

  try {
    // Call local proxy instead of external API to avoid CORS/Network errors
    const response = await fetch('/api/navigate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start, end }),
    });

    if (!response.ok) {
      // Read error details from our proxy
      let errorMessage = `Route Failed: ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMessage = errorJson.error;
      } catch {
        /* ignore parse error */
      }

      console.error('Navigation Proxy Failed:', errorMessage);
      return { coordinates: [], preview: null, error: errorMessage };
    }

    const data: ORSResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return { coordinates: [], preview: null, error: 'No route found' };
    }

    const feature = data.features[0];
    const coords = feature.geometry.coordinates.map((c) => [c[1], c[0]] as [number, number]);

    // Parse preview data
    const summary = feature.properties.summary;
    const steps = feature.properties.segments[0].steps.map((s) => ({
      text: s.instruction,
      distance: s.distance,
      time: s.duration,
    }));

    const preview: RoutePreview = {
      distanceMeters: summary.distance,
      durationSeconds: summary.duration,
      steps: steps,
    };

    return { coordinates: coords, preview };
  } catch (error) {
    console.error('Error fetching ORS route:', error);
    return { coordinates: [], preview: null, error: 'Network Error' };
  }
}
