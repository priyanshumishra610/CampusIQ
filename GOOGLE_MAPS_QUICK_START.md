# Google Maps Integration - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Get Your API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable: **Maps SDK for Android**, **Maps SDK for iOS**, **Geocoding API**, **Directions API**
4. Create API key in **APIs & Services** > **Credentials**

### 2. Configure Android
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY_HERE" />
```

### 3. Configure iOS
Edit `ios/CRM/AppDelegate.mm`:
```objc
[GMSServices provideAPIKey:@"YOUR_API_KEY_HERE"];
```

Then run:
```bash
cd ios && pod install && cd ..
```

### 4. Rebuild & Test
```bash
npm run android  # or npm run ios
```

Navigate to the **Map** tab in the app.

## 📍 Campus Location

The map is configured for:
**68PX+2XP, Kohka, Bhilai, Chhattisgarh, 490024**

To update coordinates, edit `app/config/maps.config.ts`

## ✨ Features

- ✅ Campus boundary polygon
- ✅ 8 key location markers
- ✅ Map/Satellite/Hybrid toggle
- ✅ Search campus locations
- ✅ Directions with distance/time
- ✅ Radius selection tool
- ✅ 3D view (iOS)

## 📚 Full Documentation

See `docs/GOOGLE_MAPS_SETUP.md` for detailed setup instructions.

## ⚠️ Troubleshooting

**Map not loading?**
- Check API key is set correctly
- Verify APIs are enabled in GCP
- Check internet connection
- Review console logs for errors

**iOS build errors?**
- Run `pod install` in `ios/` directory
- Clean build: `cd ios && xcodebuild clean`

## 🔒 Security

- Never commit API keys to git
- Use key restrictions in GCP Console
- Different keys for dev/prod recommended

