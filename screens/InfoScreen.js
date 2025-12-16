import { useEffect, useState } from "react"
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native"
import { DANCE_MOVES, DANCE_STYLE_CATEGORIES } from "../data/dance_info"
import { getFilteredStyle, loadDeletedMoves } from "../utils/deletedMoves"

const InfoScreen = () => {
  const formatDanceName = (danceName) => {
    return danceName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const [deletedMap, setDeletedMap] = useState({})

  useEffect(() => {
    const load = async () => {
      const map = await loadDeletedMoves()
      setDeletedMap(map)
    }
    load()
  }, [])

  // Check if all moves in a level have counts
  const allMovesHaveCounts = (moves) => {
    if (!Array.isArray(moves) || moves.length === 0) return false
    return moves.every((move) => move && typeof move.counts === "number")
  }

  // Get level status for a dance style
  const getLevelStatus = (danceStyle) => {
    const styleKey = danceStyle.toLowerCase().replace(/\s+/g, "_")
    const styleData = getFilteredStyle(styleKey, DANCE_MOVES, deletedMap)

    if (!styleData || typeof styleData !== "object") {
      return { bronze: false, silver: false, gold: false }
    }

    return {
      bronze: allMovesHaveCounts(styleData.bronze),
      silver: allMovesHaveCounts(styleData.silver),
      gold: allMovesHaveCounts(styleData.gold),
    }
  }

  // Get counts for bronze/silver/gold moves for a style
  const getLevelCounts = (danceStyle) => {
    const styleKey = danceStyle.toLowerCase().replace(/\s+/g, "_")
    const styleData = getFilteredStyle(styleKey, DANCE_MOVES, deletedMap)
    return {
      bronze:
        styleData && Array.isArray(styleData.bronze)
          ? styleData.bronze.length
          : 0,
      silver:
        styleData && Array.isArray(styleData.silver)
          ? styleData.silver.length
          : 0,
      gold:
        styleData && Array.isArray(styleData.gold) ? styleData.gold.length : 0,
    }
  }

  const getStyleColor = (danceStyle) => {
    const status = getLevelStatus(danceStyle)
    return status.bronze && status.silver && status.gold ? "#4CAF50" : "#f44336"
  }

  const getLevelColor = (danceStyle, level) => {
    const status = getLevelStatus(danceStyle)
    return status[level] ? "#4CAF50" : "#f44336"
  }

  const renderStyleBlock = (styleName) => {
    const counts = getLevelCounts(styleName)
    return (
      <View key={styleName} style={styles.danceStyleBlock}>
        <Text style={[styles.danceStyle, { color: getStyleColor(styleName) }]}>
          • {formatDanceName(styleName)}
        </Text>
        <View style={{ paddingLeft: 20, paddingBottom: 5 }}>
          <Text style={{ color: getLevelColor(styleName, "bronze") }}>
            • Bronze: {counts.bronze} moves
          </Text>
          <Text style={{ color: getLevelColor(styleName, "silver") }}>
            • Silver: {counts.silver} moves
          </Text>
          <Text style={{ color: getLevelColor(styleName, "gold") }}>
            • Gold: {counts.gold} moves
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>About DanceApp</Text>
        <Text style={styles.description}>
          Welcome to DanceApp! This application helps you organize and manage
          your dance routines.
        </Text>

        <Text style={styles.sectionTitle}>Features:</Text>
        <Text style={styles.feature}>• Create custom dance routines</Text>
        <Text style={styles.feature}>
          • Choose from multiple dance styles across 4 ballroom categories
        </Text>
        <Text style={styles.feature}>• Organize your practice sessions</Text>
        <Text style={styles.feature}>• Track your dance journey</Text>

        <Text style={styles.mainSectionTitle}>Supported Dance Styles:</Text>

        {Object.entries(DANCE_STYLE_CATEGORIES).map(([category, styleList]) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {styleList.map((styleName) => renderStyleBlock(styleName))}
          </View>
        ))}

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>
              All moves have counts specified
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#f44336" }]} />
            <Text style={styles.legendText}>Missing counts for some moves</Text>
          </View>
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
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 24,
    textAlign: "center",
  },
  mainSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#6200EE",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  feature: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
    paddingLeft: 10,
  },
  danceStyle: {
    fontSize: 15,
    marginBottom: 6,
    paddingLeft: 10,
    fontWeight: "500",
  },
  danceStyleBlock: {
    marginBottom: 8,
  },
  legendContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
})

export default InfoScreen
