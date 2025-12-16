import AsyncStorage from "@react-native-async-storage/async-storage"

// Categories for moves
export const MOVE_CATEGORIES = {
  DONT_KNOW: "dont_know",
  FAMILIAR: "familiar",
  KNOW: "know",
}

// Colors for each category
export const CATEGORY_COLORS = {
  [MOVE_CATEGORIES.DONT_KNOW]: "#ffcccc", // light red
  [MOVE_CATEGORIES.FAMILIAR]: "#fff9cc", // light yellow
  [MOVE_CATEGORIES.KNOW]: "#ccffcc", // light green
  [MOVE_CATEGORIES.SKIP]: "#ccccff", // light purple
}

const STORAGE_KEY = "@move_categories"

/**
 * Generate a unique key for a move
 * @param {string} danceStyle - e.g., "international_waltz"
 * @param {string} level - e.g., "bronze"
 * @param {string} moveName - e.g., "Natural Turn"
 * @returns {string} - unique key for the move
 */
export const getMoveKey = (danceStyle, level, moveName) => {
  return `${danceStyle}:${level}:${moveName}`
}

/**
 * Get all move categories from storage
 * @returns {Promise<Object>} - Object with move keys as keys and categories as values
 */
export const getAllMoveCategories = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY)
    return jsonValue != null ? JSON.parse(jsonValue) : {}
  } catch (e) {
    console.error("Error reading move categories:", e)
    return {}
  }
}

/**
 * Get the category of a specific move
 * @param {string} danceStyle
 * @param {string} level
 * @param {string} moveName
 * @returns {Promise<string|null>} - Category or null if not categorized
 */
export const getMoveCategory = async (danceStyle, level, moveName) => {
  try {
    const categories = await getAllMoveCategories()
    const key = getMoveKey(danceStyle, level, moveName)
    return categories[key] || null
  } catch (e) {
    console.error("Error reading move category:", e)
    return null
  }
}

/**
 * Set the category of a specific move
 * @param {string} danceStyle
 * @param {string} level
 * @param {string} moveName
 * @param {string} category - One of MOVE_CATEGORIES values
 * @returns {Promise<boolean>} - Success status
 */
export const setMoveCategory = async (
  danceStyle,
  level,
  moveName,
  category
) => {
  try {
    const categories = await getAllMoveCategories()
    const key = getMoveKey(danceStyle, level, moveName)
    categories[key] = category
    const jsonValue = JSON.stringify(categories)
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue)
    return true
  } catch (e) {
    console.error("Error saving move category:", e)
    return false
  }
}

/**
 * Remove the category of a specific move
 * @param {string} danceStyle
 * @param {string} level
 * @param {string} moveName
 * @returns {Promise<boolean>} - Success status
 */
export const removeMoveCategory = async (danceStyle, level, moveName) => {
  try {
    const categories = await getAllMoveCategories()
    const key = getMoveKey(danceStyle, level, moveName)
    delete categories[key]
    const jsonValue = JSON.stringify(categories)
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue)
    return true
  } catch (e) {
    console.error("Error removing move category:", e)
    return false
  }
}

/**
 * Get the background color for a move based on its category
 * @param {string} danceStyle
 * @param {string} level
 * @param {string} moveName
 * @returns {Promise<string>} - Background color (hex)
 */
export const getMoveCategoryColor = async (danceStyle, level, moveName) => {
  try {
    const category = await getMoveCategory(danceStyle, level, moveName)
    return category ? CATEGORY_COLORS[category] : "transparent"
  } catch (e) {
    console.error("Error getting move category color:", e)
    return "transparent"
  }
}

/**
 * Get statistics about categorized moves
 * @returns {Promise<Object>} - Object with counts for each category
 */
export const getCategoryStats = async () => {
  try {
    const categories = await getAllMoveCategories()
    const stats = {
      [MOVE_CATEGORIES.DONT_KNOW]: 0,
      [MOVE_CATEGORIES.FAMILIAR]: 0,
      [MOVE_CATEGORIES.KNOW]: 0,
      total: 0,
    }

    Object.values(categories).forEach((category) => {
      if (stats[category] !== undefined) {
        stats[category]++
        stats.total++
      }
    })

    return stats
  } catch (e) {
    console.error("Error getting category stats:", e)
    return {
      [MOVE_CATEGORIES.DONT_KNOW]: 0,
      [MOVE_CATEGORIES.FAMILIAR]: 0,
      [MOVE_CATEGORIES.KNOW]: 0,
      total: 0,
    }
  }
}

/**
 * Clear all move categories (for debugging/reset purposes)
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllCategories = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
    return true
  } catch (e) {
    console.error("Error clearing move categories:", e)
    return false
  }
}
