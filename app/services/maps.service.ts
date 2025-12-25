import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';
import {CAMPUS_COORDINATES, CAMPUS_ADDRESS} from '../config/maps.config';

/**
 * Get current device location
 */
export const getCurrentLocation = async (): Promise<{
  lat: number;
  lng: number;
} | null> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      return null;
    }
  }

  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => resolve(null),
      {enableHighAccuracy: true, timeout: 10000, maximumAge: 60000},
    );
  });
};

/**
 * Geocode an address to coordinates using Google Geocoding API
 * Note: Requires GOOGLE_MAPS_API_KEY to be set
 */
export const geocodeAddress = async (
  address: string,
): Promise<{latitude: number; longitude: number} | null> => {
  try {
    // In production, use your backend to call Google Geocoding API
    // For now, return fallback coordinates
    // TODO: Implement actual geocoding via backend API
    return CAMPUS_COORDINATES;
  } catch (error) {
    console.warn('Geocoding failed:', error);
    return CAMPUS_COORDINATES;
  }
};

/**
 * Get directions between two points
 * Returns route information including distance and estimated walking time
 */
export const getDirections = async (
  origin: {latitude: number; longitude: number},
  destination: {latitude: number; longitude: number},
): Promise<{
  distance: string;
  duration: string;
  polyline?: Array<{latitude: number; longitude: number}>;
} | null> => {
  try {
    // Calculate straight-line distance (Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const dLon = ((destination.longitude - origin.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.latitude * Math.PI) / 180) *
        Math.cos((destination.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Estimate walking time (5 km/h average)
    const walkingSpeedKmh = 5;
    const durationMinutes = Math.round((distanceKm / walkingSpeedKmh) * 60);

    return {
      distance: distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(2)}km`,
      duration: `${durationMinutes} min walk`,
    };
  } catch (error) {
    console.warn('Directions calculation failed:', error);
    return null;
  }
};

/**
 * Check if a coordinate is within campus bounds
 */
export const isWithinCampusBounds = (
  coordinate: {latitude: number; longitude: number},
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
): boolean => {
  return (
    coordinate.latitude >= bounds.south &&
    coordinate.latitude <= bounds.north &&
    coordinate.longitude >= bounds.west &&
    coordinate.longitude <= bounds.east
  );
};

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export const isPointInPolygon = (
  point: {latitude: number; longitude: number},
  polygon: Array<{latitude: number; longitude: number}>,
): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export const calculateDistance = (
  point1: {latitude: number; longitude: number},
  point2: {latitude: number; longitude: number},
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a coordinate is within a restricted zone
 * Returns the zone if breached, null otherwise
 */
export const checkGeofenceBreach = (
  coordinate: {latitude: number; longitude: number},
  zones: Array<{
    id: string;
    name: string;
    type: 'polygon' | 'circle';
    coordinates?: Array<{latitude: number; longitude: number}>;
    center?: {latitude: number; longitude: number};
    radius?: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>,
): {id: string; name: string; severity: 'low' | 'medium' | 'high'; description: string} | null => {
  for (const zone of zones) {
    if (zone.type === 'polygon' && zone.coordinates) {
      if (isPointInPolygon(coordinate, zone.coordinates)) {
        return {
          id: zone.id,
          name: zone.name,
          severity: zone.severity,
          description: zone.description,
        };
      }
    } else if (zone.type === 'circle' && zone.center && zone.radius) {
      const distance = calculateDistance(coordinate, zone.center);
      if (distance <= zone.radius) {
        return {
          id: zone.id,
          name: zone.name,
          severity: zone.severity,
          description: zone.description,
        };
      }
    }
  }
  return null;
};

/**
 * Find nearest emergency location
 * Returns the nearest location with distance
 */
export const findNearestEmergencyLocation = (
  currentLocation: {latitude: number; longitude: number},
  emergencyLocations: Array<{
    id: string;
    name: string;
    coordinate: {latitude: number; longitude: number};
    type: 'medical' | 'security' | 'exit';
    priority: number;
  }>,
): {
  location: {
    id: string;
    name: string;
    coordinate: {latitude: number; longitude: number};
    type: 'medical' | 'security' | 'exit';
    priority: number;
  };
  distance: number;
} | null => {
  if (emergencyLocations.length === 0) return null;

  let nearest = emergencyLocations[0];
  let minDistance = calculateDistance(currentLocation, nearest.coordinate);

  for (const location of emergencyLocations) {
    const distance = calculateDistance(currentLocation, location.coordinate);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = location;
    }
  }

  return {
    location: nearest,
    distance: minDistance,
  };
};

/**
 * Future-ready: Push notification for geo-fence breach
 * This is a placeholder structure for backend integration
 */
export const pushGeofenceNotification = async (
  zoneId: string,
  zoneName: string,
  severity: 'low' | 'medium' | 'high',
  coordinate: {latitude: number; longitude: number},
): Promise<void> => {
  // TODO: Implement backend API call to send push notification
  // Example structure:
  // await fetch('/api/geofence/alert', {
  //   method: 'POST',
  //   body: JSON.stringify({ zoneId, zoneName, severity, coordinate }),
  // });
  console.log('Geo-fence notification would be sent:', {zoneId, zoneName, severity, coordinate});
};

