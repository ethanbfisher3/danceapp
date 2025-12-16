import AsyncStorage from "@react-native-async-storage/async-storage"

const SETTINGS_KEY = "@app_settings"

// Default settings
const DEFAULT_SETTINGS = {
  showMoveLevelBadges: true,
  useMoveRotation: true, // true = use rotation, false = use man facing selection
  showMoveCounts: true, // true = show counts on moves
}

/**
 * Get all settings from storage
 * @returns {Promise<Object>} - Settings object
 */
export const getSettings = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY)
    const settings =
      jsonValue != null ? JSON.parse(jsonValue) : DEFAULT_SETTINGS
    // Merge with defaults to ensure new settings are present
    return { ...DEFAULT_SETTINGS, ...settings }
  } catch (e) {
    console.error("Error reading settings:", e)
    return DEFAULT_SETTINGS
  }
}

/**
 * Get a specific setting
 * @param {string} key - Setting key
 * @returns {Promise<any>} - Setting value
 */
export const getSetting = async (key) => {
  try {
    const settings = await getSettings()
    return settings[key] ?? DEFAULT_SETTINGS[key]
  } catch (e) {
    console.error("Error reading setting:", e)
    return DEFAULT_SETTINGS[key]
  }
}

/**
 * Update a specific setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<boolean>} - Success status
 */
export const updateSetting = async (key, value) => {
  try {
    const settings = await getSettings()
    settings[key] = value
    const jsonValue = JSON.stringify(settings)
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue)
    return true
  } catch (e) {
    console.error("Error updating setting:", e)
    return false
  }
}

/**
 * Update multiple settings at once
 * @param {Object} updates - Object with setting keys and values
 * @returns {Promise<boolean>} - Success status
 */
export const updateSettings = async (updates) => {
  try {
    const settings = await getSettings()
    const updatedSettings = { ...settings, ...updates }
    const jsonValue = JSON.stringify(updatedSettings)
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue)
    return true
  } catch (e) {
    console.error("Error updating settings:", e)
    return false
  }
}

/**
 * Reset all settings to defaults
 * @returns {Promise<boolean>} - Success status
 */
export const resetSettings = async () => {
  try {
    const jsonValue = JSON.stringify(DEFAULT_SETTINGS)
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue)
    return true
  } catch (e) {
    console.error("Error resetting settings:", e)
    return false
  }
}
