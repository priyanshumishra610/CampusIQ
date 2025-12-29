/**
 * 🔒 Crowd Intelligence Service
 * 
 * Privacy-first location pinging for crowd heatmap generation.
 * 
 * Security Features:
 * - Anonymous location pings (no PII)
 * - Coarse location only (geohash-based, ~150m accuracy)
 * - Rate-limited (60 pings/hour)
 * - Aggregated server-side (minimum 3 devices per cell)
 * 
 * Usage:
 * - Call startLocationTracking() to begin periodic pings
 * - Call stopLocationTracking() to stop
 * - Pings are automatically anonymized and aggregated
 */

import apiClient from './api.client';
import {getCurrentLocation} from './maps.service';

let locationTrackingInterval: NodeJS.Timeout | null = null;
const PING_INTERVAL_MS = 60 * 1000; // 1 minute between pings

/**
 * Submit an anonymous location ping
 * 
 * Privacy: Location is geohashed server-side, no exact coordinates stored
 */
export const submitLocationPing = async (): Promise<boolean> => {
  try {
    const location = await getCurrentLocation();
    
    if (!location) {
      console.warn('[CrowdIntelligence] Location not available');
      return false;
    }
    
    // Note: Backend doesn't have location ping endpoint yet
    // This would need to be added
    // For now, just log (privacy-safe)
    console.log('[CrowdIntelligence] Location ping would be submitted');
    
    return true;
  } catch (error: any) {
    console.error('[CrowdIntelligence] Error submitting location ping:', error);
    return false;
  }
};

/**
 * Start periodic location tracking
 * 
 * Note: This should be called when user opens the app
 * and has granted location permissions.
 */
export const startLocationTracking = (): void => {
  if (locationTrackingInterval) {
    console.warn('[CrowdIntelligence] Location tracking already started');
    return;
  }
  
  // Submit initial ping
  submitLocationPing();
  
  // Set up periodic pings
  locationTrackingInterval = setInterval(() => {
    submitLocationPing();
  }, PING_INTERVAL_MS);
  
  console.log('[CrowdIntelligence] Location tracking started');
};

/**
 * Stop periodic location tracking
 */
export const stopLocationTracking = (): void => {
  if (locationTrackingInterval) {
    clearInterval(locationTrackingInterval);
    locationTrackingInterval = null;
    console.log('[CrowdIntelligence] Location tracking stopped');
  }
};

/**
 * Get heatmap data for admin dashboard
 * 
 * @param timeWindow - '15min' | '1hr' | 'today'
 */
export const getHeatmapData = async (
  timeWindow: '15min' | '1hr' | 'today' = '15min'
): Promise<{
  cells: Array<{
    geohash: string;
    lat: number;
    lng: number;
    count: number;
    lastUpdated: any;
  }>;
  timestamp: number;
}> => {
  try {
    // Note: Backend doesn't have heatmap endpoint yet
    // This would need to be added
    // Return empty data for now
    return {
      cells: [],
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('[CrowdIntelligence] Error fetching heatmap data:', error);
    return {
      cells: [],
      timestamp: Date.now(),
    };
  }
};
