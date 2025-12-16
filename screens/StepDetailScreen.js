import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import DraggableFlatList from "react-native-draggable-flatlist"
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler"
import VideoPlayerModal from "../components/video-player-modal"
import {
  DANCE_MOVES,
  FACING_DIRECTIONS,
  getAllMovesForStyle,
  getMovesWithSections,
  MOVE_DETAILS,
} from "../data/dance_info"
import { getMoveCategory, MOVE_CATEGORIES } from "../utils/moveCategories"
import { getSetting } from "../utils/settings"

const StepDetailScreen = () => {
  const params = useLocalSearchParams()
  const router = useRouter()

  // Memoize the step to prevent re-parsing on every render
  const step = React.useMemo(() => {
    return params.step ? JSON.parse(params.step) : null
  }, [params.step])

  const [moves, setMoves] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedMove, setSelectedMove] = useState("")
  const [selectedMoveForDetail, setSelectedMoveForDetail] = useState(null)
  const [showMoveDropdown, setShowMoveDropdown] = useState(false)
  const [showTimingDropdown, setShowTimingDropdown] = useState(false)
  const [showEditTimingDropdown, setShowEditTimingDropdown] = useState(false)
  const [selectedTimingMultiple, setSelectedTimingMultiple] = useState(null)
  const [editingNotes, setEditingNotes] = useState("")
  const [editingTechnique, setEditingTechnique] = useState("")
  const [editingCounts, setEditingCounts] = useState(null)
  const [editingDescription, setEditingDescription] = useState("")
  const [editingStartFacing, setEditingStartFacing] = useState(null)
  const [editingEndFacing, setEditingEndFacing] = useState(null)
  const [showEditStartFacingDropdown, setShowEditStartFacingDropdown] =
    useState(false)
  const [showEditEndFacingDropdown, setShowEditEndFacingDropdown] =
    useState(false)
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [selectedVideoMove, setSelectedVideoMove] = useState(null)
  const [moveSearchQuery, setMoveSearchQuery] = useState("")
  const [showMoveSearch, setShowMoveSearch] = useState(false)
  const [currentMoveCategory, setCurrentMoveCategory] = useState(null)
  const [showLevelBadges, setShowLevelBadges] = useState(true)
  const [showMoveCounts, setShowMoveCounts] = useState(true)

  // Helper function to find move's level in DANCE_MOVES
  const findMoveLevel = (moveName, danceStyle) => {
    const styleKey = danceStyle?.toLowerCase().replace(/\s+/g, "_")
    const styleData = DANCE_MOVES[styleKey]

    if (!styleData || typeof styleData !== "object") return null

    // Search through all levels to find the move
    for (const [level, movesArray] of Object.entries(styleData)) {
      if (Array.isArray(movesArray)) {
        const foundMove = movesArray.find(
          (m) => typeof m === "object" && m.name === moveName
        )
        if (foundMove) {
          return level
        }
      }
    }

    return null
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

  const formatLevel = (level) => {
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  // Load moves from storage when step is available
  useEffect(() => {
    if (step?.id) {
      loadMoves()
      loadSettings()
    }
  }, [step?.id])

  const loadMoves = async () => {
    if (!step?.id) return

    try {
      const storedMoves = await AsyncStorage.getItem(`step_moves_${step.id}`)
      if (storedMoves) {
        const parsedMoves = JSON.parse(storedMoves)
        setMoves(parsedMoves)
      }
    } catch (error) {
      console.error("Error loading moves:", error)
    }
  }

  const saveMoves = async (movesToSave) => {
    if (!step?.id) return

    try {
      await AsyncStorage.setItem(
        `step_moves_${step.id}`,
        JSON.stringify(movesToSave)
      )
    } catch (error) {
      console.error("Error saving moves:", error)
    }
  }

  const loadSettings = async () => {
    try {
      const levelBadgesSetting = await getSetting("showMoveLevelBadges")
      const countsSetting = await getSetting("showMoveCounts")
      setShowLevelBadges(levelBadgesSetting)
      setShowMoveCounts(countsSetting)
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const hasVariableTiming = (moveName) => {
    const moves = getAllMovesForStyle(step?.danceStyle)

    const moveData = moves.find((m) => {
      if (typeof m === "object") {
        return m.name === moveName
      }
      return m === moveName
    })

    // Check if move has a repeatable section (which means variable timing)
    if (
      moveData &&
      typeof moveData === "object" &&
      moveData.repeatableSection
    ) {
      return true
    }

    return false
  }

  const getDefaultCounts = (moveName) => {
    const moves = getAllMovesForStyle(step?.danceStyle)

    const moveData = moves.find((m) => {
      if (typeof m === "object") {
        return m.name === moveName
      }
      return m === moveName
    })

    return moveData && typeof moveData === "object" ? moveData.counts : 8
  }

  const getMoveOrientationData = (moveName, danceStyle) => {
    const moves = getAllMovesForStyle(danceStyle)

    const moveData = moves.find((m) => {
      if (typeof m === "object") {
        return m.name === moveName
      }
      return m === moveName
    })

    if (moveData && typeof moveData === "object") {
      return {
        startFacing: moveData.startFacing || null,
        endFacing: moveData.endFacing || null,
      }
    }

    return { startFacing: null, endFacing: null }
  }

  const getTimingOptions = (moveName) => {
    const moves = getAllMovesForStyle(step?.danceStyle)

    const moveData = moves.find((m) => {
      if (typeof m === "object") {
        return m.name === moveName
      }
      return m === moveName
    })

    if (moveData && typeof moveData === "object") {
      // If move has a repeatable section, generate timing options
      if (moveData.repeatableSection && moveData.counts) {
        const baseCounts = moveData.counts
        const repeatSection = moveData.repeatableSection
        const options = [baseCounts]

        // Generate options for up to 5 repetitions of the repeatable section
        for (let i = 1; i <= 5; i++) {
          options.push(baseCounts + i * repeatSection)
        }

        return options
      }
    }

    return []
  }

  const handleAddMove = async () => {
    if (!selectedMove) {
      Alert.alert("Error", "Please select a move")
      return
    }

    if (hasVariableTiming(selectedMove) && !selectedTimingMultiple) {
      Alert.alert("Error", "Please select timing counts")
      return
    }

    const counts = selectedTimingMultiple || getDefaultCounts(selectedMove)

    const newMove = {
      id: Date.now().toString(),
      name: selectedMove,
      addedAt: new Date().toISOString(),
      notes: "",
      counts: counts,
      timing: `${counts} counts`,
    }

    const updatedMoves = [...moves, newMove]
    setMoves(updatedMoves)
    await saveMoves(updatedMoves)

    Alert.alert("Success", `Added "${selectedMove}" to step`)

    setSelectedMove("")
    setShowMoveDropdown(false)
    setShowTimingDropdown(false)
    setSelectedTimingMultiple(null)
    setMoveSearchQuery("")
    setShowMoveSearch(false)
    setModalVisible(false)
  }

  const handleCancel = () => {
    setSelectedMove("")
    setShowMoveDropdown(false)
    setShowTimingDropdown(false)
    setSelectedTimingMultiple(null)
    setMoveSearchQuery("")
    setShowMoveSearch(false)
    setModalVisible(false)
  }

  const handleDeleteMove = (move) => {
    // Use browser confirm on web, Alert.alert on mobile
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to remove "${move.name}" from this step?`
      )
      if (confirmed) {
        const updatedMoves = moves.filter((m) => m.id !== move.id)
        setMoves(updatedMoves)
        saveMoves(updatedMoves)
      }
    } else {
      Alert.alert(
        "Delete Move",
        `Are you sure you want to remove "${move.name}" from this step?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const updatedMoves = moves.filter((m) => m.id !== move.id)
              setMoves(updatedMoves)
              await saveMoves(updatedMoves)
            },
          },
        ]
      )
    }
  }

  const handleMovePress = async (move) => {
    setSelectedMoveForDetail(move)
    const moveDetails = getMoveDetails(move)
    const orientationData = getMoveOrientationData(move.name, step?.danceStyle)

    setEditingNotes(move.notes || "")
    setEditingTechnique(moveDetails.technique)
    setEditingCounts(move.counts || getDefaultCounts(move.name))
    setEditingDescription(moveDetails.description)
    setEditingStartFacing(
      move.startFacing || orientationData.startFacing || null
    )
    setEditingEndFacing(move.endFacing || orientationData.endFacing || null)
    setShowEditTimingDropdown(false) // Reset dropdown state
    setShowEditStartFacingDropdown(false)
    setShowEditEndFacingDropdown(false)

    // Load the move's category
    const styleKey = step?.danceStyle?.toLowerCase().replace(/\s+/g, "_")
    const level = findMoveLevel(move.name, step?.danceStyle)
    if (level && styleKey) {
      const category = await getMoveCategory(styleKey, level, move.name)
      setCurrentMoveCategory(category)
    } else {
      setCurrentMoveCategory(null)
    }

    setDetailModalVisible(true)
  }

  const handleSaveNotes = async () => {
    const updatedMoves = moves.map((m) =>
      m.id === selectedMoveForDetail.id
        ? {
            ...m,
            notes: editingNotes,
            technique: editingTechnique,
            counts: editingCounts,
            timing: `${editingCounts} counts`,
            description: editingDescription,
            startFacing: editingStartFacing,
            endFacing: editingEndFacing,
          }
        : m
    )
    setMoves(updatedMoves)
    await saveMoves(updatedMoves)
    setDetailModalVisible(false)
    setSelectedMoveForDetail(null)
  }

  const handleDuplicateMove = async () => {
    if (!selectedMoveForDetail) return

    // Find the index of the current move
    const currentIndex = moves.findIndex(
      (m) => m.id === selectedMoveForDetail.id
    )

    if (currentIndex === -1) return

    // Create a duplicate with a new ID and current timestamp
    const duplicatedMove = {
      ...selectedMoveForDetail,
      id: `${Date.now()}_${Math.random()}`,
      addedAt: new Date().toISOString(),
      notes: editingNotes,
      technique: editingTechnique,
      counts: editingCounts,
      timing: `${editingCounts} counts`,
      description: editingDescription,
      startFacing: editingStartFacing,
      endFacing: editingEndFacing,
    }

    // Insert the duplicate right after the current move
    const updatedMoves = [
      ...moves.slice(0, currentIndex + 1),
      duplicatedMove,
      ...moves.slice(currentIndex + 1),
    ]

    setMoves(updatedMoves)
    await saveMoves(updatedMoves)
    setDetailModalVisible(false)
    setSelectedMoveForDetail(null)

    if (Platform.OS === "web") {
      window.alert("Move duplicated successfully")
    } else {
      Alert.alert("Success", "Move duplicated successfully")
    }
  }

  const handleDragEnd = ({ data }) => {
    setMoves(data)
    saveMoves(data)
  }

  const getMoveDetails = (move) => {
    if (typeof move === "string") {
      return MOVE_DETAILS[move] || MOVE_DETAILS.default
    }
    const defaultDetails = MOVE_DETAILS[move.name] || MOVE_DETAILS.default
    return {
      technique: move.technique || defaultDetails.technique,
      timing: move.timing || defaultDetails.timing,
      description: move.description || defaultDetails.description,
    }
  }

  const getMoveVideoData = (moveName) => {
    const moves = getAllMovesForStyle(step?.danceStyle)

    const moveData = moves.find((m) => {
      if (typeof m === "object") {
        return m.name === moveName
      }
      return m === moveName
    })

    if (moveData && typeof moveData === "object" && moveData.video) {
      return {
        video: moveData.video,
        start: moveData.start || 0,
        end: moveData.end || 10,
      }
    }

    return null
  }

  const handleVideoPress = (move) => {
    const videoData = getMoveVideoData(move.name)
    if (videoData) {
      setSelectedVideoMove({
        name: move.name,
        ...videoData,
      })
      setVideoModalVisible(true)
    }
  }

  const renderRightActions = (item) => (progress, dragX) => {
    return (
      <TouchableOpacity
        style={styles.swipeDeleteButton}
        onPress={() => handleDeleteMove(item)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="delete" size={28} color="white" />
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    )
  }

  const renderMoveItem = ({ item, drag, isActive }) => {
    const hasVideo = getMoveVideoData(item.name) !== null

    return (
      <Swipeable
        renderRightActions={renderRightActions(item)}
        overshootRight={false}
        friction={2}
      >
        <View style={{ backgroundColor: "white" }}>
          <View style={[styles.moveItem, isActive && styles.moveItemActive]}>
            <TouchableOpacity
              style={styles.moveItemLeft}
              onPress={() => handleMovePress(item)}
              onLongPress={drag}
              delayLongPress={150}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="drag-indicator"
                size={20}
                color="#999"
                style={styles.dragIcon}
              />
              <View style={styles.moveTextContainer}>
                <View style={styles.moveNameRow}>
                  {showMoveCounts && item.counts && (
                    <Text style={styles.moveCounts}>{item.counts}</Text>
                  )}
                  <View style={styles.moveNameAndBadge}>
                    <Text style={styles.moveName}>{item.name}</Text>
                    {/* Level Badge - only show if setting is enabled */}
                    {showLevelBadges &&
                      (() => {
                        const level = findMoveLevel(item.name, step?.danceStyle)
                        return level && level !== "other" ? (
                          <View
                            style={[
                              styles.levelBadgeInList,
                              { backgroundColor: getLevelColor(level) },
                            ]}
                          >
                            <Text
                              style={[
                                styles.levelBadgeTextInList,
                                { color: getLevelTextColor(level) },
                              ]}
                            >
                              {formatLevel(level)}
                            </Text>
                          </View>
                        ) : null
                      })()}
                  </View>
                </View>
                {item.notes ? (
                  <Text style={styles.moveNotes} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
            <View style={styles.moveItemActions}>
              {hasVideo && (
                <TouchableOpacity
                  style={styles.videoButton}
                  onPress={() => handleVideoPress(item)}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name="play-circle-outline"
                    size={24}
                    color="#6200EE"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Swipeable>
    )
  }

  const renderMoveOption = ({ item }) => {
    if (typeof item === "object" && item.name) {
      const moveName = item.name
      const moveCounts = item.counts || "Not set"
      return (
        <TouchableOpacity
          style={[
            styles.moveOption,
            selectedMove === moveName && styles.selectedMoveOption,
          ]}
          onPress={() => {
            setSelectedMove(moveName)
            setShowMoveDropdown(false)
            setShowTimingDropdown(false)
            setSelectedTimingMultiple(null)
          }}
        >
          <View style={styles.moveOptionContent}>
            <Text
              style={[
                styles.moveCounts,
                selectedMove === moveName && styles.selectedMoveCounts,
              ]}
            >
              {moveCounts}
            </Text>
            <Text
              style={[
                styles.moveOptionText,
                selectedMove === moveName && styles.selectedMoveOptionText,
              ]}
            >
              {moveName}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        style={[
          styles.moveOption,
          selectedMove === item && styles.selectedMoveOption,
        ]}
        onPress={() => {
          setSelectedMove(item)
          setShowMoveDropdown(false)
          setShowTimingDropdown(false)
          setSelectedTimingMultiple(null)
        }}
      >
        <Text
          style={[
            styles.moveOptionText,
            selectedMove === item && styles.selectedMoveOptionText,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    )
  }

  // Support both old single danceStyle and new danceStyles array
  const stepDanceStyles = step?.danceStyles || [step?.danceStyle]
  const availableMoves = getAllMovesForStyle(step?.danceStyle)
  const availableMovesSections = getMovesWithSections(stepDanceStyles)

  // Filter moves based on search query
  const filteredMovesSections = React.useMemo(() => {
    if (!moveSearchQuery.trim()) {
      return availableMovesSections
    }

    const query = moveSearchQuery.toLowerCase()
    return availableMovesSections
      .map((section) => ({
        title: section.title,
        data: section.data.filter((move) => {
          const moveName = typeof move === "object" ? move.name : move
          return moveName.toLowerCase().includes(query)
        }),
      }))
      .filter((section) => section.data.length > 0)
  }, [availableMovesSections, moveSearchQuery])

  const renderMoveSectionHeader = ({ section: { title } }) => (
    <View style={styles.moveSectionHeader}>
      <Text style={styles.moveSectionHeaderText}>{title}</Text>
    </View>
  )

  if (!step) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#6200EE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Step</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepTitle}>{step.name}</Text>
            {step.videoUri && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedVideoMove({
                    video: { uri: step.videoUri },
                    start: 0,
                    end: 9999,
                    name: step.name,
                  })
                  setVideoModalVisible(true)
                }}
                style={styles.stepVideoButton}
              >
                <MaterialIcons
                  name="play-circle-outline"
                  size={28}
                  color="#6200EE"
                />
              </TouchableOpacity>
            )}
          </View>
          {stepDanceStyles.length > 1 ? (
            <View style={styles.multipleStylesContainer}>
              {stepDanceStyles.map((style, index) => (
                <Text key={style} style={styles.stepStyle}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                  {index < stepDanceStyles.length - 1 && ", "}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.stepStyle}>
              {step.danceStyle
                ?.split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </Text>
          )}
        </View>

        {moves.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No moves added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add moves to this step
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.instructionBanner}>
              <MaterialIcons name="info-outline" size={16} color="#6200EE" />
              <Text style={styles.instructionText}>
                Tap to view details • Hold and drag to reorder
              </Text>
            </View>
            <DraggableFlatList
              data={moves}
              renderItem={renderMoveItem}
              keyExtractor={(item) => item.id}
              onDragEnd={handleDragEnd}
              activationDistance={5}
              dragHitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
              containerStyle={styles.movesList}
              animationConfig={{
                damping: 20,
                stiffness: 200,
              }}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={30} color="white" />
        </TouchableOpacity>

        {/* Modal for adding moves */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCancel}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Add Move</Text>

                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Select Move</Text>
                      <TouchableOpacity
                        style={styles.searchIconButton}
                        onPress={() => setShowMoveSearch(!showMoveSearch)}
                      >
                        <MaterialIcons
                          name={showMoveSearch ? "close" : "search"}
                          size={20}
                          color="#6200EE"
                        />
                      </TouchableOpacity>
                    </View>

                    {showMoveSearch && (
                      <TextInput
                        style={styles.searchInput}
                        value={moveSearchQuery}
                        onChangeText={setMoveSearchQuery}
                        placeholder="Search moves..."
                        placeholderTextColor="#999"
                        autoFocus={true}
                      />
                    )}

                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowMoveDropdown(!showMoveDropdown)}
                    >
                      <Text
                        style={[
                          styles.dropdownButtonText,
                          !selectedMove && styles.placeholderText,
                        ]}
                      >
                        {selectedMove || "Select a move"}
                      </Text>
                      <MaterialIcons
                        name={
                          showMoveDropdown
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>

                    {showMoveDropdown && (
                      <View style={styles.dropdownContainer}>
                        <SectionList
                          sections={filteredMovesSections}
                          renderItem={renderMoveOption}
                          renderSectionHeader={renderMoveSectionHeader}
                          keyExtractor={(item, index) => {
                            if (typeof item === "object") {
                              return item.name || `move-${index}`
                            }
                            return item || `move-${index}`
                          }}
                          style={styles.dropdownList}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                          stickySectionHeadersEnabled={false}
                        />
                      </View>
                    )}
                  </View>

                  {/* Timing selection */}
                  {selectedMove && hasVariableTiming(selectedMove) && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        Select Timing (Counts)
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() =>
                          setShowTimingDropdown(!showTimingDropdown)
                        }
                      >
                        <Text
                          style={[
                            styles.dropdownButtonText,
                            !selectedTimingMultiple && styles.placeholderText,
                          ]}
                        >
                          {selectedTimingMultiple
                            ? `${selectedTimingMultiple} counts`
                            : "Select timing"}
                        </Text>
                        <MaterialIcons
                          name={
                            showTimingDropdown
                              ? "keyboard-arrow-up"
                              : "keyboard-arrow-down"
                          }
                          size={24}
                          color="#666"
                        />
                      </TouchableOpacity>

                      {showTimingDropdown && (
                        <View style={styles.dropdownContainer}>
                          <FlatList
                            data={getTimingOptions(selectedMove)}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[
                                  styles.danceStyleItem,
                                  selectedTimingMultiple === item &&
                                    styles.selectedDanceStyle,
                                ]}
                                onPress={() => {
                                  setSelectedTimingMultiple(item)
                                  setShowTimingDropdown(false)
                                }}
                              >
                                <Text
                                  style={[
                                    styles.danceStyleText,
                                    selectedTimingMultiple === item &&
                                      styles.selectedDanceStyleText,
                                  ]}
                                >
                                  {item} counts
                                </Text>
                              </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.toString()}
                            style={styles.dropdownList}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                          />
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancel}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={handleAddMove}
                    >
                      <Text style={styles.createButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Modal for move details and notes */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={detailModalVisible}
          onRequestClose={() => {
            Keyboard.dismiss()
            setDetailModalVisible(false)
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.detailModalContent}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.detailScrollView}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.modalTitleContainer}>
                      <Text style={styles.detailModalTitle}>
                        {selectedMoveForDetail?.name}
                      </Text>
                      {/* Level Badge */}
                      {(() => {
                        const level = findMoveLevel(
                          selectedMoveForDetail?.name,
                          step?.danceStyle
                        )
                        return level && level !== "other" ? (
                          <View
                            style={[
                              styles.levelBadgeInModal,
                              { backgroundColor: getLevelColor(level) },
                            ]}
                          >
                            <MaterialIcons
                              name={
                                level === "bronze"
                                  ? "looks-3"
                                  : level === "silver"
                                  ? "looks-two"
                                  : "looks-one"
                              }
                              size={18}
                              color={getLevelTextColor(level)}
                            />
                            <Text
                              style={[
                                styles.levelBadgeTextInModal,
                                { color: getLevelTextColor(level) },
                              ]}
                            >
                              {formatLevel(level)}
                            </Text>
                          </View>
                        ) : null
                      })()}
                    </View>

                    {currentMoveCategory && (
                      <View style={styles.categoryBadgeContainer}>
                        <View
                          style={[
                            styles.categoryBadge,
                            {
                              backgroundColor:
                                currentMoveCategory ===
                                MOVE_CATEGORIES.DONT_KNOW
                                  ? "#ffcccc"
                                  : currentMoveCategory ===
                                    MOVE_CATEGORIES.FAMILIAR
                                  ? "#fff9cc"
                                  : "#ccffcc",
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={
                              currentMoveCategory === MOVE_CATEGORIES.DONT_KNOW
                                ? "help-outline"
                                : currentMoveCategory ===
                                  MOVE_CATEGORIES.FAMILIAR
                                ? "bookmark-border"
                                : "check-circle-outline"
                            }
                            size={16}
                            color={
                              currentMoveCategory === MOVE_CATEGORIES.DONT_KNOW
                                ? "#d32f2f"
                                : currentMoveCategory ===
                                  MOVE_CATEGORIES.FAMILIAR
                                ? "#f57c00"
                                : "#388e3c"
                            }
                          />
                          <Text
                            style={[
                              styles.categoryBadgeText,
                              {
                                color:
                                  currentMoveCategory ===
                                  MOVE_CATEGORIES.DONT_KNOW
                                    ? "#d32f2f"
                                    : currentMoveCategory ===
                                      MOVE_CATEGORIES.FAMILIAR
                                    ? "#f57c00"
                                    : "#388e3c",
                              },
                            ]}
                          >
                            {currentMoveCategory === MOVE_CATEGORIES.DONT_KNOW
                              ? "Don't Know"
                              : currentMoveCategory === MOVE_CATEGORIES.FAMILIAR
                              ? "Familiar With"
                              : "Know"}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedMoveForDetail && (
                      <>
                        {/* Your Notes */}
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>
                            Your Notes
                          </Text>
                          <TextInput
                            style={styles.notesInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Add your personal notes about this move..."
                            placeholderTextColor="#999"
                            value={editingNotes}
                            onChangeText={setEditingNotes}
                            textAlignVertical="top"
                            returnKeyType="done"
                            blurOnSubmit={true}
                          />
                        </View>

                        {/* Start Facing Direction */}
                        <View style={[styles.detailSection, { zIndex: 3 }]}>
                          <Text style={styles.detailSectionTitle}>
                            Start Facing Direction
                          </Text>
                          <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() =>
                              setShowEditStartFacingDropdown(
                                !showEditStartFacingDropdown
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.dropdownButtonText,
                                !editingStartFacing && styles.placeholderText,
                              ]}
                            >
                              {editingStartFacing || "Select start facing"}
                            </Text>
                            <MaterialIcons
                              name={
                                showEditStartFacingDropdown
                                  ? "keyboard-arrow-up"
                                  : "keyboard-arrow-down"
                              }
                              size={24}
                              color="#666"
                            />
                          </TouchableOpacity>

                          {showEditStartFacingDropdown && (
                            <View style={styles.dropdownContainer}>
                              <ScrollView
                                style={styles.dropdownList}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled={true}
                              >
                                {Object.values(FACING_DIRECTIONS).map(
                                  (direction) => (
                                    <TouchableOpacity
                                      key={direction}
                                      style={[
                                        styles.moveOption,
                                        editingStartFacing === direction &&
                                          styles.selectedMoveOption,
                                      ]}
                                      onPress={() => {
                                        setEditingStartFacing(direction)
                                        setShowEditStartFacingDropdown(false)
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.moveOptionText,
                                          editingStartFacing === direction &&
                                            styles.selectedMoveOptionText,
                                        ]}
                                      >
                                        {direction}
                                      </Text>
                                    </TouchableOpacity>
                                  )
                                )}
                              </ScrollView>
                            </View>
                          )}
                        </View>

                        {/* End Facing Direction */}
                        <View style={[styles.detailSection, { zIndex: 2 }]}>
                          <Text style={styles.detailSectionTitle}>
                            End Facing Direction
                          </Text>
                          <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() =>
                              setShowEditEndFacingDropdown(
                                !showEditEndFacingDropdown
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.dropdownButtonText,
                                !editingEndFacing && styles.placeholderText,
                              ]}
                            >
                              {editingEndFacing || "Select end facing"}
                            </Text>
                            <MaterialIcons
                              name={
                                showEditEndFacingDropdown
                                  ? "keyboard-arrow-up"
                                  : "keyboard-arrow-down"
                              }
                              size={24}
                              color="#666"
                            />
                          </TouchableOpacity>

                          {showEditEndFacingDropdown && (
                            <View style={styles.dropdownContainer}>
                              <ScrollView
                                style={styles.dropdownList}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled={true}
                              >
                                {Object.values(FACING_DIRECTIONS).map(
                                  (direction) => (
                                    <TouchableOpacity
                                      key={direction}
                                      style={[
                                        styles.moveOption,
                                        editingEndFacing === direction &&
                                          styles.selectedMoveOption,
                                      ]}
                                      onPress={() => {
                                        setEditingEndFacing(direction)
                                        setShowEditEndFacingDropdown(false)
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.moveOptionText,
                                          editingEndFacing === direction &&
                                            styles.selectedMoveOptionText,
                                        ]}
                                      >
                                        {direction}
                                      </Text>
                                    </TouchableOpacity>
                                  )
                                )}
                              </ScrollView>
                            </View>
                          )}
                        </View>

                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>
                            Technique
                          </Text>
                          <TextInput
                            style={styles.detailInput}
                            multiline
                            numberOfLines={3}
                            placeholder="Enter technique details..."
                            placeholderTextColor="#999"
                            value={editingTechnique}
                            onChangeText={setEditingTechnique}
                            textAlignVertical="top"
                            blurOnSubmit={true}
                          />
                        </View>

                        {/* Counts input - now editable for all moves */}
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Counts</Text>
                          <TextInput
                            style={styles.countInput}
                            keyboardType="numeric"
                            placeholder="Enter counts"
                            placeholderTextColor="#999"
                            value={editingCounts?.toString() || ""}
                            onChangeText={(text) => {
                              const num = parseInt(text)
                              if (!isNaN(num) && num > 0) {
                                setEditingCounts(num)
                              } else if (text === "") {
                                setEditingCounts(null)
                              }
                            }}
                          />
                        </View>

                        {/* Keep this section for reference but hide it - delete later if not needed */}
                        {false &&
                        hasVariableTiming(selectedMoveForDetail?.name) ? (
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>
                              Timing (Counts)
                            </Text>
                            <TouchableOpacity
                              style={styles.dropdownButton}
                              onPress={() =>
                                setShowEditTimingDropdown(
                                  !showEditTimingDropdown
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.dropdownButtonText,
                                  !editingCounts && styles.placeholderText,
                                ]}
                              >
                                {editingCounts
                                  ? `${editingCounts} counts`
                                  : "Select timing"}
                              </Text>
                              <MaterialIcons
                                name={
                                  showEditTimingDropdown
                                    ? "keyboard-arrow-up"
                                    : "keyboard-arrow-down"
                                }
                                size={24}
                                color="#666"
                              />
                            </TouchableOpacity>

                            {showEditTimingDropdown && (
                              <View
                                style={[
                                  styles.dropdownContainer,
                                  styles.dropdownListScroll,
                                ]}
                              >
                                {getTimingOptions(
                                  selectedMoveForDetail?.name
                                ).map((item) => (
                                  <TouchableOpacity
                                    key={item.toString()}
                                    style={[
                                      styles.danceStyleItem,
                                      editingCounts === item &&
                                        styles.selectedDanceStyle,
                                    ]}
                                    onPress={() => {
                                      setEditingCounts(item)
                                      setShowEditTimingDropdown(false)
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.danceStyleText,
                                        editingCounts === item &&
                                          styles.selectedDanceStyleText,
                                      ]}
                                    >
                                      {item} counts
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        ) : (
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>
                              Timing (Counts)
                            </Text>
                            <View style={styles.fixedCountsDisplay}>
                              <Text style={styles.fixedCountsText}>
                                {editingCounts} counts (fixed)
                              </Text>
                            </View>
                          </View>
                        )}

                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>
                            Description
                          </Text>
                          <TextInput
                            style={styles.detailInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Enter move description..."
                            placeholderTextColor="#999"
                            value={editingDescription}
                            onChangeText={setEditingDescription}
                            textAlignVertical="top"
                            blurOnSubmit={true}
                          />
                        </View>
                      </>
                    )}
                  </ScrollView>

                  <View style={styles.detailButtonContainer}>
                    <TouchableOpacity
                      style={styles.detailCloseButton}
                      onPress={() => {
                        Keyboard.dismiss()
                        setDetailModalVisible(false)
                        setSelectedMoveForDetail(null)
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Close</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailDuplicateButton}
                      onPress={() => {
                        Keyboard.dismiss()
                        handleDuplicateMove()
                      }}
                    >
                      <Text style={styles.duplicateButtonText}>Duplicate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailSaveButton}
                      onPress={() => {
                        Keyboard.dismiss()
                        handleSaveNotes()
                      }}
                    >
                      <Text style={styles.createButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Video Player Modal */}
        <VideoPlayerModal
          visible={videoModalVisible}
          onClose={() => setVideoModalVisible(false)}
          videoSource={selectedVideoMove?.video}
          start={selectedVideoMove?.start || 0}
          end={selectedVideoMove?.end || 10}
          moveName={selectedVideoMove?.name || ""}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  headerInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepVideoButton: {
    padding: 4,
    marginLeft: 8,
  },
  stepStyle: {
    fontSize: 16,
    color: "#666",
  },
  multipleStylesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  instructionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0e7ff",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#6200EE",
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  movesList: {
    flex: 1,
  },
  movesListContent: {
    paddingBottom: 20,
  },
  moveItem: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 1,
    marginHorizontal: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    minHeight: 72,
  },
  moveItemActive: {
    backgroundColor: "#f0e7ff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  moveItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dragIcon: {
    marginRight: 12,
  },
  moveTextContainer: {
    flex: 1,
  },
  moveNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moveNameAndBadge: {
    flex: 1,
    gap: 6,
  },
  levelBadgeInList: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
  },
  levelBadgeTextInList: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  moveName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  moveCounts: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6200EE",
    backgroundColor: "#f0e7ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    minWidth: 32,
    textAlign: "center",
  },
  moveNotes: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  moveItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  videoButton: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#f0e7ff",
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6200EE",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6.27,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
    zIndex: 2,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  searchIconButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: "#f0e7ff",
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#6200EE",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  dropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    marginTop: 8,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  dropdownList: {
    maxHeight: 250,
  },
  moveOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  moveOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  selectedMoveOption: {
    backgroundColor: "#6200EE",
  },
  moveOptionText: {
    fontSize: 17,
    color: "#333",
    fontWeight: "500",
  },
  selectedMoveOptionText: {
    color: "white",
    fontWeight: "600",
  },
  moveCounts: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6200EE",
    backgroundColor: "#f0e7ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    minWidth: 32,
    textAlign: "center",
  },
  selectedMoveCounts: {
    color: "#E0D4F7",
    backgroundColor: "#4A148C",
  },
  moveSectionHeader: {
    backgroundColor: "#f0e7ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d4f7",
  },
  moveSectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6200EE",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  danceStyleItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  selectedDanceStyle: {
    backgroundColor: "#6200EE",
  },
  danceStyleText: {
    fontSize: 17,
    color: "#333",
    fontWeight: "500",
  },
  selectedDanceStyleText: {
    color: "white",
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    zIndex: 1,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6200EE",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6200EE",
    fontSize: Platform.OS === "web" ? 16 : 13,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    padding: 12,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: "#6200EE",
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: Platform.OS === "web" ? 16 : 13,
    fontWeight: "600",
  },
  detailModalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6.27,
  },
  detailScrollView: {
    maxHeight: "100%",
  },
  modalTitleContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  detailModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6200EE",
    textAlign: "center",
    marginBottom: 8,
  },
  levelBadgeInModal: {
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
  levelBadgeTextInModal: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  categoryBadgeContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailSection: {
    marginBottom: 20,
    overflow: "visible",
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6200EE",
    marginBottom: 8,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#f9f9f9",
    minHeight: 80,
  },
  countInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#f9f9f9",
    minHeight: 44,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#f9f9f9",
    minHeight: 100,
  },
  detailButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  detailCloseButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6200EE",
    alignItems: "center",
    justifyContent: "center",
  },
  detailDuplicateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF9800",
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  duplicateButtonText: {
    color: "#FF9800",
    fontSize: Platform.OS === "web" ? 16 : 13,
    fontWeight: "600",
  },
  detailSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#6200EE",
    alignItems: "center",
    justifyContent: "center",
  },
  orientationContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "visible",
  },
  orientationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  orientationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
    width: 50,
  },
  orientationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0e7ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  orientationDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0e7ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    flex: 1,
  },
  orientationDropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 60,
    right: 0,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 4,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  orientationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6200EE",
    flex: 1,
  },
  fixedCountsDisplay: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  fixedCountsText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  swipeDeleteButton: {
    backgroundColor: "#FF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: "100%",
    flexDirection: "column",
    gap: 4,
  },
  swipeDeleteText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
})

export default StepDetailScreen
