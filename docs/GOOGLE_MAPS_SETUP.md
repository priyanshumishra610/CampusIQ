# Google Maps Integration Setup Guide

This guide will help you set up Google Maps Platform for CampusIQ.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project with billing enabled
3. Google Maps Platform APIs enabled

## Step 1: Create API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **API Key**
5. Copy your API key (you'll need it in the next steps)

## Step 2: Enable Required APIs

Enable the following APIs in your GCP project:

- **Maps SDK for Android** (for Android app)
- **Maps SDK for iOS** (for iOS app)
- **Geocoding API** (for address to coordinates conversion)
- **Directions API** (for route planning)
- **Places API** (optional, for enhanced search)

To enable:
1. Go to **APIs & Services** > **Library**
2. Search for each API and click **Enable**

## Step 3: Restrict API Key (Security Best Practice)

1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**:
   - For Android: Select **Android apps** and add your package name (`com.campusiq`) and SHA-1 certificate fingerprint
   - For iOS: Select **iOS apps** and add your bundle identifier
4. Under **API restrictions**: Select **Restrict key** and choose only the APIs you enabled
5. Click **Save**

## Step 4: Configure Android

1. Open `android/app/src/main/AndroidManifest.xml`
2. Find the `<meta-data>` tag with `com.google.android.geo.API_KEY`
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_ACTUAL_API_KEY_HERE" />
```

## Step 5: Configure iOS

1. Open `ios/CRM/AppDelegate.mm`
2. Find the line with `[GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];`
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:

```objc
[GMSServices provideAPIKey:@"YOUR_ACTUAL_API_KEY_HERE"];
```

## Step 6: Install iOS Dependencies

If you haven't already, install CocoaPods dependencies:

```bash
cd ios
pod install
cd ..
```

## Step 7: Update Campus Coordinates (Optional)

If you need to adjust the campus location or boundary:

1. Open `app/config/maps.config.ts`
2. Update `CAMPUS_COORDINATES` with exact coordinates
3. Update `CAMPUS_BOUNDARY` array with actual campus boundary points
4. Update `CAMPUS_LOCATIONS` with real campus building locations

## Step 8: Test the Integration

1. Rebuild the app:
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

2. Navigate to the **Map** tab in the app
3. Verify that:
   - Map loads correctly
   - Campus boundary polygon is visible
   - Campus location markers appear
   - Map type toggle works (Map/Satellite/Hybrid)
   - Search functionality works
   - Directions feature works

## Troubleshooting

### Map Not Loading

- **Check API key**: Ensure the API key is correctly set in both Android and iOS configs
- **Check API restrictions**: Verify the API key has access to Maps SDK
- **Check billing**: Ensure billing is enabled in your GCP project
- **Check console logs**: Look for error messages in Metro bundler or device logs

### "API key not valid" Error

- Verify the API key is correct
- Check that the API key restrictions match your app's package name/bundle ID
- Ensure the required APIs are enabled

### Map Shows Blank/Gray

- Check internet connection
- Verify API key is set correctly
- Check that Maps SDK for Android/iOS is enabled in GCP
- Try clearing app cache and rebuilding

### iOS Build Errors

- Run `pod install` in the `ios` directory
- Clean build folder: `cd ios && xcodebuild clean`
- Ensure Google Maps SDK is properly linked in Podfile

## Security Notes

- **Never commit API keys to version control**: The `.gitignore` file is configured to exclude `.env` files
- **Use different keys for development and production**: Create separate API keys with appropriate restrictions
- **Monitor usage**: Set up billing alerts in GCP to avoid unexpected charges
- **Rotate keys regularly**: Update API keys periodically for security

## Cost Considerations

Google Maps Platform offers a free tier:
- **$200 free credit per month** (covers most small to medium usage)
- After free credit, pay-as-you-go pricing applies
- Monitor usage in GCP Console > Billing

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [React Native Maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Google Maps Platform documentation
3. Check React Native Maps GitHub issues
4. Contact your development team



