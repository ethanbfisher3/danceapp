import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Print from "expo-print"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import DraggableFlatList from "react-native-draggable-flatlist"
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler"
import AddMoveModal from "../components/AddMoveModal"
import VideoPlayerModal from "../components/video-player-modal"
import {
  DANCE_MOVES,
  FACING_DIRECTIONS,
  getAllMovesForStyle,
  MOVE_DETAILS,
} from "../data/dance_info"
import {
  CATEGORY_COLORS,
  getAllMoveCategories,
  getMoveCategory,
  getMoveKey,
  MOVE_CATEGORIES,
} from "../utils/moveCategories"
import { getSetting } from "../utils/settings"

const RoutineDetailScreen = () => {
  const params = useLocalSearchParams()
  const router = useRouter()

  // Memoize the routine to prevent re-parsing on every render
  const routine = React.useMemo(() => {
    return params.routine ? JSON.parse(params.routine) : null
  }, [params.routine])

  const [moves, setMoves] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedMoveForDetail, setSelectedMoveForDetail] = useState(null)
  const [showEditTimingDropdown, setShowEditTimingDropdown] = useState(false)
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
  const [availableSteps, setAvailableSteps] = useState([])
  const [expandedSteps, setExpandedSteps] = useState({})
  const [expandedRoutineSteps, setExpandedRoutineSteps] = useState({})
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [selectedVideoMove, setSelectedVideoMove] = useState(null)
  const [moveCategories, setMoveCategories] = useState({})
  const [currentMoveCategory, setCurrentMoveCategory] = useState(null)
  const [replacingMoveId, setReplacingMoveId] = useState(null)
  const [showLevelBadges, setShowLevelBadges] = useState(true)
  const [useMoveRotation, setUseMoveRotation] = useState(true)
  const [showMoveCounts, setShowMoveCounts] = useState(true)
  const [editingEnding, setEditingEnding] = useState(null)
  const [showEditEndingDropdown, setShowEditEndingDropdown] = useState(false)
  const [expandedMovesWithEndings, setExpandedMovesWithEndings] = useState({})

  // Load moves from storage when routine is available
  useEffect(() => {
    if (routine?.id) {
      loadMoves()
      loadSteps()
      loadCategories()
      loadSettings()
    }
  }, [routine?.id])

  // Reload moves when screen comes into focus (to update steps that may have changed)
  useFocusEffect(
    useCallback(() => {
      if (routine?.id) {
        loadMoves()
        loadSteps()
        loadCategories()
        loadSettings()
      }
    }, [routine?.id])
  )

  const loadMoves = async () => {
    if (!routine?.id) return

    try {
      const storedMoves = await AsyncStorage.getItem(`moves_${routine.id}`)
      if (storedMoves) {
        const parsedMoves = JSON.parse(storedMoves)

        // For any steps in the routine, load their current moves
        const movesWithUpdatedSteps = await Promise.all(
          parsedMoves.map(async (move) => {
            if (move.isStep && move.stepId) {
              try {
                const stepMoves = await AsyncStorage.getItem(
                  `step_moves_${move.stepId}`
                )
                if (stepMoves) {
                  const currentStepMoves = JSON.parse(stepMoves)
                  return {
                    ...move,
                    moves: currentStepMoves,
                    counts: currentStepMoves.reduce(
                      (sum, m) => sum + (m.counts || 0),
                      0
                    ),
                  }
                }
              } catch (error) {
                console.error("Error loading step moves:", error)
              }
            }
            return move
          })
        )

        setMoves(movesWithUpdatedSteps)
      }
    } catch (error) {
      console.error("Error loading moves:", error)
    }
  }

  const saveMoves = async (movesToSave) => {
    if (!routine?.id) return

    try {
      await AsyncStorage.setItem(
        `moves_${routine.id}`,
        JSON.stringify(movesToSave)
      )
    } catch (error) {
      console.error("Error saving moves:", error)
    }
  }

  const loadSteps = async () => {
    try {
      const storedSteps = await AsyncStorage.getItem("steps")
      if (storedSteps) {
        const allSteps = JSON.parse(storedSteps)
        // Filter steps that match the current routine's dance style
        const matchingSteps = allSteps.filter(
          (step) =>
            step.danceStyle?.toLowerCase() ===
            routine?.danceStyle?.toLowerCase()
        )

        // Load moves for each step
        const stepsWithMoves = await Promise.all(
          matchingSteps.map(async (step) => {
            try {
              const stepMoves = await AsyncStorage.getItem(
                `step_moves_${step.id}`
              )
              return {
                ...step,
                moves: stepMoves ? JSON.parse(stepMoves) : [],
              }
            } catch (error) {
              return { ...step, moves: [] }
            }
          })
        )

        setAvailableSteps(stepsWithMoves)
      }
    } catch (error) {
      console.error("Error loading steps:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const categories = await getAllMoveCategories()
      setMoveCategories(categories)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadSettings = async () => {
    try {
      const levelBadgesSetting = await getSetting("showMoveLevelBadges")
      const rotationSetting = await getSetting("useMoveRotation")
      const countsSetting = await getSetting("showMoveCounts")
      setShowLevelBadges(levelBadgesSetting)
      setUseMoveRotation(rotationSetting)
      setShowMoveCounts(countsSetting)
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

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

  // Get category color for a move
  const getMoveCategoryColor = (moveName, danceStyle) => {
    const styleKey = danceStyle?.toLowerCase().replace(/\s+/g, "_")
    const level = findMoveLevel(moveName, danceStyle)

    if (!level) return "transparent"

    const categoryKey = getMoveKey(styleKey, level, moveName)
    const category = moveCategories[categoryKey]

    return category ? CATEGORY_COLORS[category] : "transparent"
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

  const formatDanceName = (danceStyle) => {
    return danceStyle
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const generatePDF = async () => {
    try {
      // Get level color as hex
      const getLevelColorHex = (level) => {
        switch (level?.toLowerCase()) {
          case "bronze":
            return "#CD7F32"
          case "silver":
            return "#C0C0C0"
          case "gold":
            return "#FFD700"
          default:
            return "#333333"
        }
      }

      // Helper function to generate a row for a move
      const generateMoveRow = (move, index, rowIndex) => {
        if (move.isStep) {
          // Handle step items
          const stepMoves = move.moves || []
          const stepMovesHtml = stepMoves
            .map((stepMove, idx) => {
              return `
                <div style="padding-left: 20px; margin-top: ${
                  idx === 0 ? "5px" : "2px"
                };">
                  <span style="color: #666;">↳</span> ${stepMove.name}
                  ${stepMove.counts ? ` (${stepMove.counts} counts)` : ""}
                </div>
              `
            })
            .join("")

          const notesHtml = move.notes?.trim()
            ? `<div style="color: #666; font-size: 12px; font-style: italic; margin-top: 6px; padding: 6px; background-color: #f0f0f0; border-radius: 4px;">📝 ${move.notes}</div>`
            : ""

          return `
            <tr style="background-color: ${
              rowIndex % 2 === 0 ? "#f9f9f9" : "#ffffff"
            };">
              <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-weight: 600; color: #333;">
                ${index + 1}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #ddd;">
                <div style="font-weight: 600; color: #2196F3;">${
                  move.name
                }</div>
                ${stepMovesHtml}
                ${notesHtml}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: 600;">
                ${move.counts || "-"}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-size: 14px;">
                ${move.startFacing || "-"}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-size: 14px;">
                ${move.endFacing || "-"}
              </td>
            </tr>
          `
        } else {
          // Handle regular moves
          const level = findMoveLevel(move.name, routine?.danceStyle)

          // NOTE: Level emoji badge removed from PDF output per request.
          // Level is still available if needed for other formatting.

          const notesHtml = move.notes?.trim()
            ? `<div style="color: #666; font-size: 12px; font-style: italic; margin-top: 6px; padding: 6px; background-color: #f0f0f0; border-radius: 4px;">📝 ${move.notes}</div>`
            : ""

          return `
            <tr style="background-color: ${
              rowIndex % 2 === 0 ? "#f9f9f9" : "#ffffff"
            };">
              <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-weight: 600; color: #333;">
                ${index + 1}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #ddd;">
                <span style="font-weight: 600; color: #333;">${move.name}</span>
                ${
                  move.hasEnding && move.endingMove
                    ? `<div style="color: #666; font-size: 13px; margin-top: 4px;">→ ${move.endingMove}</div>`
                    : ""
                }
                ${notesHtml}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: 600;">
                ${move.counts || "-"}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-size: 14px;">
                ${move.startFacing || "-"}
              </td>
              <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-size: 14px;">
                ${move.endFacing || "-"}
              </td>
            </tr>
          `
        }
      }

      // Generate all rows for a single continuous table
      // Let the PDF engine handle page breaks based on actual content height
      const moveRows = moves
        .map((move, index) => generateMoveRow(move, index, index))
        .join("")

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page {
                margin: 1in;
              }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                line-height: 1.6;
                margin: 0;
                padding: 0;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #6200EE;
                padding-bottom: 20px;
                page-break-after: avoid;
              }
              .title {
                font-size: 32px;
                font-weight: bold;
                color: #6200EE;
                margin: 0 0 10px 0;
              }
              .subtitle {
                font-size: 18px;
                color: #666;
                margin: 5px 0;
              }
              .dance-style {
                font-size: 16px;
                color: #888;
                font-style: italic;
                margin-top: 8px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                page-break-inside: auto;
              }
              thead {
                display: table-header-group;
              }
              tbody {
                display: table-row-group;
              }
              tr {
                page-break-inside: avoid !important;
                page-break-after: auto;
              }
              tbody tr:last-child {
                page-break-after: auto;
              }
              th {
                background-color: #6200EE;
                color: white;
                padding: 14px 8px;
                text-align: left;
                font-weight: 600;
                border: 1px solid #6200EE;
                font-size: 14px;
                page-break-after: avoid;
              }
              th:first-child {
                text-align: center;
                width: 50px;
              }
              th:nth-child(3) {
                text-align: center;
                width: 80px;
              }
              th:nth-child(4) {
                text-align: center;
                width: 100px;
              }
              th:nth-child(5) {
                text-align: center;
                width: 100px;
              }
              td {
                padding: 12px 8px;
                border: 1px solid #ddd;
                page-break-inside: avoid !important;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${routine.name}</div>
              ${
                routine.description
                  ? `<div class="subtitle">${routine.description}</div>`
                  : ""
              }
              <div class="dance-style">${formatDanceName(
                routine.danceStyle
              )}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Move Name</th>
                  <th>Counts</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                ${moveRows}
              </tbody>
            </table>
          </body>
        </html>
      `

      // Generate PDF with preview
      await Print.printAsync({
        html,
        // This will show the native print preview dialog
        // Users can then save as PDF or share from there
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      Alert.alert("Error", `Failed to generate PDF: ${error.message}`)
    }
  }

  const closeAllEditMoveDropdowns = () => {
    setShowEditTimingDropdown(false)
    setShowEditStartFacingDropdown(false)
    setShowEditEndFacingDropdown(false)
    setShowEditEndingDropdown(false)
  }

  // Handler for AddMoveModal component
  const handleMoveSubmit = async (moveData) => {
    const newMove = {
      id: Date.now().toString(),
      addedAt: new Date().toISOString(),
      notes: "",
      ...moveData,
    }

    let updatedMoves
    let successMessage

    if (replacingMoveId) {
      // Replace the existing move
      updatedMoves = moves.map((move) =>
        move.id === replacingMoveId ? newMove : move
      )
      successMessage = `Replaced move with "${moveData.name}"`
      setReplacingMoveId(null)
    } else {
      // Add new move
      updatedMoves = [...moves, newMove]
      successMessage = `Added "${moveData.name}" to routine`
    }

    await saveMoves(updatedMoves)
    setMoves(updatedMoves)

    Alert.alert("Success", successMessage)
    setModalVisible(false)
  }

  const handleAddStep = async (step) => {
    if (!step || !step.moves || step.moves.length === 0) {
      if (Platform.OS === "web") {
        window.alert("This step has no moves")
      } else {
        Alert.alert("Error", "This step has no moves")
      }
      return
    }

    // Add the step as a single item (not expanding its moves)
    const stepItem = {
      id: `${Date.now()}_${Math.random()}`,
      name: step.name,
      isStep: true,
      stepId: step.id,
      moves: step.moves,
      addedAt: new Date().toISOString(),
      // Calculate total counts from all moves in the step
      counts: step.moves.reduce((sum, move) => sum + (move.counts || 0), 0),
    }

    const updatedMoves = [...moves, stepItem]
    setMoves(updatedMoves)
    await saveMoves(updatedMoves)

    if (Platform.OS === "web") {
      window.alert(`Added step "${step.name}" to routine`)
    } else {
      Alert.alert("Success", `Added step "${step.name}" to routine`)
    }

    setModalVisible(false)
  }

  const handleCancel = () => {
    setModalVisible(false)
  }

  const handleDeleteMove = (move) => {
    // Use browser confirm on web, Alert.alert on mobile
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to remove "${move.name}" from this routine?`
      )
      if (confirmed) {
        const updatedMoves = moves.filter((m) => m.id !== move.id)
        setMoves(updatedMoves)
        saveMoves(updatedMoves)
      }
    } else {
      Alert.alert(
        "Delete Move",
        `Are you sure you want to remove "${move.name}" from this routine?`,
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

  const handleReplaceMove = (moveToReplace) => {
    setReplacingMoveId(moveToReplace.id)
    setModalVisible(true)
  }

  const handleMovePress = async (move) => {
    // Don't open detail modal for steps
    if (move.isStep) {
      return
    }

    setSelectedMoveForDetail(move)
    const moveDetails = getMoveDetails(move)
    const orientationData = getMoveOrientationData(
      move.name,
      routine?.danceStyle
    )

    setEditingNotes(move.notes || "")
    setEditingTechnique(moveDetails.technique)
    setEditingCounts(move.counts || getDefaultCounts(move.name))
    setEditingDescription(moveDetails.description)
    setEditingStartFacing(
      move.startFacing || orientationData.startFacing || null
    )
    setEditingEndFacing(move.endFacing || orientationData.endFacing || null)
    setEditingEnding(move.endingMove || null)
    setShowEditTimingDropdown(false) // Reset dropdown state
    setShowEditStartFacingDropdown(false)
    setShowEditEndFacingDropdown(false)
    setShowEditEndingDropdown(false)

    // Load the move's category
    const styleKey = routine?.danceStyle?.toLowerCase().replace(/\s+/g, "_")
    const level = findMoveLevel(move.name, routine?.danceStyle)
    if (level && styleKey) {
      const category = await getMoveCategory(styleKey, level, move.name)
      setCurrentMoveCategory(category)
    } else {
      setCurrentMoveCategory(null)
    }

    setDetailModalVisible(true)
  }

  const handleSaveNotes = async () => {
    const baseCounts = hasEndings(selectedMoveForDetail.name)
      ? getDefaultCounts(selectedMoveForDetail.name)
      : editingCounts

    const finalCounts = editingEnding
      ? baseCounts + (getMoveData(editingEnding)?.counts || 0)
      : editingCounts

    const updatedMoves = moves.map((m) =>
      m.id === selectedMoveForDetail.id
        ? {
            ...m,
            notes: editingNotes,
            technique: editingTechnique,
            counts: finalCounts,
            timing: `${finalCounts} counts`,
            description: editingDescription,
            startFacing: editingStartFacing,
            endFacing: editingEndFacing,
            endingMove: editingEnding,
            hasEnding: editingEnding ? true : false,
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
    // Save in background without awaiting to avoid lag
    saveMoves(data)
  }

  const getMoveDetails = (move) => {
    // If move is a string (just the name), get from MOVE_DETAILS
    if (typeof move === "string") {
      return MOVE_DETAILS[move] || MOVE_DETAILS.default
    }
    // If move is an object, use custom values if they exist, otherwise use defaults
    const defaultDetails = MOVE_DETAILS[move.name] || MOVE_DETAILS.default
    return {
      technique: move.technique || defaultDetails.technique,
      timing: move.timing || defaultDetails.timing,
      description: move.description || defaultDetails.description,
    }
  }

  const hasVariableTiming = (moveName) => {
    // Check if the move is from DANCE_MOVES and has variable property
    const moves = getAllMovesForStyle(routine?.danceStyle)

    // Find the move in the array
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

  const getMoveVideoData = (moveName, danceStyle) => {
    const moves = getAllMovesForStyle(danceStyle)

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

  const handleVideoPress = (move, danceStyle) => {
    const videoData = getMoveVideoData(move.name, danceStyle)
    if (videoData) {
      setSelectedVideoMove({
        name: move.name,
        ...videoData,
      })
      setVideoModalVisible(true)
    }
  }

  const getDefaultCounts = (moveName) => {
    const moves = getAllMovesForStyle(routine?.danceStyle)

    const moveData = moves.find((m) => {
      if (typeof m === "object") {
        return m.name === moveName
      }
      return m === moveName
    })

    return moveData && typeof moveData === "object" ? moveData.counts : 8
  }

  const getMoveRotation = (moveName) => {
    const moves = getAllMovesForStyle(routine?.danceStyle)

    const moveData = moves.find((m) => {
      if (typeof m === "object") {
        return m.name === moveName
      }
      return m === moveName
    })

    if (moveData && typeof moveData === "object" && moveData.rotation) {
      return moveData.rotation
    }

    return [0, 0]
  }

  const hasVariableRotation = (moveName) => {
    const rotation = getMoveRotation(moveName)
    return rotation[0] !== rotation[1]
  }

  const getRotationOptions = (moveName) => {
    const rotation = getMoveRotation(moveName)
    const minRotation = Math.min(rotation[0], rotation[1])
    const maxRotation = Math.max(rotation[0], rotation[1])

    const options = []
    // Generate options in 45-degree (1/8 turn) increments
    for (let deg = minRotation; deg <= maxRotation; deg += 45) {
      options.push(deg)
    }

    return options
  }

  const formatRotation = (degrees) => {
    const absDegrees = Math.abs(degrees)
    const turns = absDegrees / 360
    const eighths = Math.round(absDegrees / 45)
    const direction = degrees < 0 ? " Left" : degrees > 0 ? " Right" : ""

    if (degrees === 0) return "No Rotation"
    if (absDegrees === 90) return `1/4 Turn${direction}`
    if (absDegrees === 180) return `1/2 Turn${direction}`
    if (absDegrees === 270) return `3/4 Turn${direction}`
    if (absDegrees === 360) return `Full Turn${direction}`

    return `${eighths}/8 Turn${direction} (${absDegrees}°)`
  }

  const getMoveData = (moveName) => {
    const moves = getAllMovesForStyle(routine?.danceStyle)
    return moves.find((m) => {
      if (typeof m === "object") {
        return m.name === moveName
      }
      return m === moveName
    })
  }

  // Temporarily disable ending functionality - always return false
  const hasEndings = (moveName) => {
    return false
  }

  // Temporarily disable ending functionality - always return empty array
  const getEndings = (moveName) => {
    return []
  }

  const getDisplayName = (moveName) => {
    const moveData = getMoveData(moveName)
    if (moveData && typeof moveData === "object" && moveData.displayName) {
      return moveData.displayName
    }
    return moveName
  }

  const getTimingOptions = (moveName) => {
    // Get move data to check for custom timing options
    const moves = getAllMovesForStyle(routine?.danceStyle)

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

  const renderRightActions = (item) => (progress, dragX) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={styles.swipeReplaceButton}
          onPress={() => handleReplaceMove(item)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="swap-horiz" size={24} color="white" />
          <Text style={styles.swipeActionText}>Replace</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.swipeDeleteButton}
          onPress={() => handleDeleteMove(item)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="delete" size={24} color="white" />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderMoveItem = ({ item, drag, isActive }) => {
    // If this is a step, render it as expandable/collapsible
    if (item.isStep) {
      const isExpanded = expandedRoutineSteps[item.id]
      const moveCount = item.moves?.length || 0

      return (
        <Swipeable
          renderRightActions={renderRightActions(item)}
          overshootRight={false}
          friction={2}
        >
          <View style={{ backgroundColor: "white" }}>
            <View style={[styles.moveItem, isActive && styles.moveItemActive]}>
              <MaterialIcons
                name="drag-indicator"
                size={20}
                color="#999"
                style={styles.dragIcon}
                onLongPress={drag}
              />
              <TouchableOpacity
                style={styles.stepInRoutineLeft}
                onPress={() => {
                  setExpandedRoutineSteps((prev) => ({
                    ...prev,
                    [item.id]: !prev[item.id],
                  }))
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={
                    isExpanded ? "keyboard-arrow-down" : "keyboard-arrow-right"
                  }
                  size={20}
                  color="#6200EE"
                />
                <View style={styles.moveTextContainer}>
                  <View style={styles.moveNameRow}>
                    {showMoveCounts && item.counts && (
                      <Text style={styles.moveCounts}>{item.counts}</Text>
                    )}
                    <Text style={[styles.moveName, styles.stepNameInRoutine]}>
                      {item.name}
                    </Text>
                    <Text style={styles.stepMoveCount}>
                      ({moveCount} {moveCount === 1 ? "move" : "moves"})
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.moveItemActions}>
                {/* Show video button if this custom step has a video */}
                {(() => {
                  const originalStep = availableSteps.find(
                    (s) => s.id === item.stepId
                  )
                  return originalStep?.videoUri ? (
                    <TouchableOpacity
                      style={styles.videoButton}
                      onPress={() => {
                        setSelectedVideoMove({
                          video: { uri: originalStep.videoUri },
                          start: 0,
                          end: 9999,
                          name: originalStep.name,
                        })
                        setVideoModalVisible(true)
                      }}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialIcons
                        name="play-circle-outline"
                        size={22}
                        color="#6200EE"
                      />
                    </TouchableOpacity>
                  ) : null
                })()}
                <TouchableOpacity
                  style={styles.editStepButton}
                  onPress={() => {
                    // Find the original step from availableSteps
                    const originalStep = availableSteps.find(
                      (s) => s.id === item.stepId
                    )
                    if (originalStep) {
                      router.push({
                        pathname: "/step-detail",
                        params: { step: JSON.stringify(originalStep) },
                      })
                    }
                  }}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="edit" size={22} color="#6200EE" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Expanded moves within the step */}
            {isExpanded && item.moves && item.moves.length > 0 && (
              <View style={styles.stepMovesInRoutine}>
                {item.moves.map((move, index) => (
                  <View key={index} style={styles.stepMoveItemInRoutine}>
                    <Text style={styles.stepMoveTextInRoutine}>
                      {move.counts && `${move.counts} - `}
                      {move.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Swipeable>
      )
    }

    // Regular move rendering
    const hasVideo = getMoveVideoData(item.name, routine?.danceStyle) !== null
    const categoryColor = getMoveCategoryColor(item.name, routine?.danceStyle)
    const backgroundColor =
      categoryColor === "transparent" ? "white" : categoryColor
    const hasEndingMove = item.hasEnding && item.endingMove
    const isExpanded = expandedMovesWithEndings[item.id]

    return (
      <Swipeable
        renderRightActions={renderRightActions(item)}
        overshootRight={false}
        friction={2}
      >
        <View style={{ backgroundColor: "white" }}>
          <View
            style={[
              styles.moveItem,
              isActive && styles.moveItemActive,
              { backgroundColor },
            ]}
          >
            {hasEndingMove && (
              <TouchableOpacity
                style={styles.expandIcon}
                onPress={() => {
                  setExpandedMovesWithEndings((prev) => ({
                    ...prev,
                    [item.id]: !prev[item.id],
                  }))
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={
                    isExpanded ? "keyboard-arrow-down" : "keyboard-arrow-right"
                  }
                  size={20}
                  color="#6200EE"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.moveItemLeft}
              onPress={() => handleMovePress(item)}
              onLongPress={drag}
              delayLongPress={150}
              activeOpacity={0.7}
            >
              {!hasEndingMove && (
                <MaterialIcons
                  name="drag-indicator"
                  size={20}
                  color="#999"
                  style={styles.dragIcon}
                />
              )}
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
                        const level = findMoveLevel(
                          item.name,
                          routine?.danceStyle
                        )
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
                {/* Facing Direction Display */}
                {(item.startFacing || item.endFacing) && (
                  <View style={styles.facingDirectionRow}>
                    <MaterialIcons name="navigation" size={12} color="#999" />
                    <Text style={styles.facingDirectionText}>
                      {item.startFacing || "?"} → {item.endFacing || "?"}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.moveItemActions}>
              {hasVideo && (
                <TouchableOpacity
                  style={styles.videoButton}
                  onPress={() => handleVideoPress(item, routine?.danceStyle)}
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

          {/* Expanded ending move */}
          {hasEndingMove && isExpanded && (
            <View style={styles.endingMoveContainer}>
              <View style={styles.endingMoveItem}>
                <MaterialIcons
                  name="subdirectory-arrow-right"
                  size={20}
                  color="#6200EE"
                  style={styles.endingMoveIcon}
                />
                <View style={styles.endingMoveTextContainer}>
                  {(() => {
                    const endingData = getMoveData(item.endingMove)
                    const displayName =
                      endingData?.displayName || item.endingMove
                    return (
                      <>
                        <Text style={styles.endingMoveName}>{displayName}</Text>
                        {endingData && typeof endingData === "object" && (
                          <>
                            {endingData.counts && (
                              <Text style={styles.endingMoveCounts}>
                                {endingData.counts} counts
                              </Text>
                            )}
                            {endingData.video && (
                              <TouchableOpacity
                                style={styles.endingVideoButton}
                                onPress={() => {
                                  setSelectedVideoMove({
                                    name: item.endingMove,
                                    video: endingData.video,
                                    start: endingData.start || 0,
                                    end: endingData.end || 10,
                                  })
                                  setVideoModalVisible(true)
                                }}
                                activeOpacity={0.6}
                                hitSlop={{
                                  top: 10,
                                  bottom: 10,
                                  left: 10,
                                  right: 10,
                                }}
                              >
                                <MaterialIcons
                                  name="play-circle-outline"
                                  size={20}
                                  color="#6200EE"
                                />
                              </TouchableOpacity>
                            )}
                          </>
                        )}
                      </>
                    )
                  })()}
                </View>
              </View>
            </View>
          )}
        </View>
      </Swipeable>
    )
  }

  const renderStepOption = (step) => {
    const isExpanded = expandedSteps[step.id]
    const moveCount = step.moves?.length || 0

    return (
      <View key={step.id}>
        {/* Step Header */}
        <View style={styles.stepOptionContainer}>
          <TouchableOpacity
            style={styles.stepOptionLeft}
            onPress={() => {
              setExpandedSteps((prev) => ({
                ...prev,
                [step.id]: !prev[step.id],
              }))
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isExpanded ? "keyboard-arrow-down" : "keyboard-arrow-right"}
              size={20}
              color="#666"
            />
            <Text style={styles.stepOptionText}>
              {step.name} ({moveCount} {moveCount === 1 ? "move" : "moves"})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addStepButton}
            onPress={() => handleAddStep(step)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={20} color="#6200EE" />
          </TouchableOpacity>
        </View>

        {/* Expanded Move List */}
        {isExpanded && step.moves && step.moves.length > 0 && (
          <View style={styles.stepMovesContainer}>
            {step.moves.map((move, index) => (
              <View key={index} style={styles.stepMoveItem}>
                <Text style={styles.stepMoveText}>
                  {move.counts && `${move.counts} - `}
                  {move.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderMoveOption = ({ item }) => {
    // Handle Paso Doble moves (objects with name, level, etc.)
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
            setSelectedEnding(null)
            setShowEndingDropdown(false)
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

    // Handle regular moves (strings)
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
          setSelectedEnding(null)
          setShowEndingDropdown(false)
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

  if (!routine) {
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
          <Text style={styles.headerTitle}>Edit Routine</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={generatePDF}>
              <MaterialIcons name="picture-as-pdf" size={24} color="#6200EE" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                loadMoves()
                loadSteps()
              }}
            >
              <MaterialIcons name="refresh" size={24} color="#6200EE" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.routineTitle}>{routine.name}</Text>
          {routine.description && routine.description.trim() !== "" && (
            <Text style={styles.routineDescription}>{routine.description}</Text>
          )}
          <Text style={styles.routineStyle}>
            {formatDanceName(routine.danceStyle)}
          </Text>
        </View>

        {moves.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No moves added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add moves to this routine
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

        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={30} color="white" />
        </TouchableOpacity>

        {/* Add Move Modal */}
        <AddMoveModal
          visible={modalVisible}
          onClose={handleCancel}
          onAddMove={handleMoveSubmit}
          onCreateMove={handleMoveSubmit}
          routine={routine}
          replacingMoveId={replacingMoveId}
        />

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
                          routine?.danceStyle
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
                        <View style={[styles.detailSection, { zIndex: 4 }]}>
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

                        {/* Ending Selection - only show if move has endings */}
                        {selectedMoveForDetail &&
                          hasEndings(selectedMoveForDetail.name) && (
                            <View style={[styles.detailSection, { zIndex: 2 }]}>
                              <Text style={styles.detailSectionTitle}>
                                Select Ending
                              </Text>
                              <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() =>
                                  setShowEditEndingDropdown(
                                    !showEditEndingDropdown
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.dropdownButtonText,
                                    !editingEnding && styles.placeholderText,
                                  ]}
                                >
                                  {editingEnding
                                    ? getDisplayName(editingEnding)
                                    : "Select ending"}
                                </Text>
                                <MaterialIcons
                                  name={
                                    showEditEndingDropdown
                                      ? "keyboard-arrow-up"
                                      : "keyboard-arrow-down"
                                  }
                                  size={24}
                                  color="#666"
                                />
                              </TouchableOpacity>

                              {showEditEndingDropdown && (
                                <View style={styles.dropdownContainer}>
                                  <ScrollView
                                    style={styles.dropdownList}
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled={true}
                                  >
                                    {getEndings(selectedMoveForDetail.name).map(
                                      (ending) => (
                                        <TouchableOpacity
                                          key={ending.name}
                                          style={[
                                            styles.moveOption,
                                            editingEnding === ending.name &&
                                              styles.selectedMoveOption,
                                          ]}
                                          onPress={() => {
                                            setEditingEnding(ending.name)
                                            setShowEditEndingDropdown(false)
                                          }}
                                        >
                                          <Text
                                            style={[
                                              styles.moveOptionText,
                                              editingEnding === ending.name &&
                                                styles.selectedMoveOptionText,
                                            ]}
                                          >
                                            {ending.displayName || ending.name}
                                          </Text>
                                        </TouchableOpacity>
                                      )
                                    )}
                                  </ScrollView>
                                </View>
                              )}
                            </View>
                          )}

                        {/* Rotation Section */}
                        {selectedMoveForDetail?.rotation !== undefined && (
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>
                              Rotation
                            </Text>
                            <View style={styles.rotationDisplay}>
                              <MaterialIcons
                                name="rotate-right"
                                size={20}
                                color="#6200EE"
                              />
                              <Text style={styles.rotationDisplayText}>
                                {formatRotation(selectedMoveForDetail.rotation)}
                              </Text>
                            </View>
                          </View>
                        )}

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

                        {/* Only show timing dropdown if move has variable timing with multiple options */}
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
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
  routineTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  routineDescription: {
    fontSize: 15,
    color: "#555",
    marginBottom: 8,
    lineHeight: 22,
    fontStyle: "italic",
  },
  routineStyle: {
    fontSize: 16,
    color: "#666",
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
  facingDirectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  facingDirectionText: {
    fontSize: 11,
    color: "#999",
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
  editStepButton: {
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
  tabContainer: {
    flexDirection: "row",
    marginBottom: 25,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#6200EE",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "white",
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
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#6200EE",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#333",
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
  dropdownListScroll: {
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
  categoryContainer: {
    marginBottom: 8,
  },
  categoryHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6200EE",
    backgroundColor: "#f0f0f0",
    padding: 8,
    marginBottom: 4,
    textAlign: "center",
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
  createMoveButton: {
    flex: 1,
    padding: 12,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    alignItems: "center",
  },
  createMoveButtonText: {
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
  detailSectionText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
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
  },
  detailDuplicateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF9800",
    backgroundColor: "#FFF3E0",
    alignItems: "center",
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
  },
  dropdownSectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6200EE",
    backgroundColor: "#f0f0f0",
    padding: 8,
    marginTop: 4,
  },
  moveLevelHeader: {
    backgroundColor: "#f0e7ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d4f7",
  },
  moveLevelHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6200EE",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  dropdownDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  stepOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stepOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stepOptionText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  addStepButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0e7ff",
  },
  stepMovesContainer: {
    backgroundColor: "#f9f9f9",
    paddingLeft: 40,
  },
  stepMoveItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  stepMoveText: {
    fontSize: 14,
    color: "#666",
  },
  stepInRoutineLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stepNameInRoutine: {
    color: "#6200EE",
    fontWeight: "600",
  },
  stepMoveCount: {
    fontSize: 14,
    color: "#999",
    marginLeft: 8,
  },
  stepMovesInRoutine: {
    backgroundColor: "white",
    paddingLeft: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  stepMoveItemInRoutine: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  stepMoveTextInRoutine: {
    fontSize: 14,
    color: "#666",
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
  rotationSliderContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  rotationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6200EE",
    textAlign: "center",
    marginBottom: 12,
  },
  rotationSlider: {
    width: "100%",
    height: 40,
  },
  rotationRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  rotationRangeText: {
    fontSize: 12,
    color: "#666",
  },
  rotationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0e7ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
  },
  rotationDisplayText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6200EE",
  },
  expandIcon: {
    padding: 8,
    marginRight: 4,
  },
  endingMoveContainer: {
    backgroundColor: "white",
    paddingLeft: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  endingMoveItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  endingMoveIcon: {
    marginRight: 8,
  },
  endingMoveTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  endingMoveName: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  endingMoveCounts: {
    fontSize: 12,
    color: "#999",
  },
  endingVideoButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#f0e7ff",
  },
  swipeActionsContainer: {
    flexDirection: "row",
    height: "100%",
  },
  swipeReplaceButton: {
    backgroundColor: "#6200EE",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: "100%",
    flexDirection: "column",
    gap: 4,
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
  swipeActionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
})

export default RoutineDetailScreen
