import { useState, useEffect, useRef, useCallback } from 'react';
import { toastUtils } from '@/lib/utils/toast';
import { devLog } from '@/lib/utils/devLog';
import { errorHandler } from '@/lib/utils/errorHandling';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';
import { GPS_CAMPUS_BOUNDS } from '@/features/map/lib/constants';
import { gpsToCrsSimple } from '@/features/map/lib/geospatialCalibration';
import { calculateDistance } from '@/features/map/lib/navigationHelpers';
import {
  GpsPositionSmoother,
  type SmoothedPosition,
  NavigationStateManager,
} from '@/features/map/lib/realtimeNavigation';
import type { LocationStatus } from '../components/CampusMap';
import type { Map as LeafletMap, Marker, Circle, Icon } from 'leaflet';
import { logger } from '@/lib/logger';

// Constants
const LOCATION_TIMEOUT = 15000;
const SPEED_CALC_THRESHOLD = 0.5; // seconds
const WALKING_SPEED_LIMIT = 10; // m/s
const MOVEMENT_THRESHOLD = 0.2; // m/s
const ORIGIN_REFRESH_THRESHOLD_METERS = 5; // Lower threshold for quicker route refreshes
const OUTLIER_DISTANCE_THRESHOLD_METERS = 35; // Ignore large low-confidence GPS jumps
const OUTLIER_ACCURACY_THRESHOLD_METERS = 35;
const OUTLIER_SPEED_THRESHOLD_MS = 4.5;
const COMPASS_STALE_THRESHOLD_MS = 5000;
const COMPASS_SMOOTHING_ALPHA = 0.35;
const HEADING_SMOOTHING_ALPHA = 0.4;
const MOTION_ARROW_ROTATION_OFFSET = 45; // Tear-drop icon points top-right before rotation offset

// Logger
const mapLog = devLog.map;

const NAVIGATION_ACTIVE_STATUSES: Array<ReturnType<NavigationStateManager['getState']>['status']> =
  ['navigating', 'off-route', 'recalculating'];

type CompassOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360;
}

function smoothCircularHeading(previous: number, next: number, alpha: number): number {
  const prevNorm = normalizeHeading(previous);
  const nextNorm = normalizeHeading(next);
  let delta = nextNorm - prevNorm;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return normalizeHeading(prevNorm + delta * alpha);
}

function getCompassHeading(event: DeviceOrientationEvent): number | null {
  const orientationEvent = event as CompassOrientationEvent;

  if (typeof orientationEvent.webkitCompassHeading === 'number') {
    const accuracy = orientationEvent.webkitCompassAccuracy;
    if (typeof accuracy === 'number' && accuracy > 50) return null;
    return normalizeHeading(orientationEvent.webkitCompassHeading);
  }

  if (!event.absolute || typeof event.alpha !== 'number') return null;

  let screenAngle = 0;
  if (typeof window !== 'undefined') {
    if (typeof window.screen?.orientation?.angle === 'number') {
      screenAngle = window.screen.orientation.angle;
    } else if (typeof (window as Window & { orientation?: number }).orientation === 'number') {
      screenAngle = (window as Window & { orientation: number }).orientation;
    }
  }

  return normalizeHeading(360 - event.alpha + screenAngle);
}

function shouldIgnoreOutlierSample(
  previous: { lat: number; lng: number; time: number } | null,
  current: { lat: number; lng: number; time: number },
  accuracy: number,
  speed: number | null,
): boolean {
  if (!previous) return false;

  const dt = (current.time - previous.time) / 1000;
  if (dt <= 0 || dt > 6) return false;

  const distance = calculateDistance(previous, current);
  const derivedSpeed = speed ?? distance / dt;

  return (
    accuracy >= OUTLIER_ACCURACY_THRESHOLD_METERS &&
    distance >= OUTLIER_DISTANCE_THRESHOLD_METERS &&
    derivedSpeed >= OUTLIER_SPEED_THRESHOLD_MS
  );
}

function getDisplayPosition(
  raw: { lat: number; lng: number },
  smoothed: { lat: number; lng: number; accuracy: number },
  speed: number | null,
): { lat: number; lng: number } {
  const speedValue = speed ?? 0;
  let rawWeight = 0.4;

  if (smoothed.accuracy <= 8 || speedValue >= 1.5) {
    rawWeight = 0.8;
  } else if (smoothed.accuracy <= 15 || speedValue >= 0.9) {
    rawWeight = 0.65;
  } else if (smoothed.accuracy >= 30) {
    rawWeight = 0.25;
  }

  return {
    lat: smoothed.lat * (1 - rawWeight) + raw.lat * rawWeight,
    lng: smoothed.lng * (1 - rawWeight) + raw.lng * rawWeight,
  };
}

interface UseMapLocationProps {
  mapInstance: LeafletMap | null;
  leafletModule: typeof import('leaflet') | null;
  isMapReady: (map: LeafletMap | null) => boolean;
  userIcon: Icon | import('leaflet').DivIcon | null;
  navManagerRef: React.MutableRefObject<NavigationStateManager | null>;
}

export function useMapLocation({
  mapInstance,
  leafletModule,
  isMapReady,
  userIcon,
  navManagerRef,
}: UseMapLocationProps) {
  const { safeT } = useSafeTranslation();

  // State
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [smoothedPosition, setSmoothedPosition] = useState<SmoothedPosition | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [isOffCampus, setIsOffCampus] = useState(false);

  // Refs
  const userMarkerRef = useRef<Marker | null>(null);
  const accuracyCircleRef = useRef<Circle | null>(null);
  const lastPositionRef = useRef<{
    lat: number;
    lng: number;
    time: number;
  } | null>(null);
  const positionSmootherRef = useRef<GpsPositionSmoother | null>(null);
  const offCampusToastShown = useRef(false);
  const locationErrorToastShown = useRef(false);
  const safeTRef = useRef(safeT);
  const compassHeadingRef = useRef<number | null>(null);
  const compassHeadingUpdatedAtRef = useRef<number>(0);
  const fusedHeadingRef = useRef<number | null>(null);

  // Update refs
  useEffect(() => {
    safeTRef.current = safeT;
  }, [safeT]);

  // Initialize Smoother
  useEffect(() => {
    positionSmootherRef.current = new GpsPositionSmoother();
  }, []);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      if (mapInstance && leafletModule) {
        if (userMarkerRef.current) {
          try {
            userMarkerRef.current.remove();
          } catch {
            // ignore
          }
        }
        if (accuracyCircleRef.current) {
          try {
            accuracyCircleRef.current.remove();
          } catch {
            // ignore
          }
        }
      }
    };
  }, [mapInstance, leafletModule]);

  // Motion Detection (Sensor Fusion)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceMotionEvent) return;

    let motionTimeout: ReturnType<typeof setTimeout>;
    let cleanedUp = false;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { acceleration } = event;
      if (!acceleration || acceleration.x === null) return;

      const mag = Math.sqrt(
        (acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2,
      );

      // Threshold for significant movement (walking vibration)
      if (mag > 0.3) {
        if (navManagerRef.current) {
          navManagerRef.current.setMotionState(true);
        }
        clearTimeout(motionTimeout);
        motionTimeout = setTimeout(() => {
          if (navManagerRef.current) {
            navManagerRef.current.setMotionState(false);
          }
        }, 3000); // 3 seconds of stillness to consider "stopped"
      }
    };

    const addMotionListener = () => {
      if (cleanedUp) return;
      window.addEventListener('devicemotion', handleMotion, { passive: true });
    };

    // iOS 13+ requires explicit permission request for DeviceMotionEvent
    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DME.requestPermission === 'function') {
      DME.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            addMotionListener();
          } else {
            mapLog.log('DeviceMotion permission denied');
          }
        })
        .catch(() => {
          // Permission request failed (e.g., not triggered by user gesture).
          // Fall back to adding listener directly — some browsers allow it without permission.
          addMotionListener();
        });
    } else {
      addMotionListener();
    }

    return () => {
      cleanedUp = true;
      window.removeEventListener('devicemotion', handleMotion);
      clearTimeout(motionTimeout);
    };
  }, [navManagerRef]);

  // Compass / Device orientation heading for better walking direction tracking.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return;

    let cleanedUp = false;

    const onOrientation = (event: DeviceOrientationEvent) => {
      const heading = getCompassHeading(event);
      if (heading === null) return;

      const previousHeading = compassHeadingRef.current;
      compassHeadingRef.current =
        previousHeading === null
          ? heading
          : smoothCircularHeading(previousHeading, heading, COMPASS_SMOOTHING_ALPHA);
      compassHeadingUpdatedAtRef.current = Date.now();
    };

    const addOrientationListener = () => {
      if (cleanedUp) return;
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    };

    // iOS requires explicit permission request.
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((permission) => {
          if (permission === 'granted') addOrientationListener();
        })
        .catch(() => {
          addOrientationListener();
        });
    } else {
      addOrientationListener();
    }

    return () => {
      cleanedUp = true;
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, []);

  // Geolocation Effect
  useEffect(() => {
    const geolocation = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;

    if (!mapInstance || !isMapReady(mapInstance) || !leafletModule || !geolocation) {
      if (typeof navigator !== 'undefined' && !geolocation) {
        mapLog.log('Geolocation API not available');
        // Avoid synchronous state update in effect
        setTimeout(() => setLocationStatus('error'), 0);
      }
      return;
    }

    mapLog.log('Starting geolocation watch...');
    setTimeout(() => {
      setLocationStatus((prev) => (prev === 'idle' ? 'searching' : prev));
    }, 0);

    const watchId = geolocation.watchPosition(
      (pos) => {
        if (!isMapReady(mapInstance)) {
          return;
        }

        const gpsLat = pos.coords.latitude;
        const gpsLng = pos.coords.longitude;
        const gpsHeading = pos.coords.heading;
        let gpsSpeed = pos.coords.speed;
        const currentTime = pos.timestamp || Date.now();

        // Calculate manual speed if needed
        if ((gpsSpeed === null || gpsSpeed === 0) && lastPositionRef.current) {
          const lastPos = lastPositionRef.current;
          const timeDiff = (currentTime - lastPos.time) / 1000;

          if (timeDiff > SPEED_CALC_THRESHOLD) {
            const R = 6371e3;
            const φ1 = (lastPos.lat * Math.PI) / 180;
            const φ2 = (gpsLat * Math.PI) / 180;
            const Δφ = ((gpsLat - lastPos.lat) * Math.PI) / 180;
            const Δλ = ((gpsLng - lastPos.lng) * Math.PI) / 180;

            const a =
              Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const dist = R * c;

            const calculatedSpeed = dist / timeDiff;
            if (calculatedSpeed < WALKING_SPEED_LIMIT) {
              gpsSpeed = calculatedSpeed;
            }
          }
        }

        const previousPosition = lastPositionRef.current;
        if (
          shouldIgnoreOutlierSample(
            previousPosition,
            { lat: gpsLat, lng: gpsLng, time: currentTime },
            pos.coords.accuracy,
            gpsSpeed,
          )
        ) {
          mapLog.log('Ignoring outlier GPS sample', {
            accuracy: pos.coords.accuracy,
            speed: gpsSpeed,
          });
          return;
        }

        lastPositionRef.current = {
          lat: gpsLat,
          lng: gpsLng,
          time: currentTime,
        };

        // Kalman Smoothing
        let smoothedLat = gpsLat;
        let smoothedLng = gpsLng;
        let movementHeading: number | null = null;
        let effectiveHeadingForDisplay: number | null = fusedHeadingRef.current;

        if (positionSmootherRef.current) {
          const smoothed = positionSmootherRef.current.update({
            lat: gpsLat,
            lng: gpsLng,
            accuracy: pos.coords.accuracy,
            heading: gpsHeading,
            speed: gpsSpeed,
            timestamp: currentTime,
          });

          setSmoothedPosition(smoothed);

          // Use smoothed coordinates for marker placement after initial warm-up
          if (positionSmootherRef.current.getHistory().length > 1) {
            const displayPosition = getDisplayPosition(
              { lat: gpsLat, lng: gpsLng },
              {
                lat: smoothed.smoothedLat,
                lng: smoothed.smoothedLng,
                accuracy: pos.coords.accuracy,
              },
              gpsSpeed,
            );
            smoothedLat = displayPosition.lat;
            smoothedLng = displayPosition.lng;
          }

          movementHeading = positionSmootherRef.current.calculateMovementHeading(1);

          const isMoving = gpsSpeed !== null && gpsSpeed > MOVEMENT_THRESHOLD;
          const hasFreshCompassHeading =
            Date.now() - compassHeadingUpdatedAtRef.current <= COMPASS_STALE_THRESHOLD_MS;
          const compassHeading = hasFreshCompassHeading ? compassHeadingRef.current : null;
          const gpsHeadingValid = typeof gpsHeading === 'number' && !isNaN(gpsHeading);

          let effectiveHeading: number | null = null;
          if (isMoving && gpsHeadingValid) {
            effectiveHeading = gpsHeading;
          } else if (isMoving && movementHeading !== null) {
            effectiveHeading = movementHeading;
          } else if (compassHeading !== null) {
            effectiveHeading = compassHeading;
          } else if (movementHeading !== null) {
            effectiveHeading = movementHeading;
          } else if (fusedHeadingRef.current !== null) {
            effectiveHeading = fusedHeadingRef.current;
          }

          if (effectiveHeading !== null) {
            const previousHeading = fusedHeadingRef.current;
            fusedHeadingRef.current =
              previousHeading === null
                ? normalizeHeading(effectiveHeading)
                : smoothCircularHeading(previousHeading, effectiveHeading, HEADING_SMOOTHING_ALPHA);
            effectiveHeading = fusedHeadingRef.current;
          }

          effectiveHeadingForDisplay = fusedHeadingRef.current ?? movementHeading;

          // Update navigation manager
          const navManager = navManagerRef.current;
          const navigationActive = navManager
            ? NAVIGATION_ACTIVE_STATUSES.includes(navManager.getState().status)
            : false;

          if (navigationActive && navManager) {
            navManager.updatePosition({
              lat: gpsLat,
              lng: gpsLng,
              accuracy: pos.coords.accuracy,
              heading: effectiveHeading,
              speed: gpsSpeed,
              timestamp: currentTime,
            });
          }
        }

        setLocationStatus('found');
        locationErrorToastShown.current = false;
        setOrigin((prev) => {
          if (!prev) return { lat: gpsLat, lng: gpsLng };
          const distance = calculateDistance(prev, { lat: gpsLat, lng: gpsLng });
          if (distance >= ORIGIN_REFRESH_THRESHOLD_METERS) return { lat: gpsLat, lng: gpsLng };
          return prev;
        });

        // Campus Bounds Check
        const { south, north, west, east } = GPS_CAMPUS_BOUNDS;
        const isInBounds = gpsLat >= south && gpsLat <= north && gpsLng >= west && gpsLng <= east;
        setIsOffCampus(!isInBounds);

        if (!isInBounds && !offCampusToastShown.current) {
          offCampusToastShown.current = true;
          toastUtils.warning(
            safeTRef.current('locationOutsideCampusTitle', 'Outside campus boundary'),
            safeTRef.current(
              'locationOutsideCampusMessage',
              'You appear to be outside campus bounds. Navigation is disabled until you return to campus.',
            ),
          );
        } else if (isInBounds) {
          offCampusToastShown.current = false;
        }

        // Update Markers (Pixel Coordinates) - uses adaptive blended positions
        try {
          // gpsToCrsSimple returns { lat, lng } which are CRS.Simple coordinates (pixel-based but labeled lat/lng)
          const crsPos = gpsToCrsSimple(smoothedLat, smoothedLng);

          if (crsPos) {
            // User Marker
            if (!userMarkerRef.current && userIcon && mapInstance) {
              userMarkerRef.current = leafletModule
                .marker([crsPos.lat, crsPos.lng], {
                  icon: userIcon,
                  zIndexOffset: 1000,
                })
                .addTo(mapInstance);
            } else if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([crsPos.lat, crsPos.lng]);
            }

            // Update user marker orientation/animation
            if (userMarkerRef.current) {
              const iconElement = userMarkerRef.current.getElement();
              if (iconElement) {
                const isMoving = gpsSpeed !== null && gpsSpeed > MOVEMENT_THRESHOLD;

                // Motion Arrow
                if (
                  isMoving &&
                  typeof effectiveHeadingForDisplay === 'number' &&
                  !isNaN(effectiveHeadingForDisplay)
                ) {
                  iconElement.classList.add('is-moving');
                  const arrowElement = iconElement.querySelector(
                    '.user-motion-arrow',
                  ) as HTMLElement;
                  if (arrowElement) {
                    arrowElement.style.transform = `translate(-50%, -50%) rotate(${effectiveHeadingForDisplay - MOTION_ARROW_ROTATION_OFFSET}deg)`;
                  }
                } else {
                  iconElement.classList.remove('is-moving');
                }

                // Heading Flash
                const flashElement = iconElement.querySelector(
                  '.user-heading-flash',
                ) as HTMLElement;
                if (flashElement) {
                  if (
                    typeof effectiveHeadingForDisplay === 'number' &&
                    !isNaN(effectiveHeadingForDisplay)
                  ) {
                    flashElement.style.transform = `rotate(${effectiveHeadingForDisplay}deg)`;
                    flashElement.style.opacity = '1';
                  } else {
                    flashElement.style.opacity = '0';
                  }
                }
              }
            }

            // Accuracy Circle
            const accuracy = pos.coords.accuracy;
            const pixelAccuracy = accuracy / 0.42; // approx 1px = 0.42m
            if (!accuracyCircleRef.current && mapInstance) {
              accuracyCircleRef.current = leafletModule
                .circle([crsPos.lat, crsPos.lng], {
                  radius: pixelAccuracy,
                  color: 'var(--mq-primary, #1a73e8)',
                  weight: 1,
                  opacity: 0.4,
                  fillOpacity: 0.1,
                })
                .addTo(mapInstance);
            } else if (accuracyCircleRef.current) {
              accuracyCircleRef.current.setLatLng([crsPos.lat, crsPos.lng]);
              accuracyCircleRef.current.setRadius(pixelAccuracy);
            }
          } else {
            // Off-map cleanup
            if (userMarkerRef.current) {
              userMarkerRef.current.remove();
              userMarkerRef.current = null;
            }
            if (accuracyCircleRef.current) {
              accuracyCircleRef.current.remove();
              accuracyCircleRef.current = null;
            }
          }
        } catch (error) {
          mapLog.log('Error updating markers:', error);
        }
      },
      (err) => {
        mapLog.log('Geolocation error:', err);
        const isPermissionDenied = err.code === 1;
        const isTimeout = err.code === 3;

        if (!isPermissionDenied && !isTimeout) {
          errorHandler.logError(
            new Error(`Location failed: ${err.message}`),
            'MapGeolocation',
            'low',
          );
        }

        if (isPermissionDenied) {
          setLocationStatus('denied');
          toastUtils.warning(
            safeTRef.current('locationAccessDenied', 'Location Denied'),
            safeTRef.current('locationDeniedDesc', 'Please enable location access.'),
          );
        } else if (isTimeout) {
          setLocationStatus('error');
          if (!locationErrorToastShown.current) {
            locationErrorToastShown.current = true;
            toastUtils.info(
              safeTRef.current('locationTimeout', 'Location Timeout'),
              safeTRef.current(
                'locationTimeoutDesc',
                'Location request timed out. Try moving to a better signal area.',
              ),
            );
          }
        } else {
          setLocationStatus('error');
          if (!locationErrorToastShown.current) {
            locationErrorToastShown.current = true;
            toastUtils.warning(
              safeTRef.current('locationNotAvailable', 'Location Not Available'),
              safeTRef.current('waitingForLocation', 'Waiting for location'),
            );
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT,
        maximumAge: 1000,
      },
    );

    return () => {
      geolocation.clearWatch(watchId);
    };
  }, [mapInstance, leafletModule, isMapReady, userIcon, navManagerRef]);

  // Center on user function
  const centerOnUser = useCallback(() => {
    if (
      userMarkerRef.current &&
      mapInstance &&
      isMapReady(mapInstance) &&
      locationStatus === 'found'
    ) {
      const latLng = userMarkerRef.current.getLatLng();
      mapInstance.flyTo(latLng, 2, {
        animate: true,
        duration: 1.5,
      });
      mapLog.log('Centering map on user location');
    } else {
      toastUtils.info(
        safeTRef.current('locationNotAvailable', 'Location Not Available'),
        safeTRef.current('waitingForLocation', 'Waiting for location'),
      );
    }
  }, [mapInstance, isMapReady, locationStatus]);

  /**
   * Simulate a GPS position update (for testing/demo)
   */
  const simulatePosition = useCallback(
    (lat: number, lng: number, heading: number = 0, speed: number = 1.4) => {
      if (process.env.NODE_ENV === 'production') return;
      if (!isMapReady(mapInstance) || !leafletModule) return;

      const timestamp = Date.now();

      // Update refs
      lastPositionRef.current = { lat, lng, time: timestamp };

      // Smoother update
      if (positionSmootherRef.current) {
        // Force motion state for simulation
        positionSmootherRef.current.setMotionState(true);

        const smoothed = positionSmootherRef.current.update({
          lat,
          lng,
          accuracy: 5, // Good accuracy for simulation
          heading,
          speed,
          timestamp,
        });

        setSmoothedPosition(smoothed);

        if (navManagerRef.current) {
          navManagerRef.current.updatePosition({
            lat,
            lng,
            accuracy: 5,
            heading,
            speed,
            timestamp,
          });
        }
      }

      setLocationStatus('found');
      setOrigin({ lat, lng });

      // Update Markers
      try {
        const crsPos = gpsToCrsSimple(lat, lng);
        if (crsPos) {
          // User Marker
          if (!userMarkerRef.current && userIcon && mapInstance) {
            userMarkerRef.current = leafletModule
              .marker([crsPos.lat, crsPos.lng], {
                icon: userIcon,
                zIndexOffset: 1000,
              })
              .addTo(mapInstance);
          } else if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([crsPos.lat, crsPos.lng]);

            // Force "moving" visual state
            const iconElement = userMarkerRef.current.getElement();
            if (iconElement) {
              iconElement.classList.add('is-moving');
              const arrowElement = iconElement.querySelector('.user-motion-arrow') as HTMLElement;
              if (arrowElement) {
                arrowElement.style.transform = `translate(-50%, -50%) rotate(${heading - MOTION_ARROW_ROTATION_OFFSET}deg)`;
              }
            }
          }

          // Accuracy Circle
          if (!accuracyCircleRef.current) {
            if (mapInstance) {
              accuracyCircleRef.current = leafletModule
                .circle([crsPos.lat, crsPos.lng], {
                  radius: 10, // Small radius for sim
                  color: 'var(--mq-primary, #1a73e8)',
                  weight: 1,
                  opacity: 0.4,
                  fillOpacity: 0.1,
                })
                .addTo(mapInstance);
            }
          } else {
            accuracyCircleRef.current.setLatLng([crsPos.lat, crsPos.lng]);
          }
        }
      } catch (error) {
        logger.error('Simulation error:', error);
      }
    },
    [mapInstance, leafletModule, isMapReady, userIcon, navManagerRef],
  );

  return {
    locationStatus,
    setLocationStatus,
    smoothedPosition,
    origin,
    isOffCampus,
    centerOnUser,
    userMarkerRef,
    simulatePosition,
  };
}
