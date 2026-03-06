import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiLimiterMock = vi.fn();
const getClientIPMock = vi.fn();
const loggerMock = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/lib/services/rateLimitService', () => ({
  apiLimiter: (...args: Parameters<typeof apiLimiterMock>) => apiLimiterMock(...args),
}));

vi.mock('@/lib/security/ip', () => ({
  getClientIP: (...args: Parameters<typeof getClientIPMock>) => getClientIPMock(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: loggerMock,
}));

describe('POST /api/maps/routes', () => {
  const originalApiKey = process.env.GOOGLE_ROUTES_API_KEY;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    apiLimiterMock.mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60 });
    getClientIPMock.mockReturnValue('127.0.0.1');
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.GOOGLE_ROUTES_API_KEY = originalApiKey;
  });

  it('normalises a Google Routes response', async () => {
    process.env.GOOGLE_ROUTES_API_KEY = 'test-routes-key';
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          routes: [
            {
              distanceMeters: 1240,
              duration: '840s',
              polyline: {
                encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
              },
              legs: [
                {
                  steps: [
                    {
                      distanceMeters: 300,
                      staticDuration: '240s',
                      travelMode: 'WALK',
                      navigationInstruction: {
                        instructions: 'Head north on Wallys Walk',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ),
    );

    const { POST } = await import('@/app/api/maps/routes/route');

    const response = await POST(
      new Request('http://localhost/api/maps/routes', {
        method: 'POST',
        body: JSON.stringify({
          origin: { lat: -33.774, lng: 151.112 },
          destination: { lat: -33.775, lng: 151.114 },
          travelMode: 'WALK',
        }),
      }) as never,
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(
      expect.objectContaining({
        mode: 'WALK',
        distanceMeters: 1240,
        durationSeconds: 840,
        encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
      }),
    );
    expect(json.data.steps[0]).toEqual(
      expect.objectContaining({
        instruction: 'Head north on Wallys Walk',
        distanceMeters: 300,
        durationSeconds: 240,
        travelMode: 'WALK',
      }),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when the server key is missing', async () => {
    delete process.env.GOOGLE_ROUTES_API_KEY;

    const { POST } = await import('@/app/api/maps/routes/route');
    const response = await POST(
      new Request('http://localhost/api/maps/routes', {
        method: 'POST',
        body: JSON.stringify({
          origin: { lat: -33.774, lng: 151.112 },
          destination: { lat: -33.775, lng: 151.114 },
        }),
      }) as never,
    );
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid payloads', async () => {
    process.env.GOOGLE_ROUTES_API_KEY = 'test-routes-key';

    const { POST } = await import('@/app/api/maps/routes/route');
    const response = await POST(
      new Request('http://localhost/api/maps/routes', {
        method: 'POST',
        body: JSON.stringify({
          origin: { lat: 999, lng: 151.112 },
          destination: { lat: -33.775, lng: 151.114 },
        }),
      }) as never,
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('maps upstream failures to external service errors', async () => {
    process.env.GOOGLE_ROUTES_API_KEY = 'test-routes-key';
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'nope' }), {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    const { POST } = await import('@/app/api/maps/routes/route');
    const response = await POST(
      new Request('http://localhost/api/maps/routes', {
        method: 'POST',
        body: JSON.stringify({
          origin: { lat: -33.774, lng: 151.112 },
          destination: { lat: -33.775, lng: 151.114 },
        }),
      }) as never,
    );
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('maps timeout-like failures to 504', async () => {
    process.env.GOOGLE_ROUTES_API_KEY = 'test-routes-key';
    vi.mocked(global.fetch).mockRejectedValue(new Error('timeout exceeded'));

    const { POST } = await import('@/app/api/maps/routes/route');
    const response = await POST(
      new Request('http://localhost/api/maps/routes', {
        method: 'POST',
        body: JSON.stringify({
          origin: { lat: -33.774, lng: 151.112 },
          destination: { lat: -33.775, lng: 151.114 },
        }),
      }) as never,
    );
    const json = await response.json();

    expect(response.status).toBe(504);
    expect(json.error.code).toBe('TIMEOUT');
  });
});
