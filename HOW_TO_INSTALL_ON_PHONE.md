# How to Install DanceApp on Your Phone

There are several ways to get your DanceApp on your phone. Choose the method that works best for you:

---

## Method 1: Expo Go (Easiest - For Testing)

**Best for**: Quick testing, development, temporary use

### Steps:

1. **Install Expo Go on your phone:**

   - **Android**: [Download from Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS**: [Download from Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Start the development server on your computer:**

   ```bash
   cd C:\Users\ethan\Apps\Routines
   npm start
   ```

3. **Connect your phone:**

   - **Android**: Open Expo Go app → Scan the QR code from your terminal
   - **iOS**: Open Camera app → Scan the QR code → Tap "Open in Expo Go"

4. **Requirements:**
   - ✅ Phone and computer must be on the same WiFi network
   - ✅ Computer must be running the dev server
   - ❌ Won't work when computer is off

### Pros:

- ✅ Super easy and fast
- ✅ Instant updates when you change code
- ✅ No build process needed

### Cons:

- ❌ Requires computer to be running
- ❌ Requires same WiFi network
- ❌ Not a standalone app

---

## Method 2: EAS Build - APK (Best for Android)

**Best for**: Standalone app on Android, works offline

### Steps:

1. **Install EAS CLI globally:**

   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo (create free account if needed):**

   ```bash
   eas login
   ```

3. **Configure your project:**

   ```bash
   cd C:\Users\ethan\Apps\Routines
   eas build:configure
   ```

4. **Build an APK for Android:**

   ```bash
   eas build -p android --profile preview
   ```

   This will:

   - Upload your code to Expo servers
   - Build the app in the cloud
   - Give you a download link when done (takes ~10-20 minutes)

5. **Install on your phone:**
   - Download the APK file from the link
   - Open the APK on your Android phone
   - Allow installation from unknown sources if prompted
   - Install and run!

### Pros:

- ✅ Standalone app - works offline
- ✅ No computer needed after installation
- ✅ Can share with others
- ✅ Feels like a real app

### Cons:

- ⏱️ Takes 10-20 minutes to build
- 📶 Requires internet for building
- 🔄 Need to rebuild for updates

---

## Method 3: Development Build (Advanced)

**Best for**: Local building, full control

### For Android:

1. **Install Android Studio** (if not installed)

2. **Build the app locally:**

   ```bash
   cd C:\Users\ethan\Apps\Routines
   npm run android
   ```

3. **Connect your phone via USB:**

   - Enable Developer Options on phone
   - Enable USB Debugging
   - Connect phone to computer
   - Trust the computer when prompted

4. The app will install directly on your phone

### For iOS:

1. **Requires a Mac** with Xcode installed

2. **Build the app:**
   ```bash
   npm run ios
   ```

---

## Recommended Approach

### For Quick Testing (Now):

Use **Method 1 (Expo Go)**

- Takes 2 minutes
- Perfect for testing your app

### For Daily Use (Later):

Use **Method 2 (EAS Build)**

- Creates a real standalone app
- Works without computer
- Can use anywhere

---

## Quick Start Commands

### Expo Go (Method 1):

```bash
cd C:\Users\ethan\Apps\Routines
npm start
# Then scan QR code with your phone
```

### EAS Build (Method 2):

```bash
cd C:\Users\ethan\Apps\Routines
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
# Wait for build, then download APK to phone
```

---

## Your Data

### Important Note:

- Data is stored locally on each device using AsyncStorage
- Routines/steps created on your phone won't sync to computer (and vice versa)
- Each installation has its own separate data

### To Share Data Between Devices:

You would need to implement cloud sync (future feature), or manually export/import data.

---

## Need Help?

### If Expo Go won't connect:

1. Make sure phone and computer are on same WiFi
2. Try typing your computer's IP address manually in Expo Go
3. Disable firewall temporarily

### If EAS Build fails:

1. Make sure you're logged in: `eas whoami`
2. Check your app.json configuration
3. Read the build logs for errors

### If APK won't install:

1. Enable "Install from Unknown Sources" in Android settings
2. Download APK directly to phone (not computer)
3. Use a file manager app to find and open the APK

---

**Ready to try? Start with Expo Go - it's the easiest way to get your app on your phone right now!** 📱💃🕺


