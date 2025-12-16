import React, { useEffect, useState } from "react"
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native"
import { getSetting, updateSetting } from "../utils/settings"

const SettingsScreen = () => {
  const [showMoveLevelBadges, setShowMoveLevelBadges] = useState(true)
  const [useMoveRotation, setUseMoveRotation] = useState(true)
  const [showMoveCounts, setShowMoveCounts] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const levelBadgesSetting = await getSetting("showMoveLevelBadges")
    const rotationSetting = await getSetting("useMoveRotation")
    const countsSetting = await getSetting("showMoveCounts")
    setShowMoveLevelBadges(levelBadgesSetting)
    setUseMoveRotation(rotationSetting)
    setShowMoveCounts(countsSetting)
  }

  const handleToggleLevelBadges = async (value) => {
    setShowMoveLevelBadges(value)
    await updateSetting("showMoveLevelBadges", value)
  }

  const handleToggleMoveRotation = async (value) => {
    setUseMoveRotation(value)
    await updateSetting("useMoveRotation", value)
  }

  const handleToggleMoveCounts = async (value) => {
    setShowMoveCounts(value)
    await updateSetting("showMoveCounts", value)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.description}>
          Manage your dance app preferences and settings.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Preferences</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                Display Move Difficulty Level
              </Text>
              <Text style={styles.settingDescription}>
                Show Bronze, Silver, Gold badges on move lists
              </Text>
            </View>
            <Switch
              value={showMoveLevelBadges}
              onValueChange={handleToggleLevelBadges}
              trackColor={{ false: "#d1d1d1", true: "#b794f6" }}
              thumbColor={showMoveLevelBadges ? "#6200EE" : "#f4f3f4"}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Display Move Counts</Text>
              <Text style={styles.settingDescription}>
                Show count numbers on moves in routines and steps
              </Text>
            </View>
            <Switch
              value={showMoveCounts}
              onValueChange={handleToggleMoveCounts}
              trackColor={{ false: "#d1d1d1", true: "#b794f6" }}
              thumbColor={showMoveCounts ? "#6200EE" : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Move Direction</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {useMoveRotation
                  ? "Use Move Rotation"
                  : "Use 'Man Facing' Selection"}
              </Text>
              <Text style={styles.settingDescription}>
                {useMoveRotation
                  ? "Use rotation degrees (e.g., 1/4 turn left, 1/2 turn right)"
                  : "Use facing directions (e.g., Line of Dance, Wall, Center)"}
              </Text>
            </View>
            <Switch
              value={useMoveRotation}
              onValueChange={handleToggleMoveRotation}
              trackColor={{ false: "#d1d1d1", true: "#b794f6" }}
              thumbColor={useMoveRotation ? "#6200EE" : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build:</Text>
            <Text style={styles.infoValue}>Production</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            DanceApp helps you organize and manage your dance routines with
            ease. Create custom routines, add moves, and track your progress as
            you improve your dancing skills.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Text style={styles.aboutText}>
            For questions or feedback, please visit the Info tab to learn more
            about the app's features and capabilities.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 24,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  aboutText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
  },
})

export default SettingsScreen
