# PDF Export Feature

## Overview

The PDF export feature allows you to preview, save, and share your dance routines as beautifully formatted PDF documents directly from your phone or computer.

## How to Use

1. **Open any routine** in the Edit Routine screen
2. **Look at the top of the screen** - you'll see a new PDF icon button (📄) next to the refresh button
3. **Tap the PDF button** to generate a preview of your routine
4. **Preview** - The native print dialog will open showing you a preview of your PDF
5. **Save or Share** - From the preview, you can:
   - Save as PDF to Files (iOS) or Downloads (Android)
   - Share via email, message, or other apps
   - Print the PDF directly
   - Cancel if you want to make changes first

## What's Included in the PDF

The PDF includes:

✅ **Routine Name** - Large, prominent title at the top
✅ **Description** - If your routine has a description
✅ **Dance Style** - Properly formatted (e.g., "Paso Doble")
✅ **Move List** - A formatted table with:

- **Move Number** - Sequential numbering
- **Move Name** - With emoji level badges (🥉 Bronze, 🥈 Silver, 🥇 Gold)
 - **Move Name** - Shows move name (level text like Bronze/Silver/Gold is available but not shown as an emoji)
- **Custom Notes** - Your personal notes for each move (displayed in a styled box with 📝 icon)
- **Counts** - Number of counts for each move
- **Start** - Man's starting facing direction
- **End** - Man's ending facing direction

✅ **Step Details** - If you have steps in your routine, it shows the individual moves within each step
✅ **Ending Moves** - Shows ending moves if a move has them

## PDF Styling

The PDF is professionally styled with:

- Purple header (#6200EE) matching your app theme
- **Level display:**
  - Bronze / Silver / Gold level text is available for each move, but the exported PDF no longer uses emoji badges.
- **Custom notes** displayed in styled gray boxes with 📝 icon
- Alternating row colors for easy reading
- Clean, modern typography with no shadows or outlines
- **Multi-page support:**
  - 1 inch margins on all sides (top, bottom, left, right)
  - Single continuous table that spans multiple pages naturally
  - Table headers automatically repeat on each new page
  - Rows never split across pages
  - Page breaks are based on actual content height (moves with notes take more space)
  - Each page maintains proper margins and spacing
- Responsive layout that works on all devices

## File Naming

PDFs are automatically named: `[RoutineName]_Routine.pdf`

For example:

- "My Waltz Routine" → `My_Waltz_Routine_Routine.pdf`

## Technical Details

**Dependencies Installed:**

- `expo-print` - Generates PDF from HTML
- `expo-sharing` - Enables sharing functionality
- `expo-file-system` - File management

**Works On:**

- ✅ iOS (iPhone/iPad)
- ✅ Android
- ✅ Web (when running on web)

## Troubleshooting

### PDF won't generate

- Make sure you have moves in your routine
- Check that you have storage permissions

### Can't share/save PDF

- Grant file storage permissions to the app
- Check available storage space

### PDF looks wrong

- Make sure all moves have proper data (counts, facing directions)
- Try regenerating the PDF

## Example Output

The PDF will look something like this:

```
╔════════════════════════════════════════════╗
║         My Waltz Competition              ║
║         American Smooth                    ║
╚════════════════════════════════════════════╝

┌────┬──────────────────────────────────┬────────┬──────┬─────┐
│ #  │ Move Name                        │ Counts │ Start│ End │
├────┼──────────────────────────────────┼────────┼──────┼─────┤
│ 1  │ Natural Turn                    │   6    │ Wall │ DW  │
│    │ 📝 Watch footwork on step 3      │        │      │     │
│ 2  │ Reverse Turn                    │   6    │ DW   │ LOD │
│ 3  │ Hesitation                      │   3    │ LOD  │ LOD │
│    │ 📝 Hold for dramatic effect      │        │      │     │
└────┴──────────────────────────────────┴────────┴──────┴─────┘

Note: The PDF no longer marks moves with emoji badges. Level information is still available in the app data.
```

## Future Enhancements

Potential future features:

- [ ] Custom PDF templates
- [ ] Include technique notes
- [ ] Add diagrams/footwork patterns
- [ ] Export multiple routines at once
- [ ] Email PDF directly from app

---

**Enjoy your professionally formatted routine PDFs! Perfect for practice, teaching, or sharing with your dance partner!** 💃🕺
