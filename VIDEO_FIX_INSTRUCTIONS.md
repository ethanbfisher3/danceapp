# Fix for Video Player Error

The error occurs because the expo-av native module needs to be properly loaded. Follow these steps:

## Steps to Fix:

### 1. Stop Your Development Server

Press `Ctrl+C` in the terminal where Expo is running

### 2. Clear the Cache and Restart

Run one of these commands:

```bash
# Clear cache and start fresh
npx expo start -c

# OR if that doesn't work
npx expo start --clear
```

### 3. Rebuild the App (If using dev client)

If you're using a development build (not Expo Go), you may need to rebuild:

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

### 4. For Expo Go Users

If you're using Expo Go app on your phone:

- Make sure you're using the **latest version of Expo Go** from the app store
- Expo Go on SDK 54 supports expo-av v16.0.7 (which you have)
- After clearing cache, scan the QR code again

## Alternative: If Still Not Working

If the issue persists, try these additional steps:

1. **Clear all caches:**

   ```bash
   npx expo start --clear
   rm -rf node_modules
   npm install
   npx expo start -c
   ```

2. **Check your app.json** - Make sure it doesn't have any conflicting plugins

3. **Verify Video component is available:**
   Add this test to see if Video is available:
   ```javascript
   import { Video } from "expo-av"
   console.log("Video component:", Video)
   ```

## Why This Happens

The `expo-av` package includes native code that needs to be registered when the app starts. If you add it after the app is already running, or if the cache is stale, you'll get the "Invalid view returned from registry" error.

## Quick Test

After restarting with cache cleared, try playing a video again. The video should now work properly!
