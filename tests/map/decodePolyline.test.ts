import { describe, expect, it } from 'vitest';
import { decodePolyline } from '@/lib/maps/google/decodePolyline';

describe('decodePolyline', () => {
  it('decodes a standard Google encoded polyline', () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');

    expect(points).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });
});
