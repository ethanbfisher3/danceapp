# DanceApp

A React Native application for managing dance routines, built with Expo Router.

## Features

- **Create Custom Dance Routines**: Build and organize your dance routines
- **20+ Dance Styles**: Support for Waltz, Tango, Foxtrot, Salsa, Cha Cha, and more
- **Move Management**: Add, reorder, and organize dance moves within routines
- **Detailed Move Information**: View technique, timing, and descriptions for each move
- **Personal Notes**: Add custom notes to each move in your routines
- **Drag & Drop**: Reorder moves easily with drag-and-drop functionality
- **Persistent Storage**: All data saved locally using AsyncStorage

## Supported Dance Styles

- Waltz
- Tango
- Foxtrot
- Viennese Waltz
- Cha Cha
- Rumba
- East Coast Swing
- Bolero
- Mambo
- Quickstep
- Paso Doble
- Jive
- Argentine Tango
- Salsa
- Bachata
- Merengue
- Country Swing
- Hustle
- Texas Two-Step
- Lindy Hop

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Run on your preferred platform:

```bash
npm run android  # For Android
npm run ios      # For iOS
npm run web      # For Web
```

## Project Structure

```
Routines/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Routines tab (with stack navigation)
│   │   ├── info.tsx       # Info tab
│   │   └── settings.tsx   # Settings tab
│   └── _layout.tsx        # Root layout
├── screens/               # Screen components
│   ├── RoutinesScreen.js
│   ├── RoutineDetailScreen.js
│   ├── InfoScreen.js
│   └── SettingsScreen.js
├── data/                  # Data and constants
│   └── dance_info.js      # Dance styles, moves, and details
├── components/            # Reusable components
├── constants/             # App constants
└── assets/               # Images and other assets
```

## Key Technologies

- **Expo SDK 54**: Latest Expo framework
- **Expo Router**: File-based routing
- **React Native**: Cross-platform mobile development
- **React Navigation**: Navigation library (Stack Navigator)
- **AsyncStorage**: Local data persistence
- **React Native Draggable FlatList**: Drag-and-drop functionality
- **React Native Reanimated**: Smooth animations
- **React Native Gesture Handler**: Touch gesture handling

## Usage

### Creating a Routine

1. Navigate to the **Routines** tab
2. Tap the **+** button
3. Enter a routine name
4. Select a dance style
5. Tap **Create**

### Adding Moves to a Routine

1. Tap on a routine from the list
2. Tap the **+** button
3. Select a move from the dropdown
4. Tap **Add**

### Reordering Moves

1. Open a routine
2. Long press on a move
3. Drag it to the desired position
4. Release to drop

### Viewing Move Details

1. Open a routine
2. Tap on any move
3. View technique, timing, and description
4. Add personal notes in the text field
5. Tap **Save Notes**

## Configuration

The app is configured with:

- Purple theme (#6200EE)
- Light mode UI
- Hermes JavaScript engine
- Edge-to-edge display on Android

## Troubleshooting

If you encounter dependency issues:

1. Clear the cache:

```bash
npm start -- --clear
```

2. Reinstall dependencies:

```bash
rm -rf node_modules
npm install
```

3. Reset the project:

```bash
npm run reset-project
```

## License

This project is for personal use.
