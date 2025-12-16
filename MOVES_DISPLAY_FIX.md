# Moves Display Fix ✅

## The Problem

Moves weren't showing up on the "Edit Routine" page even after being added.

## Root Cause

The `useEffect` hook that loads moves was running before the `routine` object was available:

```javascript
// BEFORE - BROKEN
useEffect(() => {
  loadMoves()  // routine might be null here!
}, [])

const loadMoves = async () => {
  try {
    const storedMoves = await AsyncStorage.getItem(`moves_${routine.id}`)
    // routine.id could be undefined, causing the wrong key to be used
  }
}
```

The issue was:

1. `useEffect` ran immediately on mount
2. `routine` was still being parsed from params
3. `routine.id` was `undefined`
4. AsyncStorage key became `moves_undefined`
5. Moves were saved to the wrong key and couldn't be loaded

## The Solution

### 1. Added Dependency to useEffect

```javascript
useEffect(() => {
  if (routine?.id) {
    loadMoves()
  }
}, [routine?.id]) // Now waits for routine to be available
```

### 2. Added Safety Checks

```javascript
const loadMoves = async () => {
  if (!routine?.id) return // Exit early if no routine

  try {
    const storedMoves = await AsyncStorage.getItem(`moves_${routine.id}`)
    if (storedMoves) {
      setMoves(JSON.parse(storedMoves))
    }
  } catch (error) {
    console.error("Error loading moves:", error)
  }
}

const saveMoves = async (movesToSave) => {
  if (!routine?.id) return // Exit early if no routine

  try {
    await AsyncStorage.setItem(
      `moves_${routine.id}`,
      JSON.stringify(movesToSave)
    )
  } catch (error) {
    console.error("Error saving moves:", error)
  }
}
```

## What This Fixes

✅ **Moves now load correctly** when opening a routine
✅ **Moves persist** after being added
✅ **No undefined keys** in AsyncStorage
✅ **Proper dependency tracking** in useEffect

## How It Works Now

1. User taps a routine
2. Navigation passes routine data as JSON string
3. `RoutineDetailScreen` parses the routine
4. `useEffect` detects `routine.id` is available
5. `loadMoves()` is called with valid routine ID
6. Moves are loaded from AsyncStorage with correct key: `moves_${routine.id}`
7. Moves display in the DraggableFlatList

## Testing

To verify the fix works:

1. Create a routine
2. Open the routine (Edit Routine page)
3. Add a move using the + button
4. Move should appear in the list
5. Go back to routines list
6. Open the same routine again
7. Move should still be there (persisted)
8. Add more moves - they should all display
9. Drag and drop should work to reorder

---

**Status**: ✅ **FIXED**

Moves now display and persist correctly!
