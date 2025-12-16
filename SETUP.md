# Setup Instructions

## Successfully Transferred from DanceApp

All functionality from the original DanceApp has been transferred to this Routines workspace with a cleaner dependency setup.

## What Was Transferred

✅ All dance data (20+ dance styles, moves, and details)
✅ Routines management screen
✅ Routine detail screen with drag-and-drop
✅ Info screen
✅ Settings screen
✅ Complete navigation structure
✅ AsyncStorage for data persistence
✅ All styling and UI components

## Installation Complete

Dependencies have been installed successfully. The app is ready to run!

## Running the App

### Start Development Server

```bash
npm start
```

### Run on Specific Platform

```bash
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## Key Differences from DanceApp

1. **Expo Router**: Uses modern file-based routing instead of React Navigation directly
2. **Better Structure**: Cleaner folder organization with TypeScript support
3. **Updated Dependencies**: All dependencies are compatible versions
4. **No Dependency Conflicts**: Resolved all the npm/dependency issues from DanceApp

## Project Structure

```
Routines/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab navigation configuration
│   │   ├── index.tsx          # Routines tab (Stack Navigator)
│   │   ├── info.tsx           # Info tab
│   │   └── settings.tsx       # Settings tab
│   └── _layout.tsx            # Root layout
├── screens/
│   ├── RoutinesScreen.js      # Main routines list
│   ├── RoutineDetailScreen.js # Edit routine with moves
│   ├── InfoScreen.js          # App information
│   └── SettingsScreen.js      # Settings
├── data/
│   └── dance_info.js          # All dance data
└── babel.config.js            # Babel config with reanimated plugin
```

## Features Working

- ✅ Create, edit, and delete routines
- ✅ Add moves to routines
- ✅ Drag and drop to reorder moves
- ✅ View move details (technique, timing, description)
- ✅ Add personal notes to moves
- ✅ Persistent storage with AsyncStorage
- ✅ 20+ dance styles supported
- ✅ Beautiful purple theme (#6200EE)

## Troubleshooting

### Clear Cache

If you encounter any issues:

```bash
npm start -- --clear
```

### Reset Metro Bundler

```bash
npm start -- --reset-cache
```

### Reinstall Dependencies

```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

## Notes

- Node version warnings are expected but won't affect functionality
- The app uses `--legacy-peer-deps` to avoid peer dependency conflicts
- All original functionality has been preserved
- Data from DanceApp will need to be recreated (AsyncStorage is local)

## Next Steps

1. Run `npm start`
2. Choose your platform (Android/iOS/Web)
3. Start creating routines!

Your dance app is ready to use without the dependency issues! 🎉
