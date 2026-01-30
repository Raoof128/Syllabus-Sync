/**
 * IP Anomaly Detection
 *
 * SECURITY: This module provides IP anomaly detection capabilities for enhanced security.
 * It helps detect suspicious login attempts from unusual locations or IP addresses.
 *
 * Implementation:
 * - IP geolocation tracking
 * - Anomaly detection based on location changes
 * - Velocity checking (rapid location changes)
 * - Risk scoring and alerting
 */

import { NextRequest } from 'next/server';
import { getClientIP } from '@/lib/security/ip';

// ============================================================================
// TYPES
// ============================================================================

export interface IPInfo {
  /** IP address */
  ip: string;
  /** Country code */
  country?: string;
  /** City */
  city?: string;
  /** Region */
  region?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** ISP */
  isp?: string;
  /** Is this a VPN/Proxy? */
  isProxy?: boolean;
  /** Is this a Tor exit node? */
  isTor?: boolean;
  /** Timestamp */
  timestamp: Date;
}

export interface IPAnomalyResult {
  /** Is this IP anomalous? */
  isAnomalous: boolean;
  /** Risk score (0-100) */
  riskScore: number;
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Reasons for anomaly */
  reasons: string[];
  /** Distance from previous location (km) */
  distanceFromPrevious?: number;
  /** Time since previous location (hours) */
  timeSincePrevious?: number;
}

export interface IPHistory {
  userId: string;
  ipHistory: IPInfo[];
  lastSeen: Date;
}

// ============================================================================
// IP GEOLOCATION
// ============================================================================

/**
 * Get geolocation information for an IP address
 * Uses a free IP geolocation API (ip-api.com)
 * In production, use a paid service like MaxMind GeoIP2
 *
 * @param ip - The IP address
 * @returns Promise resolving to IP info
 */
export async function getIPGeolocation(ip: string): Promise<IPInfo> {
  try {
    // Skip localhost and private IPs
    if (isPrivateIP(ip)) {
      return {
        ip,
        country: 'LOCAL',
        city: 'Localhost',
        timestamp: new Date(),
      };
    }

    // Use ip-api.com (free, no API key required)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,region,lat,lon,isp,proxy,hosting,query`);
    
    if (!response.ok) {
      throw new Error(`IP geolocation API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(`IP geolocation failed: ${data.message}`);
    }

    return {
      ip: data.query,
      country: data.countryCode,
      city: data.city,
      region: data.region,
      latitude: data.lat,
      longitude: data.lon,
      isp: data.isp,
      isProxy: data.proxy || data.hosting,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('IP geolocation error:', error);
    // Return minimal info on error
    return {
      ip,
      timestamp: new Date(),
    };
  }
}

/**
 * Check if an IP address is private
 */
function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^::1$/,
    /^fe80:/,
    /^fc00:/,
  ];

  return privateRanges.some((range) => range.test(ip));
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detect IP anomalies based on history
 *
 * @param currentIP - Current IP address
 * @param ipHistory - History of IP addresses for the user
 * @returns Promise resolving to anomaly result
 */
export async function detectIPAnomaly(
  currentIP: string,
  ipHistory: IPInfo[]
): Promise<IPAnomalyResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  // Get current IP info
  const currentIPInfo = await getIPGeolocation(currentIP);

  // Check if this is a new IP
  const previousIPs = ipHistory.filter((ip) => ip.ip !== currentIP);
  const isNewIP = previousIPs.length === 0 || !previousIPs.some((ip) => ip.ip === currentIP);

  if (isNewIP && previousIPs.length > 0) {
    reasons.push('New IP address detected');
    riskScore += 20;
  }

  // Check for VPN/Proxy
  if (currentIPInfo.isProxy) {
    reasons.push('VPN or proxy detected');
    riskScore += 30;
  }

  // Check for Tor exit node
  if (currentIPInfo.isTor) {
    reasons.push('Tor exit node detected');
    riskScore += 40;
  }

  // Check for country change
  if (previousIPs.length > 0) {
    const lastIP = previousIPs[0];
    if (lastIP.country && currentIPInfo.country && lastIP.country !== currentIPInfo.country) {
      reasons.push(`Country changed from ${lastIP.country} to ${currentIPInfo.country}`);
      riskScore += 25;
    }

    // Calculate distance and time
    if (lastIP.latitude && lastIP.longitude &&
        currentIPInfo.latitude && currentIPInfo.longitude) {
      const distance = calculateDistance(
        lastIP.latitude,
        lastIP.longitude,
        currentIPInfo.latitude,
        currentIPInfo.longitude
      );

      const timeDiff = (currentIPInfo.timestamp.getTime() - lastIP.timestamp.getTime()) / (1000 * 60 * 60); // hours

      // Check for impossible travel (velocity anomaly)
      if (distance > 1000 && timeDiff < 2) {
        // More than 1000km in less than 2 hours
        reasons.push(`Impossible travel detected: ${Math.round(distance)}km in ${Math.round(timeDiff)}h`);
        riskScore += 50;
      } else if (distance > 500 && timeDiff < 4) {
        // More than 500km in less than 4 hours
        reasons.push(`Rapid travel detected: ${Math.round(distance)}km in ${Math.round(timeDiff)}h`);
        riskScore += 30;
      }
    }
  }

  // Determine risk level
  const riskLevel = getRiskLevel(riskScore);

  return {
    isAnomalous: riskScore >= 30,
    riskScore,
    riskLevel,
    reasons,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 20) return 'low';
  if (score < 40) return 'medium';
  if (score < 60) return 'high';
  return 'critical';
}

// ============================================================================
// IP HISTORY MANAGEMENT
// ============================================================================

/**
 * Get IP history for a user
 * In production, this would fetch from a database
 */
export async function getIPHistory(_userId: string): Promise<IPInfo[]> {
  // In a real implementation, this would fetch from a database
  // For now, return empty array
  return [];
}

/**
 * Add IP to user's history
 * In production, this would store to a database
 */
export async function addIPToHistory(
  _userId: string,
  _ipInfo: IPInfo
): Promise<void> {
  // In a real implementation, this would store to a database
  // await db.ipHistory.upsert({ userId, ...ipInfo });
}

/**
 * Clean up old IP history entries
 * Keeps only the most recent entries (default: 50)
 */
export async function cleanupIPHistory(
  _userId: string,
  _maxEntries: number = 50
): Promise<void> {
  // In a real implementation, this would clean up the database
  // await db.ipHistory.deleteMany({ userId }, { orderBy: { timestamp: 'desc' }, skip: maxEntries });
}

// ============================================================================
// REQUEST ANALYSIS
// ============================================================================

/**
 * Analyze a request for IP anomalies
 * This is a convenience function for use in middleware or API routes
 *
 * @param request - The request to analyze
 * @param userId - The user ID (optional)
 * @returns Promise resolving to anomaly result
 */
export async function analyzeRequestForAnomaly(
  request: NextRequest,
  userId?: string
): Promise<IPAnomalyResult> {
  const ip = getClientIP(request);

  if (!userId) {
    // No user ID, just check for basic anomalies
    const ipInfo = await getIPGeolocation(ip);
    const reasons: string[] = [];

    if (ipInfo.isProxy) {
      reasons.push('VPN or proxy detected');
    }

    if (ipInfo.isTor) {
      reasons.push('Tor exit node detected');
    }

    return {
      isAnomalous: reasons.length > 0,
      riskScore: reasons.length > 0 ? 30 : 0,
      riskLevel: reasons.length > 0 ? 'medium' : 'low',
      reasons,
    };
  }

  // Get IP history for user
  const ipHistory = await getIPHistory(userId);

  // Detect anomalies
  const result = await detectIPAnomaly(ip, ipHistory);

  // Add current IP to history
  await addIPToHistory(userId, await getIPGeolocation(ip));

  // Clean up old history
  await cleanupIPHistory(userId);

  return result;
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Assess overall risk based on IP anomaly result
 * Returns whether additional verification is required
 */
export function assessRisk(result: IPAnomalyResult): {
  requiresVerification: boolean;
  verificationMethod: 'none' | 'email' | '2fa' | 'block';
  message: string;
} {
  if (result.riskLevel === 'critical') {
    return {
      requiresVerification: true,
      verificationMethod: 'block',
      message: 'Suspicious activity detected. Please contact support.',
    };
  }

  if (result.riskLevel === 'high') {
    return {
      requiresVerification: true,
      verificationMethod: '2fa',
      message: 'Unusual login detected. Please verify your identity with 2FA.',
    };
  }

  if (result.riskLevel === 'medium') {
    return {
      requiresVerification: true,
      verificationMethod: 'email',
      message: 'New location detected. Please verify your email.',
    };
  }

  return {
    requiresVerification: false,
    verificationMethod: 'none',
    message: '',
  };
}

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * API route handler for IP anomaly check
 * Use this in /api/security/check-ip-anomaly
 */
export async function handleIPAnomalyCheck(
  request: Request,
  userId?: string
): Promise<Response> {
  try {
    const body = await request.json();
    const { ip } = body;

    if (!ip) {
      return Response.json(
        { error: { code: 'MISSING_IP', message: 'IP address is required' } },
        { status: 400 }
      );
    }

    const ipHistory = userId ? await getIPHistory(userId) : [];
    const result = await detectIPAnomaly(ip, ipHistory);

    const riskAssessment = assessRisk(result);

    return Response.json({
      anomaly: result,
      riskAssessment,
    });
  } catch (error) {
    console.error('IP anomaly check error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to check IP anomaly' } },
      { status: 500 }
    );
  }
}
