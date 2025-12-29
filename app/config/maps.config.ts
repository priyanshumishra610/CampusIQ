/**
 * Google Maps Configuration
 * 
 * For React Native Maps, the API key must be configured in:
 * - Android: android/app/src/main/AndroidManifest.xml
 * - iOS: ios/CRM/AppDelegate.mm or Info.plist
 * 
 * This file provides the campus location and default settings.
 */

// Campus address - will be geocoded to coordinates
export const CAMPUS_ADDRESS = '68PX+2XP, Kohka, Bhilai, Chhattisgarh, 490024';

// Approximate coordinates for Bhilai, Chhattisgarh (will be refined via geocoding)
// These are fallback coordinates if geocoding fails
export const CAMPUS_COORDINATES = {
  latitude: 21.186460,
  longitude: 81.350941,
};

// Campus boundary polygon (approximate - should be refined based on actual campus layout)
// This creates a rectangular boundary around the campus area
export const CAMPUS_BOUNDARY = [
  {latitude: 21.1860, longitude: 81.3505}, // Southwest
  {latitude: 21.1870, longitude: 81.3505}, // Southeast
  {latitude: 21.1870, longitude: 81.3515}, // Northeast
  {latitude: 21.1860, longitude: 81.3515}, // Northwest
  {latitude: 21.1860, longitude: 81.3505}, // Close polygon
];

// Key campus locations (will be displayed as markers)
export const CAMPUS_LOCATIONS = [
  {
    id: 'admin-block',
    name: 'Admin Block',
    description: 'Main administrative building',
    coordinate: {latitude: 21.1865, longitude: 81.3509},
    type: 'building',
    icon: 'business',
  },
  {
    id: 'security-gate',
    name: 'Security Gate',
    description: 'Main entrance and security checkpoint',
    coordinate: {latitude: 21.1863, longitude: 81.3507},
    type: 'security',
    icon: 'security',
  },
  {
    id: 'hostel-north',
    name: 'North Hostel',
    description: 'Student accommodation - North Block',
    coordinate: {latitude: 21.1868, longitude: 81.3512},
    type: 'accommodation',
    icon: 'home',
  },
  {
    id: 'hostel-south',
    name: 'South Hostel',
    description: 'Student accommodation - South Block',
    coordinate: {latitude: 21.1862, longitude: 81.3512},
    type: 'accommodation',
    icon: 'home',
  },
  {
    id: 'innovation-lab',
    name: 'Innovation Lab',
    description: 'Research and development center',
    coordinate: {latitude: 21.1866, longitude: 81.3510},
    type: 'facility',
    icon: 'science',
  },
  {
    id: 'parking-main',
    name: 'Main Parking',
    description: 'Primary parking area',
    coordinate: {latitude: 21.1864, longitude: 81.3508},
    type: 'parking',
    icon: 'local-parking',
  },
  {
    id: 'library',
    name: 'Central Library',
    description: 'Main library and study area',
    coordinate: {latitude: 21.1867, longitude: 81.3509},
    type: 'facility',
    icon: 'local-library',
  },
  {
    id: 'cafeteria',
    name: 'Cafeteria',
    description: 'Main dining hall',
    coordinate: {latitude: 21.1865, longitude: 81.3511},
    type: 'facility',
    icon: 'restaurant',
  },
];

// Map view settings
export const MAP_SETTINGS = {
  initialZoom: 17,
  minZoom: 15,
  maxZoom: 20,
  // Restrict map bounds to campus area (with some buffer)
  bounds: {
    north: 21.1875,
    south: 21.1855,
    east: 81.3520,
    west: 81.3500,
  },
};

// Walking speed for time estimation (km/h)
export const WALKING_SPEED_KMH = 5;

// Geo-Fence Configuration
export interface RestrictedZone {
  id: string;
  name: string;
  type: 'polygon' | 'circle';
  coordinates?: Array<{latitude: number; longitude: number}>; // For polygon
  center?: {latitude: number; longitude: number}; // For circle
  radius?: number; // For circle (in meters)
  severity: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Restricted zones for geo-fencing
 * These areas trigger alerts when entered
 */
export const RESTRICTED_ZONES: RestrictedZone[] = [
  {
    id: 'admin-restricted',
    name: 'Admin Restricted Area',
    type: 'polygon',
    coordinates: [
      {latitude: 21.1864, longitude: 81.3508},
      {latitude: 21.1866, longitude: 81.3508},
      {latitude: 21.1866, longitude: 81.3510},
      {latitude: 21.1864, longitude: 81.3510},
      {latitude: 21.1864, longitude: 81.3508},
    ],
    severity: 'high',
    description: 'Authorized personnel only',
  },
  {
    id: 'lab-restricted',
    name: 'Innovation Lab Restricted',
    type: 'circle',
    center: {latitude: 21.1866, longitude: 81.3510},
    radius: 50, // 50 meters
    severity: 'medium',
    description: 'Research facility - restricted access',
  },
  {
    id: 'parking-restricted',
    name: 'Staff Parking Only',
    type: 'circle',
    center: {latitude: 21.1864, longitude: 81.3508},
    radius: 30,
    severity: 'low',
    description: 'Staff parking area',
  },
];

// Heatmap Configuration
export interface HeatmapDataPoint {
  latitude: number;
  longitude: number;
  intensity: number; // 0-1
}

export type HeatmapMode = 'event-footfall' | 'library-density' | null;

/**
 * Generate simulated heatmap data
 * In production, replace with real-time data from backend
 */
export const generateHeatmapData = (mode: HeatmapMode): HeatmapDataPoint[] => {
  if (!mode) return [];

  const data: HeatmapDataPoint[] = [];

  if (mode === 'event-footfall') {
    // Simulate event footfall around common areas
    const eventLocations = [
      {lat: 21.1865, lng: 81.3509, intensity: 0.9}, // Admin area
      {lat: 21.1867, lng: 81.3509, intensity: 0.8}, // Library
      {lat: 21.1865, lng: 81.3511, intensity: 0.7}, // Cafeteria
    ];

    eventLocations.forEach(loc => {
      // Create cluster of points around each location
      for (let i = 0; i < 15; i++) {
        data.push({
          latitude: loc.lat + (Math.random() - 0.5) * 0.001,
          longitude: loc.lng + (Math.random() - 0.5) * 0.001,
          intensity: loc.intensity * (0.7 + Math.random() * 0.3),
        });
      }
    });
  } else if (mode === 'library-density') {
    // Simulate library usage density
    const libraryCenter = {lat: 21.1867, lng: 81.3509};
    for (let i = 0; i < 25; i++) {
      data.push({
        latitude: libraryCenter.lat + (Math.random() - 0.5) * 0.0008,
        longitude: libraryCenter.lng + (Math.random() - 0.5) * 0.0008,
        intensity: 0.5 + Math.random() * 0.5,
      });
    }
  }

  return data;
};

// Emergency Mode Configuration
export interface EmergencyLocation {
  id: string;
  name: string;
  coordinate: {latitude: number; longitude: number};
  type: 'medical' | 'security' | 'exit';
  priority: number;
}

/**
 * Critical locations for emergency mode
 */
export const EMERGENCY_LOCATIONS: EmergencyLocation[] = [
  {
    id: 'medical-room',
    name: 'Medical Room',
    coordinate: {latitude: 21.1865, longitude: 81.3509},
    type: 'medical',
    priority: 1,
  },
  {
    id: 'security-office',
    name: 'Security Office',
    coordinate: {latitude: 21.1863, longitude: 81.3507},
    type: 'security',
    priority: 2,
  },
  {
    id: 'main-gate-emergency',
    name: 'Main Gate',
    coordinate: {latitude: 21.1863, longitude: 81.3507},
    type: 'exit',
    priority: 3,
  },
];

// Map Intro Animation Configuration
export const ENABLE_MAP_INTRO = true; // Set to false to disable intro animation

export const MAP_INTRO_CONFIG = {
  startZoom: 0.05, // Very zoomed out
  endZoom: 0.005, // Final zoom level
  startPitch: 60, // Tilt angle (iOS only)
  endPitch: 0, // Final pitch
  duration: 3000, // Animation duration in ms
  rotation: 15, // Slight rotation during animation
};

