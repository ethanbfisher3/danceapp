const getDocumentDirectory = () => {
  const { documentDirectory } = require("expo-file-system/legacy")
  return documentDirectory
}

export const deletedMovesFile = `${getDocumentDirectory()}deleted_moves.json`

export const makeMoveKey = (danceStyle, level, name) =>
  `${danceStyle}||${level}||${name}`

export const isDeleted = (danceStyle, level, name, deletedMap) => {
  if (!danceStyle || !level || !name) return false
  return !!deletedMap[makeMoveKey(danceStyle, level, name)]
}

export const loadDeletedMoves = async () => {
  try {
    const {
      getInfoAsync,
      readAsStringAsync,
    } = require("expo-file-system/legacy")
    const fileInfo = await getInfoAsync(deletedMovesFile)
    if (!fileInfo.exists) {
      return {}
    }
    const contents = await readAsStringAsync(deletedMovesFile)
    const parsed = JSON.parse(contents || "{}")
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch (e) {
    // File doesn't exist or other error - return empty object
    return {}
  }
}

export const saveDeletedMoves = async (deletedMap) => {
  try {
    const { writeAsStringAsync } = require("expo-file-system/legacy")
    const content = JSON.stringify(deletedMap || {}, null, 2)
    await writeAsStringAsync(deletedMovesFile, content)
  } catch (e) {
    console.log("Failed to save deleted moves:", e)
  }
}

export const getFilteredStyle = (styleKey, danceMoves, deletedMap) => {
  const levels = danceMoves[styleKey]
  if (!levels || typeof levels !== "object") return null
  const filterLevel = (levelName) => {
    const arr = levels[levelName]
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (move) =>
        move &&
        move.name &&
        !isDeleted(styleKey, levelName, move.name, deletedMap)
    )
  }
  return {
    bronze: filterLevel("bronze"),
    silver: filterLevel("silver"),
    gold: filterLevel("gold"),
    other: filterLevel("other"),
  }
}
