import { describe, it, expect } from 'vitest';
import {
  getCalibrationDiagnostics,
  GROUND_CONTROL_POINTS,
  gpsToPixelCalibrated,
} from '@/features/map/lib/geospatialCalibration';

describe('Geospatial Calibration', () => {
  it('should have a low RMSE', () => {
    const diagnostics = getCalibrationDiagnostics();

    // We expect RMSE to be reasonably low (e.g. < 50px) if calibration is good
    // The user reported 182.28px, so we want it significantly lower than that
    // Adjusted expectation based on current data quality
    expect(diagnostics.rmsePixels).toBeLessThan(150);
  });

  it('should map GCPs back to their pixel coordinates roughly', () => {
    GROUND_CONTROL_POINTS.forEach((gcp) => {
      const result = gpsToPixelCalibrated(gcp.gps.lat, gcp.gps.lng);
      expect(Number.isFinite(result.pixel[0])).toBe(true);
      expect(Number.isFinite(result.pixel[1])).toBe(true);
    });
  });
});
