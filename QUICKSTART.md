# Quick Start Guide

## Your DanceApp is Ready! 🎉

All functionality has been successfully transferred from DanceApp to Routines without the dependency issues.

## Start the App

Open a terminal in the Routines folder and run:

```bash
npm start
```

Then choose your platform:

- Press `a` for Android
- Press `i` for iOS
- Press `w` for Web

## First Time Setup

### If you encounter any issues:

1. **Clear the cache:**

   ```bash
   npm start -- --clear
   ```

2. **Reset everything:**
   ```bash
   npm start -- --reset-cache
   ```

## Using the App

### Create Your First Routine

1. Open the app
2. You'll see the **Routines** tab (empty at first)
3. Tap the purple **+** button in the bottom right
4. Enter a name (e.g., "Waltz Practice")
5. Select a dance style from the dropdown
6. Tap **Create**

### Add Moves to Your Routine

1. Tap on your newly created routine
2. Tap the purple **+** button
3. Select a move from the dropdown
4. Tap **Add**
5. Repeat to add more moves

### Reorder Moves

1. **Long press** on any move
2. **Drag** it to the desired position
3. **Release** to drop

### View Move Details

1. **Tap** on any move
2. View technique, timing, and description
3. Add your own notes in the text field
4. Tap **Save Notes**

### Edit or Delete Routines

1. On the Routines screen, each routine has two buttons:
   - **Pencil icon** - Edit name/style
   - **X icon** - Delete routine

## Available Dance Styles

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
- Paso Doble (with Bronze, Silver, Gold levels)
- Jive
- Argentine Tango
- Salsa
- Bachata
- Merengue
- Country Swing
- Hustle
- Texas Two-Step
- Lindy Hop

## Tips

- Your data is saved automatically using AsyncStorage
- Drag and drop works best with a long press (not just a tap)
- Each routine can have unlimited moves
- You can add personal notes to remember tips or corrections
- The Info tab has more details about the app
- The Settings tab shows app information

## Troubleshooting

### App won't start?

```bash
npm install --legacy-peer-deps
npm start -- --clear
```

### Seeing warnings?

- Node version warnings are normal and won't affect functionality
- The app works fine with Node 20.15.0

### Need to reinstall?

```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

## What's Different from DanceApp?

✅ **No more dependency issues!**
✅ Modern Expo Router architecture
✅ Same features and functionality
✅ Same beautiful purple theme
✅ Better organized code structure

## Need Help?

Check these files:

- `README.md` - Full documentation
- `SETUP.md` - Detailed setup instructions
- `MIGRATION_SUMMARY.md` - What was changed

---

**You're all set! Start creating your dance routines! 💃🕺**
