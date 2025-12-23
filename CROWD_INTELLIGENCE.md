# Crowd Intelligence & Heatmap Feature

## Overview

Privacy-first crowd density monitoring system using Google technologies. Provides real-time heatmaps of crowd density on campus without tracking individual users.

## Architecture

### Data Flow

1. **Client App** → Anonymous location ping (coarse location, geohashed)
2. **Cloud Function** (`submitLocationPing`) → Validates & stores ping
3. **Pub/Sub** → Triggers aggregation (optional, can use batch job)
4. **Cloud Function** (`batchAggregateHeatmap`) → Aggregates pings every 5 minutes
5. **Firestore** → Stores aggregated heatmap cells
6. **Admin App** → Reads heatmap data and displays on Google Maps

### Privacy & Security

- **No PII**: Location pings are anonymized (geohash precision ~150m)
- **Aggregation Threshold**: Minimum 3 devices per cell (k-anonymity)
- **Rate Limiting**: 60 pings/hour per user
- **Admin-Only Access**: Only admins can view heatmap data
- **Automatic Cleanup**: Raw pings deleted after 24 hours

### Collections

- `locationPings`: Raw anonymous location pings (temporary, auto-deleted)
- `heatmapCells`: Aggregated density data (geohash → count mapping)

## Setup

### 1. Firebase Configuration

Ensure your Firebase project has:
- Firestore enabled
- Cloud Functions enabled
- Pub/Sub API enabled (optional, for real-time aggregation)

### 2. Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 3. Update Firestore Rules

The security rules have been updated in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

### 4. Enable Location Tracking (Optional)

To enable automatic location pinging when users open the app, add this to your app initialization:

```typescript
import {startLocationTracking, stopLocationTracking} from './services/crowdIntelligence.service';

// In App.tsx or RootNavigator.tsx
useEffect(() => {
  // Start tracking when user is authenticated
  if (user) {
    startLocationTracking();
    return () => {
      stopLocationTracking();
    };
  }
}, [user]);
```

**Note**: Users must grant location permissions. The app should request permissions before starting tracking.

### 5. Google Maps API Key

Ensure your `react-native-maps` is configured with Google Maps API key:

- Android: Add to `android/app/src/main/AndroidManifest.xml`
- iOS: Add to `ios/CRM/Info.plist`

## Usage

### Admin View

1. Navigate to "Crowd Intel" tab (visible to DEAN, DIRECTOR, EXECUTIVE roles)
2. Select time window: "Last 15 min", "Last 1 hour", or "Today"
3. View heatmap overlay on Google Maps
4. See top hotspots listed below the map

### Time Windows

- **15min**: Real-time crowd density (last 15 minutes)
- **1hr**: Recent trends (last hour)
- **today**: Daily patterns (since midnight)

## Cloud Functions

### `submitLocationPing`

**Endpoint**: Callable function  
**Purpose**: Receive anonymous location pings from clients  
**Rate Limit**: 60 pings/hour per user  
**Returns**: `{ success: true, geohash: string }`

### `getHeatmapData`

**Endpoint**: Callable function  
**Purpose**: Retrieve aggregated heatmap data for admin dashboard  
**Auth**: Admin only  
**Parameters**: `{ timeWindow: '15min' | '1hr' | 'today' }`  
**Returns**: `{ cells: HeatmapCell[], count: number }`

### `batchAggregateHeatmap`

**Trigger**: Cloud Scheduler (every 5 minutes)  
**Purpose**: Batch process location pings and update heatmap cells  
**Runs**: Automatically via Pub/Sub schedule

### `aggregateLocationPings`

**Trigger**: Pub/Sub topic `location-pings`  
**Purpose**: Real-time aggregation (optional, can be enabled for faster updates)  
**Note**: Currently disabled, using batch job instead

## Permissions

- `crowd:view`: Required to view heatmap screen
- Granted to: DEAN, DIRECTOR, EXECUTIVE roles

## Customization

### Campus Location

Update default coordinates in `CrowdHeatmapScreen.tsx`:

```typescript
const DEFAULT_REGION = {
  latitude: YOUR_CAMPUS_LAT,
  longitude: YOUR_CAMPUS_LNG,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};
```

### Geohash Precision

Adjust precision in `functions/src/index.ts`:

```typescript
const geohash = encodeGeohash(lat, lng, 7); // 7 = ~150m, increase for more precision
```

### Aggregation Threshold

Change minimum devices per cell in `functions/src/index.ts`:

```typescript
if (count >= 3) { // Change 3 to desired threshold
  // Store cell
}
```

### Ping Interval

Adjust in `src/services/crowdIntelligence.service.ts`:

```typescript
const PING_INTERVAL_MS = 60 * 1000; // 1 minute
```

## Troubleshooting

### No heatmap data showing

1. Check if location pings are being submitted (check Firestore `locationPings` collection)
2. Verify batch aggregation job is running (check Cloud Functions logs)
3. Ensure minimum threshold (3 devices) is met
4. Check time window - data may not exist for selected window

### Location tracking not working

1. Verify location permissions are granted
2. Check `getCurrentLocation()` function in `maps.service.ts`
3. Ensure `startLocationTracking()` is called when app initializes

### Permission denied errors

1. Verify user has admin role
2. Check `crowd:view` permission is granted to user's role
3. Verify Firestore security rules are deployed

## Future Enhancements

- Real-time aggregation via Pub/Sub (currently using batch job)
- BigQuery integration for historical analytics
- Wi-Fi access point density signals
- Google Maps Popular Times integration
- Custom hotspot categories (library, canteen, etc.)

## Security Notes

- All location data is anonymized server-side
- Raw pings are automatically deleted after 24 hours
- Only aggregated data (minimum 3 devices) is stored
- Admin-only access enforced at Cloud Function level
- Rate limiting prevents abuse

