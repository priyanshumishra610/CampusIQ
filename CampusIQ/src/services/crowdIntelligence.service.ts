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

import {functions} from './firebase';
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
    
    // Call Cloud Function to submit ping
    const submitPing = functions().httpsCallable('submitLocationPing');
    await submitPing({
      lat: location.lat,
      lng: location.lng,
      accuracy: null, // Optional: can add accuracy if needed
    });
    
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
    timeWindow: string;
  }>;
  count: number;
}> => {
  try {
    const getHeatmap = functions().httpsCallable('getHeatmapData');
    const result = await getHeatmap({ timeWindow });
    return result.data as any;
  } catch (error: any) {
    console.error('[CrowdIntelligence] Error fetching heatmap data:', error);
    throw error;
  }
};

