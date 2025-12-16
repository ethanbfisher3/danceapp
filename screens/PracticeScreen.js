import { MaterialIcons } from "@expo/vector-icons"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import VideoPlayerModal from "../components/video-player-modal"
import { DANCE_MOVES, DANCE_STYLE_CATEGORIES } from "../data/dance_info"
import {
  CATEGORY_COLORS,
  MOVE_CATEGORIES,
  setMoveCategory,
} from "../utils/moveCategories"

const PracticeScreen = () => {
  const [currentMove, setCurrentMove] = useState(null)
  const [loading, setLoading] = useState(true)
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [practiceStats, setPracticeStats] = useState({
    total: 0,
    session: 0,
  })
  const [selectedDanceStyle, setSelectedDanceStyle] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDanceStyleDropdown, setShowDanceStyleDropdown] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)

  // Favorite moves persistence
  const [favoriteMoves, setFavoriteMoves] = useState({})
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const badgeAnim = useRef(new Animated.Value(0)).current
  const [showNewBadge, setShowNewBadge] = useState(false)

  // Get all moves with videos
  const allMovesWithVideos = useMemo(() => {
    const moves = []
    Object.entries(DANCE_MOVES).forEach(([danceStyle, levels]) => {
      if (levels && typeof levels === "object") {
        Object.entries(levels).forEach(([level, movesArray]) => {
          if (Array.isArray(movesArray)) {
            movesArray.forEach((move) => {
              if (
                move &&
                move.name &&
                move.video &&
                move.start !== undefined &&
                move.end !== undefined
              ) {
                moves.push({
                  ...move,
                  danceStyle,
                  level,
                })
              }
            })
          }
        })
      }
    })
    return moves
  }, [])

  // Filter moves based on selected filters and search query
  const movesWithVideos = useMemo(() => {
    let filtered = [...allMovesWithVideos]

    // Filter by dance style
    if (selectedDanceStyle !== "all") {
      const selectedStyleKey = selectedDanceStyle
        .toLowerCase()
        .replace(/\s+/g, "_")
      filtered = filtered.filter((move) => move.danceStyle === selectedStyleKey)
    }

    // Filter by level
    if (selectedLevel !== "all") {
      filtered = filtered.filter((move) => move.level === selectedLevel)
    }

    // Filter by search query
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery.length > 0) {
      const query = trimmedQuery.toLowerCase()
      filtered = filtered.filter((move) => {
        const moveName = move.name || ""
        return moveName.toLowerCase().includes(query)
      })
    }

    // Filter by favorites if showOnlyFavorites is enabled
    if (showOnlyFavorites) {
      filtered = filtered.filter((move) => isMoveFavorite(move))
    }

    return filtered
  }, [
    allMovesWithVideos,
    selectedDanceStyle,
    selectedLevel,
    searchQuery,
    showOnlyFavorites,
    favoriteMoves,
  ])

  const getRandomMove = () => {
    if (movesWithVideos.length === 0) {
      return null
    }
    const randomIndex = Math.floor(Math.random() * movesWithVideos.length)
    return movesWithVideos[randomIndex]
  }

  const loadNextMove = () => {
    setLoading(true)

    // Fade out and scale down
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change the move
      const move = getRandomMove()
      setCurrentMove(move)
      setLoading(false)

      // Show "New Move!" badge
      setShowNewBadge(true)

      // Fade in and scale back up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(badgeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(badgeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowNewBadge(false)
      })
    })
  }

  useEffect(() => {
    // Initial load without animation
    const move = getRandomMove()
    setCurrentMove(move)
    setLoading(false)

    // Load favorite moves
    loadFavoriteMoves()
  }, [])

  // Reload move when filters change
  useEffect(() => {
    if (!loading && currentMove) {
      // Check if current move still matches filters
      const matchesFilters = movesWithVideos.some(
        (m) =>
          m.name === currentMove.name &&
          m.danceStyle === currentMove.danceStyle &&
          m.level === currentMove.level
      )
      if (!matchesFilters) {
        loadNextMove()
      }
    }
  }, [selectedDanceStyle, selectedLevel, searchQuery])

  const formatDanceName = (danceStyle) => {
    return danceStyle
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatLevel = (level) => {
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  const getDocumentDirectory = () => {
    const { documentDirectory } = require("expo-file-system/legacy")
    return documentDirectory
  }
  const favoriteMovesFile = `${getDocumentDirectory()}favorite_moves.json`
  const makeMoveKey = (danceStyle, level, name) =>
    `${danceStyle}||${level}||${name}`
  const isMoveFavorite = (move) =>
    !!favoriteMoves[makeMoveKey(move.danceStyle, move.level, move.name)]
  const loadFavoriteMoves = async () => {
    try {
      const {
        getInfoAsync,
        readAsStringAsync,
      } = require("expo-file-system/legacy")
      const fileInfo = await getInfoAsync(favoriteMovesFile)
      if (!fileInfo.exists) {
        setFavoriteMoves({})
        return
      }
      const contents = await readAsStringAsync(favoriteMovesFile)
      const parsed = JSON.parse(contents || "{}")
      setFavoriteMoves(parsed && typeof parsed === "object" ? parsed : {})
    } catch (e) {
      // File doesn't exist or other error - use empty object
      setFavoriteMoves({})
    }
  }

  const getDanceStyleSections = () => {
    return Object.entries(DANCE_STYLE_CATEGORIES).map(([category, styles]) => ({
      title: category,
      data: styles,
    }))
  }

  const handleCategorySelection = async (category) => {
    if (!currentMove) return

    // Save the category
    await setMoveCategory(
      currentMove.danceStyle,
      currentMove.level,
      currentMove.name,
      category
    )

    // Update stats
    setPracticeStats((prev) => ({
      total: prev.total + 1,
      session: prev.session + 1,
    }))

    // Close video modal if open
    setVideoModalVisible(false)

    // Load next move after a brief delay
    setTimeout(() => {
      loadNextMove()
    }, 200)
  }

  const handleVideoPress = () => {
    setVideoModalVisible(true)
  }

  const getCategoryLabel = (category) => {
    switch (category) {
      case MOVE_CATEGORIES.DONT_KNOW:
        return "Don't Know"
      case MOVE_CATEGORIES.FAMILIAR:
        return "Familiar With"
      case MOVE_CATEGORIES.KNOW:
        return "Know"
      default:
        return ""
    }
  }

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "bronze":
        return "#CD7F32" // Bronze color
      case "silver":
        return "#C0C0C0" // Silver color
      case "gold":
        return "#FFD700" // Gold color
      default:
        return "#6200EE" // Default purple
    }
  }

  const getLevelTextColor = (level) => {
    switch (level?.toLowerCase()) {
      case "bronze":
        return "#fff"
      case "silver":
        return "#333"
      case "gold":
        return "#333"
      default:
        return "#fff"
    }
  }

  if (loading || !currentMove) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Filter Container */}
          <View style={styles.filterContainer}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search moves..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== "" && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <MaterialIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Row */}
            <View style={styles.filterRow}>
              {/* Dance Style Dropdown */}
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Dance Style</Text>
                <TouchableOpacity
                  style={styles.filterDropdown}
                  onPress={() => {
                    setShowDanceStyleDropdown(!showDanceStyleDropdown)
                    setShowLevelDropdown(false)
                  }}
                >
                  <Text style={styles.filterDropdownText}>
                    {selectedDanceStyle === "all"
                      ? "All Styles"
                      : formatDanceName(selectedDanceStyle)}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              {/* Level Dropdown */}
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Level</Text>
                <TouchableOpacity
                  style={styles.filterDropdown}
                  onPress={() => {
                    setShowLevelDropdown(!showLevelDropdown)
                    setShowDanceStyleDropdown(false)
                  }}
                >
                  <Text style={styles.filterDropdownText}>
                    {selectedLevel === "all"
                      ? "All Levels"
                      : formatLevel(selectedLevel)}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Dance Style Dropdown Menu */}
            {showDanceStyleDropdown && (
              <ScrollView
                style={styles.dropdownMenu}
                nestedScrollEnabled={true}
              >
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedDanceStyle("all")
                    setShowDanceStyleDropdown(false)
                    loadNextMove()
                  }}
                >
                  <Text style={styles.dropdownItemText}>All Styles</Text>
                  {selectedDanceStyle === "all" && (
                    <MaterialIcons name="check" size={20} color="#6200EE" />
                  )}
                </TouchableOpacity>
                {getDanceStyleSections().map((section) => (
                  <View key={section.title}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionHeaderText}>
                        {section.title}
                      </Text>
                    </View>
                    {section.data.map((item, index) => (
                      <TouchableOpacity
                        key={item + index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedDanceStyle(item)
                          setShowDanceStyleDropdown(false)
                          loadNextMove()
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {formatDanceName(item)}
                        </Text>
                        {selectedDanceStyle === item && (
                          <MaterialIcons
                            name="check"
                            size={20}
                            color="#6200EE"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Level Dropdown Menu */}
            {showLevelDropdown && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedLevel("all")
                    setShowLevelDropdown(false)
                    loadNextMove()
                  }}
                >
                  <Text style={styles.dropdownItemText}>All Levels</Text>
                  {selectedLevel === "all" && (
                    <MaterialIcons name="check" size={20} color="#6200EE" />
                  )}
                </TouchableOpacity>
                {["bronze", "silver", "gold", "other"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedLevel(level)
                      setShowLevelDropdown(false)
                      loadNextMove()
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {formatLevel(level)}
                    </Text>
                    {selectedLevel === level && (
                      <MaterialIcons name="check" size={20} color="#6200EE" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Checkbox Row */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
              >
                <MaterialIcons
                  name={
                    showOnlyFavorites ? "check-box" : "check-box-outline-blank"
                  }
                  size={20}
                  color="#FFD700"
                />
                <Text style={styles.checkboxLabel}>Show only favorites</Text>
              </TouchableOpacity>
            </View>

            {/* Results Count */}
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsText}>
                {movesWithVideos.length} move
                {movesWithVideos.length !== 1 ? "s" : ""} available
              </Text>
            </View>
          </View>

          <View style={styles.loadingContainer}>
            {movesWithVideos.length === 0 ? (
              <>
                <MaterialIcons name="search-off" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>No moves found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your filters or search query
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="#6200EE" />
                <Text style={styles.loadingText}>Loading practice move...</Text>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Filter Container */}
        <View style={styles.filterContainer}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search moves..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Row */}
          <View style={styles.filterRow}>
            {/* Dance Style Dropdown */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Dance Style</Text>
              <TouchableOpacity
                style={styles.filterDropdown}
                onPress={() => {
                  setShowDanceStyleDropdown(!showDanceStyleDropdown)
                  setShowLevelDropdown(false)
                }}
              >
                <Text style={styles.filterDropdownText}>
                  {selectedDanceStyle === "all"
                    ? "All Styles"
                    : formatDanceName(selectedDanceStyle)}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Level Dropdown */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Level</Text>
              <TouchableOpacity
                style={styles.filterDropdown}
                onPress={() => {
                  setShowLevelDropdown(!showLevelDropdown)
                  setShowDanceStyleDropdown(false)
                }}
              >
                <Text style={styles.filterDropdownText}>
                  {selectedLevel === "all"
                    ? "All Levels"
                    : formatLevel(selectedLevel)}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dance Style Dropdown Menu */}
          {showDanceStyleDropdown && (
            <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedDanceStyle("all")
                  setShowDanceStyleDropdown(false)
                  loadNextMove()
                }}
              >
                <Text style={styles.dropdownItemText}>All Styles</Text>
                {selectedDanceStyle === "all" && (
                  <MaterialIcons name="check" size={20} color="#6200EE" />
                )}
              </TouchableOpacity>
              {getDanceStyleSections().map((section) => (
                <View key={section.title}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>
                      {section.title}
                    </Text>
                  </View>
                  {section.data.map((item, index) => (
                    <TouchableOpacity
                      key={item + index}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedDanceStyle(item)
                        setShowDanceStyleDropdown(false)
                        loadNextMove()
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {formatDanceName(item)}
                      </Text>
                      {selectedDanceStyle === item && (
                        <MaterialIcons name="check" size={20} color="#6200EE" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Level Dropdown Menu */}
          {showLevelDropdown && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedLevel("all")
                  setShowLevelDropdown(false)
                  loadNextMove()
                }}
              >
                <Text style={styles.dropdownItemText}>All Levels</Text>
                {selectedLevel === "all" && (
                  <MaterialIcons name="check" size={20} color="#6200EE" />
                )}
              </TouchableOpacity>
              {["bronze", "silver", "gold", "other"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedLevel(level)
                    setShowLevelDropdown(false)
                    loadNextMove()
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {formatLevel(level)}
                  </Text>
                  {selectedLevel === level && (
                    <MaterialIcons name="check" size={20} color="#6200EE" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Checkbox Row */}
          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
            >
              <MaterialIcons
                name={
                  showOnlyFavorites ? "check-box" : "check-box-outline-blank"
                }
                size={20}
                color="#FFD700"
              />
              <Text style={styles.checkboxLabel}>Show only favorites</Text>
            </TouchableOpacity>
          </View>

          {/* Results Count */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {movesWithVideos.length} move
              {movesWithVideos.length !== 1 ? "s" : ""} available
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Stats Header */}
          <View style={styles.statsHeader}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{movesWithVideos.length}</Text>
              <Text style={styles.statLabel}>Total Moves</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{practiceStats.session}</Text>
              <Text style={styles.statLabel}>This Session</Text>
            </View>
          </View>

          {/* Move Card with Animation */}
          <Animated.View
            style={[
              styles.moveCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.moveHeader}>
              <View style={styles.moveHeaderLeft}>
                <MaterialIcons name="school" size={32} color="#6200EE" />
                <Text style={styles.moveTitle}>Practice Move</Text>
              </View>
              <View style={styles.moveHeaderRight}>
                {showNewBadge && (
                  <Animated.View
                    style={[
                      styles.newBadge,
                      {
                        opacity: badgeAnim,
                        transform: [
                          {
                            translateY: badgeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <MaterialIcons name="fiber-new" size={20} color="#fff" />
                    <Text style={styles.newBadgeText}>New Move!</Text>
                  </Animated.View>
                )}
                {/* Level Badge */}
                {currentMove.level && currentMove.level !== "other" && (
                  <View
                    style={[
                      styles.levelBadge,
                      { backgroundColor: getLevelColor(currentMove.level) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelBadgeText,
                        { color: getLevelTextColor(currentMove.level) },
                      ]}
                    >
                      {formatLevel(currentMove.level)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.moveInfoContainer}>
              <Text style={styles.moveName}>{currentMove.name}</Text>

              <View style={styles.moveMetaRow}>
                <View style={styles.metaChip}>
                  <MaterialIcons name="music-note" size={16} color="#6200EE" />
                  <Text style={styles.metaText}>
                    {formatDanceName(currentMove.danceStyle)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metaChip,
                    currentMove.level !== "other" && {
                      backgroundColor: getLevelColor(currentMove.level) + "20",
                      borderColor: getLevelColor(currentMove.level),
                      borderWidth: 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="star"
                    size={16}
                    color={
                      currentMove.level !== "other"
                        ? getLevelColor(currentMove.level)
                        : "#6200EE"
                    }
                  />
                  <Text
                    style={[
                      styles.metaText,
                      currentMove.level !== "other" && {
                        color: getLevelColor(currentMove.level),
                      },
                    ]}
                  >
                    {formatLevel(currentMove.level)}
                  </Text>
                </View>
                {/* <View style={styles.metaChip}>
                  <MaterialIcons name="timer" size={16} color="#6200EE" />
                  <Text style={styles.metaText}>
                    {currentMove.counts} counts
                  </Text>
                </View> */}
              </View>

              {currentMove.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description:</Text>
                  <Text style={styles.descriptionText}>
                    {currentMove.description}
                  </Text>
                </View>
              )}
              <View style={styles.categoryButtons}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor:
                        CATEGORY_COLORS[MOVE_CATEGORIES.DONT_KNOW],
                    },
                  ]}
                  onPress={() =>
                    handleCategorySelection(MOVE_CATEGORIES.DONT_KNOW)
                  }
                >
                  <MaterialIcons
                    name="help-outline"
                    size={28}
                    color="#d32f2f"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor:
                        CATEGORY_COLORS[MOVE_CATEGORIES.FAMILIAR],
                    },
                  ]}
                  onPress={() =>
                    handleCategorySelection(MOVE_CATEGORIES.FAMILIAR)
                  }
                >
                  <MaterialIcons
                    name="bookmark-border"
                    size={28}
                    color="#f57c00"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    { backgroundColor: CATEGORY_COLORS[MOVE_CATEGORIES.KNOW] },
                  ]}
                  onPress={() => handleCategorySelection(MOVE_CATEGORIES.KNOW)}
                >
                  <MaterialIcons
                    name="check-circle-outline"
                    size={28}
                    color="#388e3c"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    { backgroundColor: CATEGORY_COLORS[MOVE_CATEGORIES.SKIP] },
                  ]}
                  onPress={() => loadNextMove()}
                >
                  <MaterialIcons name="skip-next" size={28} color="#666699" />
                </TouchableOpacity>
              </View>

              {/* Video Button */}
              <TouchableOpacity
                style={styles.videoButton}
                onPress={handleVideoPress}
              >
                <MaterialIcons
                  name="play-circle-filled"
                  size={24}
                  color="#fff"
                />
                <Text style={styles.videoButtonText}>Watch Video</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Video Player Modal */}
        <VideoPlayerModal
          visible={videoModalVisible}
          onClose={() => setVideoModalVisible(false)}
          videoSource={currentMove?.video}
          start={currentMove?.start}
          end={currentMove?.end}
          moveName={currentMove?.name}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  filterContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterDropdownText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownMenu: {
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  sectionHeader: {
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6200EE",
    textTransform: "uppercase",
  },
  resultsContainer: {
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  statsHeader: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6200EE",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  moveCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    position: "relative",
  },
  moveHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  moveHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  newBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  moveTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6200EE",
    marginLeft: 12,
  },
  moveInfoContainer: {
    gap: 12,
  },
  moveName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  moveMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#6200EE",
    fontWeight: "500",
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6200EE",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6200EE",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  videoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  instructionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  categoryContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  categoryButtons: {
    gap: 12,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 10,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  skipButtonText: {
    fontSize: 15,
    color: "#6200EE",
    fontWeight: "500",
  },
  checkboxRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    justifyContent: "flex-start",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 12,
    color: "#333",
    marginLeft: 6,
    fontWeight: "500",
  },
})

export default PracticeScreen
