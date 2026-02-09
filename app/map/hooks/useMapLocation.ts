import { useState, useEffect, useRef, useCallback } from 'react';
import { toastUtils } from '@/lib/utils/toast';
import { devLog } from '@/lib/utils/devLog';
import { errorHandler } from '@/lib/utils/errorHandling';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';
import { GPS_CAMPUS_BOUNDS } from '@/lib/map/constants';
import { gpsToCrsSimple } from '@/lib/map/geospatialCalibration';
import {
  GpsPositionSmoother,
  type SmoothedPosition,
  NavigationStateManager,
} from '@/lib/map/realtimeNavigation';
import type { LocationStatus } from '../CampusMap';
import type { Map as LeafletMap, Marker, Circle, Icon } from 'leaflet';
import { logger } from '@/lib/logger';

// Constants
const LOCATION_TIMEOUT = 15000;
const SPEED_CALC_THRESHOLD = 0.5; // seconds
const WALKING_SPEED_LIMIT = 10; // m/s
const MOVEMENT_THRESHOLD = 0.2; // m/s

// Logger
const mapLog = devLog.map;

const NAVIGATION_ACTIVE_STATUSES: Array<ReturnType<NavigationStateManager['getState']>['status']> =
  ['navigating', 'off-route', 'recalculating'];

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
  const lastPositionRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const positionSmootherRef = useRef<GpsPositionSmoother | null>(null);
  const offCampusToastShown = useRef(false);
  const safeTRef = useRef(safeT);

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

    // Passive listener, no permission request needed unless on iOS 13+
    // If permission is needed, this will just stay silent until granted elsewhere.
    window.addEventListener('devicemotion', handleMotion, { passive: true });

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      clearTimeout(motionTimeout);
    };
  }, [navManagerRef]);

  // Geolocation Effect
  useEffect(() => {
    if (!mapInstance || !isMapReady(mapInstance) || !leafletModule || !navigator.geolocation) {
      if (typeof navigator !== 'undefined' && !navigator.geolocation) {
        mapLog.log('Geolocation API not available');
        // Avoid synchronous state update in effect
        setTimeout(() => setLocationStatus('error'), 0);
      }
      return;
    }

    mapLog.log('Starting geolocation watch...');
    setTimeout(() => setLocationStatus('searching'), 0);

    const watchId = navigator.geolocation.watchPosition(
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

        lastPositionRef.current = { lat: gpsLat, lng: gpsLng, time: currentTime };

        // Kalman Smoothing
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
              heading: gpsHeading,
              speed: gpsSpeed,
              timestamp: currentTime,
            });
          }
        }

        setLocationStatus('found');
        setOrigin({ lat: gpsLat, lng: gpsLng });

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

        // Update Markers (Pixel Coordinates)
        try {
          // gpsToCrsSimple returns { lat, lng } which are CRS.Simple coordinates (pixel-based but labeled lat/lng)
          const crsPos = gpsToCrsSimple(gpsLat, gpsLng);

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
                if (isMoving && typeof gpsHeading === 'number' && !isNaN(gpsHeading)) {
                  iconElement.classList.add('is-moving');
                  const arrowElement = iconElement.querySelector(
                    '.user-motion-arrow',
                  ) as HTMLElement;
                  if (arrowElement) {
                    arrowElement.style.transform = `translate(-50%, -50%) rotate(${gpsHeading - 45}deg)`;
                  }
                } else {
                  iconElement.classList.remove('is-moving');
                }

                // Heading Flash
                const flashElement = iconElement.querySelector(
                  '.user-heading-flash',
                ) as HTMLElement;
                if (flashElement) {
                  if (typeof gpsHeading === 'number' && !isNaN(gpsHeading)) {
                    flashElement.style.transform = `rotate(${gpsHeading}deg)`;
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
          // Retry automatically? For now just log
        }
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT,
        maximumAge: 2000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
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
        safeTRef.current('waitLocation', 'Please wait for your location to be found.'),
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
                arrowElement.style.transform = `translate(-50%, -50%) rotate(${heading - 45}deg)`;
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
