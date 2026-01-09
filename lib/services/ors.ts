import { RoutePreview } from '@/lib/map/navigationHelpers';

interface ORSFeature {
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
}

interface ORSResponse {
  features: ORSFeature[];
}

// API response wrapper from our backend
interface ApiResponse {
  success: boolean;
  data?: ORSResponse;
  error?: {
    code: string;
    message: string;
  };
}

export async function fetchORSRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
): Promise<{ coordinates: [number, number][]; preview: RoutePreview | null; error?: string }> {
  // API key is handled server-side in /api/navigate route
  // No need to check for NEXT_PUBLIC_ORS_API_KEY on the client

  try {
    // Call local proxy instead of external API to avoid CORS/Network errors
    const response = await fetch('/api/navigate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start, end }),
    });

    const json: ApiResponse = await response.json();

    if (!response.ok || !json.success) {
      // Extract error message from our API response format
      const errorMessage = json.error?.message || `Route Failed: ${response.status}`;
      console.error('Navigation Proxy Failed:', errorMessage);
      return { coordinates: [], preview: null, error: errorMessage };
    }

    // Extract the ORS data from our API wrapper
    const data = json.data;

    if (!data?.features || data.features.length === 0) {
      return { coordinates: [], preview: null, error: 'No route found' };
    }

    const feature = data.features[0];
    const coords = feature.geometry.coordinates.map((c) => [c[1], c[0]] as [number, number]);

    // Parse preview data
    const summary = feature.properties.summary;
    const steps =
      feature.properties.segments[0]?.steps.map((s) => ({
        text: s.instruction,
        distance: s.distance,
        time: s.duration,
      })) || [];

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
