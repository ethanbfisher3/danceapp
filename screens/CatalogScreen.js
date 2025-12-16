import { MaterialIcons } from "@expo/vector-icons"
import { Asset } from "expo-asset"
import * as VideoThumbnails from "expo-video-thumbnails"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
  getAllMoveCategories,
  getMoveKey,
} from "../utils/moveCategories"

const CatalogScreen = () => {
  const [activeTab, setActiveTab] = useState("moves")
  const [selectedDanceStyle, setSelectedDanceStyle] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDanceStyleDropdown, setShowDanceStyleDropdown] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  // Hidden moves persistence
  const [hiddenMoves, setHiddenMoves] = useState({})
  const [showHiddenMoves, setShowHiddenMoves] = useState(false)
  // Favorite moves persistence
  const [favoriteMoves, setFavoriteMoves] = useState({})
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [selectedVideoMove, setSelectedVideoMove] = useState(null)
  const [moveCategories, setMoveCategories] = useState({})
  const [videoThumbnails, setVideoThumbnails] = useState({})
  const [loadingThumbnails, setLoadingThumbnails] = useState({})

  // Helper functions
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
  const hiddenMovesFile = `${getDocumentDirectory()}hidden_moves.json`
  const favoriteMovesFile = `${getDocumentDirectory()}favorite_moves.json`
  const makeMoveKey = (danceStyle, level, name) =>
    `${danceStyle}||${level}||${name}`
  const isMoveHidden = (move) =>
    !!hiddenMoves[makeMoveKey(move.danceStyle, move.level, move.name)]
  const isMoveFavorite = (move) =>
    !!favoriteMoves[makeMoveKey(move.danceStyle, move.level, move.name)]
  const loadHiddenMoves = async () => {
    try {
      const {
        getInfoAsync,
        readAsStringAsync,
      } = require("expo-file-system/legacy")
      const fileInfo = await getInfoAsync(hiddenMovesFile)
      if (!fileInfo.exists) {
        setHiddenMoves({})
        return
      }
      const contents = await readAsStringAsync(hiddenMovesFile)
      const parsed = JSON.parse(contents || "{}")
      setHiddenMoves(parsed && typeof parsed === "object" ? parsed : {})
    } catch (e) {
      // File doesn't exist or other error - use empty object
      setHiddenMoves({})
    }
  }
  const saveHiddenMoves = async (next) => {
    try {
      const content = JSON.stringify(next, null, 2)
      const { writeAsStringAsync } = require("expo-file-system/legacy")
      await writeAsStringAsync(hiddenMovesFile, content)
    } catch (e) {
      console.log("Failed to save hidden moves:", e)
    }
  }
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
  const saveFavoriteMoves = async (next) => {
    try {
      const content = JSON.stringify(next, null, 2)
      const { writeAsStringAsync } = require("expo-file-system/legacy")
      await writeAsStringAsync(favoriteMovesFile, content)
    } catch (e) {
      console.log("Failed to save favorite moves:", e)
    }
  }

  // Load move categories and custom videos when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      const categories = await getAllMoveCategories()
      setMoveCategories(categories)
    }
    loadCategories()
    loadHiddenMoves()
    loadFavoriteMoves()
  }, [])

  // Generate thumbnail for a video
  const generateThumbnail = async (videoSource, videoKey) => {
    if (videoThumbnails[videoKey] || loadingThumbnails[videoKey]) {
      return // Already loaded or loading
    }

    setLoadingThumbnails((prev) => ({ ...prev, [videoKey]: true }))

    try {
      let videoUri = videoSource

      // If videoSource is a require() result (number), resolve it to a URI
      if (typeof videoSource === "number") {
        const asset = Asset.fromModule(videoSource)
        await asset.downloadAsync()
        videoUri = asset.localUri || asset.uri
      }

      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000, // Get thumbnail at 1 second
      })

      setVideoThumbnails((prev) => ({ ...prev, [videoKey]: uri }))
    } catch (error) {
      console.log("Error generating thumbnail:", error)
    } finally {
      setLoadingThumbnails((prev) => ({ ...prev, [videoKey]: false }))
    }
  }

  // Load thumbnails for visible videos
  useEffect(() => {
    if (activeTab === "videos" && filteredVideos.length > 0) {
      // Load thumbnails for first few videos asynchronously
      filteredVideos.slice(0, 10).forEach((video, index) => {
        const videoKey = video.video.toString()
        setTimeout(() => {
          generateThumbnail(video.video, videoKey)
        }, index * 100) // Stagger the requests
      })
    }
  }, [activeTab, filteredVideos])

  // Get all moves with their dance style and level
  const allMoves = useMemo(() => {
    const moves = []
    Object.entries(DANCE_MOVES).forEach(([danceStyle, levels]) => {
      if (levels && typeof levels === "object") {
        Object.entries(levels).forEach(([level, movesArray]) => {
          if (Array.isArray(movesArray)) {
            movesArray.forEach((move) => {
              if (move && move.name) {
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

  // Get all unique videos with their metadata
  const allVideos = useMemo(() => {
    const videosMap = new Map()

    // Add built-in videos
    Object.entries(DANCE_MOVES).forEach(([danceStyle, levels]) => {
      if (levels && typeof levels === "object") {
        Object.entries(levels).forEach(([level, movesArray]) => {
          if (Array.isArray(movesArray)) {
            movesArray.forEach((move) => {
              if (
                move &&
                move.video &&
                move.start !== undefined &&
                move.end !== undefined
              ) {
                // Use video source as unique key
                const videoKey = move.video.toString()
                if (!videosMap.has(videoKey)) {
                  // Format video name as "{Dance Style} - {Level}"
                  const formattedDanceStyle = formatDanceName(danceStyle)
                  const formattedLevel = formatLevel(level)
                  const videoName = `${formattedDanceStyle} - ${formattedLevel}`

                  videosMap.set(videoKey, {
                    video: move.video,
                    danceStyle,
                    level,
                    name: videoName,
                    movesCount: 1,
                    isCustom: false,
                  })
                } else {
                  videosMap.get(videoKey).movesCount++
                }
              }
            })
          }
        })
      }
    })

    // Add all videos from the videos folder
    const addVideosFromFolder = () => {
      const videoFiles = [
        // American Rhythm
        {
          path: require("../data/videos/american_rhythm/american_bronze_rhythm.mp4"),
          name: "American Bronze Rhythm",
        },
        {
          path: require("../data/videos/american_rhythm/american_silver_rhythm.mp4"),
          name: "American Silver Rhythm",
        },
        {
          path: require("../data/videos/american_rhythm/american_gold_rhythm.mp4"),
          name: "American Gold Rhythm",
        },

        // American Smooth - Foxtrot
        {
          path: require("../data/videos/american_smooth/foxtrot/american_bronze_foxtrot.mp4"),
          name: "American Bronze Foxtrot",
        },
        {
          path: require("../data/videos/american_smooth/foxtrot/american_silver_foxtrot.mp4"),
          name: "American Silver Foxtrot",
        },
        {
          path: require("../data/videos/american_smooth/foxtrot/american_gold_foxtrot.mp4"),
          name: "American Gold Foxtrot",
        },

        // American Smooth - Tango
        {
          path: require("../data/videos/american_smooth/tango/american_bronze_tango.mp4"),
          name: "American Bronze Tango",
        },
        {
          path: require("../data/videos/american_smooth/tango/american_silver_tango.mp4"),
          name: "American Silver Tango",
        },
        {
          path: require("../data/videos/american_smooth/tango/american_gold_tango.mp4"),
          name: "American Gold Tango",
        },

        // American Smooth - Viennese Waltz
        {
          path: require("../data/videos/american_smooth/viennese_waltz/american_bronze_viennese_waltz.mp4"),
          name: "American Bronze Viennese Waltz",
        },
        {
          path: require("../data/videos/american_smooth/viennese_waltz/american_silver_viennese_waltz.mp4"),
          name: "American Silver Viennese Waltz",
        },
        {
          path: require("../data/videos/american_smooth/viennese_waltz/american_gold_viennese_waltz.mp4"),
          name: "American Gold Viennese Waltz",
        },

        // American Smooth - Waltz
        {
          path: require("../data/videos/american_smooth/waltz/american_bronze_waltz.mp4"),
          name: "American Bronze Waltz",
        },
        {
          path: require("../data/videos/american_smooth/waltz/american_silver_waltz.mp4"),
          name: "American Silver Waltz",
        },
        {
          path: require("../data/videos/american_smooth/waltz/american_gold_waltz.mp4"),
          name: "American Gold Waltz",
        },

        // International Ballroom - Foxtrot
        {
          path: require("../data/videos/international_ballroom/foxtrot/international_bronze_foxtrot.mp4"),
          name: "International Bronze Foxtrot",
        },
        {
          path: require("../data/videos/international_ballroom/foxtrot/international_silver_foxtrot.mp4"),
          name: "International Silver Foxtrot",
        },
        {
          path: require("../data/videos/international_ballroom/foxtrot/international_gold_foxtrot.mp4"),
          name: "International Gold Foxtrot",
        },

        // International Ballroom - Quickstep
        {
          path: require("../data/videos/international_ballroom/quickstep/international_bronze_quickstep.mp4"),
          name: "International Bronze Quickstep",
        },
        {
          path: require("../data/videos/international_ballroom/quickstep/international_silver_quickstep.mp4"),
          name: "International Silver Quickstep",
        },
        {
          path: require("../data/videos/international_ballroom/quickstep/international_gold_quickstep.mp4"),
          name: "International Gold Quickstep",
        },

        // International Ballroom - Tango
        {
          path: require("../data/videos/international_ballroom/tango/international_bronze_tango.mp4"),
          name: "International Bronze Tango",
        },
        {
          path: require("../data/videos/international_ballroom/tango/international_silver_tango.mp4"),
          name: "International Silver Tango",
        },
        {
          path: require("../data/videos/international_ballroom/tango/international_gold_tango.mp4"),
          name: "International Gold Tango",
        },

        // International Ballroom - Viennese Waltz
        {
          path: require("../data/videos/international_ballroom/viennese_waltz/international_bronze_viennese_waltz.mp4"),
          name: "International Bronze Viennese Waltz",
        },
        {
          path: require("../data/videos/international_ballroom/viennese_waltz/international_silver_viennese_waltz.mp4"),
          name: "International Silver Viennese Waltz",
        },
        {
          path: require("../data/videos/international_ballroom/viennese_waltz/international_gold_viennese_waltz.mp4"),
          name: "International Gold Viennese Waltz",
        },

        // International Ballroom - Waltz
        {
          path: require("../data/videos/international_ballroom/waltz/international_bronze_waltz.mp4"),
          name: "International Bronze Waltz",
        },
        {
          path: require("../data/videos/international_ballroom/waltz/international_silver_waltz.mp4"),
          name: "International Silver Waltz",
        },
        {
          path: require("../data/videos/international_ballroom/waltz/international_gold_waltz.mp4"),
          name: "International Gold Waltz",
        },

        // International Latin - Cha Cha
        {
          path: require("../data/videos/international_latin/cha_cha/international_bronze_cha_cha.mp4"),
          name: "International Bronze Cha Cha",
        },
        {
          path: require("../data/videos/international_latin/cha_cha/international_gold_cha_cha.mp4"),
          name: "International Gold Cha Cha",
        },
        {
          path: require("../data/videos/international_latin/cha_cha/international_silver_cha_cha.mp4"),
          name: "International Silver Cha Cha",
        },

        // International Latin - Jive
        {
          path: require("../data/videos/international_latin/jive/international_bronze_jive.mp4"),
          name: "International Bronze Jive",
        },
        {
          path: require("../data/videos/international_latin/jive/international_gold_jive.mp4"),
          name: "International Gold Jive",
        },
        {
          path: require("../data/videos/international_latin/jive/international_silver_jive.mp4"),
          name: "International Silver Jive",
        },

        // International Latin - Paso Doble
        {
          path: require("../data/videos/international_latin/paso_doble/international_bronze_paso_doble.mp4"),
          name: "International Bronze Paso Doble",
        },
        {
          path: require("../data/videos/international_latin/paso_doble/international_silver_paso_doble.mp4"),
          name: "International Silver Paso Doble",
        },
        {
          path: require("../data/videos/international_latin/paso_doble/international_gold_paso_doble.mp4"),
          name: "International Gold Paso Doble",
        },

        // International Latin - Rumba
        {
          path: require("../data/videos/international_latin/rumba/international_bronze_rumba.mp4"),
          name: "International Bronze Rumba",
        },
        {
          path: require("../data/videos/international_latin/rumba/international_silver_rumba.mp4"),
          name: "International Silver Rumba",
        },
        {
          path: require("../data/videos/international_latin/rumba/international_gold_rumba.mp4"),
          name: "International Gold Rumba",
        },

        // International Latin - Samba
        {
          path: require("../data/videos/international_latin/samba/international_bronze_samba.mp4"),
          name: "International Bronze Samba",
        },
        {
          path: require("../data/videos/international_latin/samba/international_gold_samba.mp4"),
          name: "International Gold Samba",
        },
        {
          path: require("../data/videos/international_latin/samba/international_silver_samba.mp4"),
          name: "International Silver Samba",
        },
      ]

      videoFiles.forEach(({ path, name }) => {
        const videoKey = path.toString()
        if (!videosMap.has(videoKey)) {
          // Extract dance style and level from the name
          let danceStyle = "other"
          let level = "other"

          if (name.includes("American")) {
            if (name.includes("Rhythm")) danceStyle = "american_rhythm"
            else if (name.includes("Foxtrot")) danceStyle = "american_foxtrot"
            else if (name.includes("Tango")) danceStyle = "american_tango"
            else if (name.includes("Viennese Waltz"))
              danceStyle = "american_viennese_waltz"
            else if (name.includes("Waltz")) danceStyle = "american_waltz"
          } else if (name.includes("International")) {
            if (name.includes("Foxtrot")) danceStyle = "international_foxtrot"
            else if (name.includes("Quickstep")) danceStyle = "quickstep"
            else if (name.includes("Tango")) danceStyle = "international_tango"
            else if (name.includes("Viennese Waltz"))
              danceStyle = "international_viennese_waltz"
            else if (name.includes("Waltz")) danceStyle = "international_waltz"
            else if (name.includes("Cha Cha"))
              danceStyle = "international_cha_cha"
            else if (name.includes("Jive")) danceStyle = "jive"
            else if (name.includes("Paso Doble")) danceStyle = "paso_doble"
            else if (name.includes("Rumba")) danceStyle = "international_rumba"
            else if (name.includes("Samba")) danceStyle = "samba"
          }

          if (name.includes("Bronze")) level = "bronze"
          else if (name.includes("Silver")) level = "silver"
          else if (name.includes("Gold")) level = "gold"

          videosMap.set(videoKey, {
            video: path,
            danceStyle,
            level,
            name,
            movesCount: 1,
            isCustom: false,
          })
        }
      })
    }

    // Add all videos from the videos folder
    addVideosFromFolder()

    const videos = Array.from(videosMap.values())
    return videos
  }, [])

  // Filter moves based on selected filters and search query
  const filteredMoves = useMemo(() => {
    let filtered = [...allMoves] // Create a new array to avoid mutation

    // Filter by dance style
    if (selectedDanceStyle !== "all") {
      // Convert selected style to match DANCE_MOVES key format (spaces to underscores)
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

    // Remove hidden moves (unless showHiddenMoves is true)
    if (!showHiddenMoves) {
      filtered = filtered.filter((m) => !isMoveHidden(m))
    }

    // Sort by dance style, then level, then name
    return filtered.sort((a, b) => {
      // Handle undefined danceStyle
      const styleA = a.danceStyle || ""
      const styleB = b.danceStyle || ""
      if (styleA !== styleB) {
        return styleA.localeCompare(styleB)
      }
      // Handle level sorting
      const levelOrder = { bronze: 0, silver: 1, gold: 2, other: 3 }
      const levelA =
        levelOrder[a.level] !== undefined ? levelOrder[a.level] : 999
      const levelB =
        levelOrder[b.level] !== undefined ? levelOrder[b.level] : 999
      if (levelA !== levelB) {
        return levelA - levelB
      }
      // Handle undefined name
      const nameA = a.name || ""
      const nameB = b.name || ""
      return nameA.localeCompare(nameB)
    })
  }, [allMoves, selectedDanceStyle, selectedLevel, searchQuery])

  // Filter videos based on selected filters and search query
  const filteredVideos = useMemo(() => {
    let filtered = [...allVideos]

    // Filter by dance style
    if (selectedDanceStyle !== "all") {
      const selectedStyleKey = selectedDanceStyle
        .toLowerCase()
        .replace(/\s+/g, "_")
      filtered = filtered.filter(
        (video) => video.danceStyle === selectedStyleKey
      )
    }

    // Filter by level
    if (selectedLevel !== "all") {
      filtered = filtered.filter((video) => video.level === selectedLevel)
    }

    // Filter by search query
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery.length > 0) {
      const query = trimmedQuery.toLowerCase()
      filtered = filtered.filter((video) => {
        const videoName = video.name || ""
        return videoName.toLowerCase().includes(query)
      })
    }

    // Sort by dance style, then level, then name
    return filtered.sort((a, b) => {
      const styleA = a.danceStyle || ""
      const styleB = b.danceStyle || ""
      if (styleA !== styleB) {
        return styleA.localeCompare(styleB)
      }
      const levelOrder = { bronze: 0, silver: 1, gold: 2, other: 3 }
      const levelA =
        levelOrder[a.level] !== undefined ? levelOrder[a.level] : 999
      const levelB =
        levelOrder[b.level] !== undefined ? levelOrder[b.level] : 999
      if (levelA !== levelB) {
        return levelA - levelB
      }
      const nameA = a.name || ""
      const nameB = b.name || ""
      return nameA.localeCompare(nameB)
    })
  }, [allVideos, selectedDanceStyle, selectedLevel, searchQuery])

  const getDanceStyleSections = () => {
    return Object.entries(DANCE_STYLE_CATEGORIES).map(([category, styles]) => ({
      title: category,
      data: styles,
    }))
  }

  const handleVideoPress = (move) => {
    if (move.video && move.start !== undefined && move.end !== undefined) {
      setSelectedVideoMove({
        video: move.video,
        start: move.start,
        end: move.end,
        moveName: move.name,
      })
      setVideoModalVisible(true)
    }
  }

  const handleVideoItemPress = (videoItem) => {
    // For built-in videos, use the video player modal
    setSelectedVideoMove({
      video: videoItem.video,
      start: 0,
      end: 9999, // Play full video (set to very large number)
      moveName: videoItem.name,
      isCustomVideo: false,
      customVideoId: null,
    })
    setVideoModalVisible(true)
  }

  const confirmHideMove = (move) => {
    const isHidden = isMoveHidden(move)

    if (isHidden) {
      // Show the move
      Alert.alert(
        "Show Move",
        `Show "${move.name}" from ${formatDanceName(
          move.danceStyle
        )} (${formatLevel(move.level)})?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Show",
            onPress: async () => {
              const key = makeMoveKey(move.danceStyle, move.level, move.name)
              const next = { ...hiddenMoves }
              delete next[key]
              setHiddenMoves(next)
              await saveHiddenMoves(next)
            },
          },
        ]
      )
    } else {
      // Hide the move
      Alert.alert(
        "Hide Move",
        `Hide "${move.name}" from ${formatDanceName(
          move.danceStyle
        )} (${formatLevel(move.level)})?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Hide",
            onPress: async () => {
              const key = makeMoveKey(move.danceStyle, move.level, move.name)
              const next = { ...hiddenMoves, [key]: true }
              setHiddenMoves(next)
              await saveHiddenMoves(next)
            },
          },
        ]
      )
    }
  }

  const confirmToggleFavorite = async (move) => {
    const isFavorite = isMoveFavorite(move)
    const key = makeMoveKey(move.danceStyle, move.level, move.name)

    if (isFavorite) {
      // Remove from favorites
      const next = { ...favoriteMoves }
      delete next[key]
      setFavoriteMoves(next)
      await saveFavoriteMoves(next)
    } else {
      // Add to favorites
      const next = { ...favoriteMoves, [key]: true }
      setFavoriteMoves(next)
      await saveFavoriteMoves(next)
    }
  }

  const handleAddVideo = () => {
    Alert.alert(
      "Feature Disabled",
      "Custom video uploads are currently disabled."
    )
  }

  const renderMoveItem = ({ item, index }) => {
    const hasVideo =
      item.video && item.start !== undefined && item.end !== undefined

    // Get category color for this move
    const categoryKey = getMoveKey(item.danceStyle, item.level, item.name)
    const category = moveCategories[categoryKey]
    const backgroundColor = category ? CATEGORY_COLORS[category] : "white"

    return (
      <View style={[styles.moveCard, { backgroundColor }]}>
        <View style={styles.moveHeader}>
          <View style={styles.moveHeaderLeft}>
            <Text style={styles.moveName}>{item.name}</Text>
            <View style={styles.moveMetaRow}>
              <Text style={styles.moveMetaText}>
                {formatLevel(item.level)} {formatDanceName(item.danceStyle)}
              </Text>
            </View>
          </View>
          <View style={styles.moveHeaderRight}>
            {hasVideo && (
              <TouchableOpacity
                onPress={() => {
                  handleVideoPress(item)
                }}
                style={styles.videoButton}
              >
                <MaterialIcons
                  name="play-circle-outline"
                  size={28}
                  color="#6200EE"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => confirmToggleFavorite(item)}
              style={styles.favoriteButton}
              accessibilityLabel={
                isMoveFavorite(item)
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name={isMoveFavorite(item) ? "star" : "star-border"}
                size={28}
                color={isMoveFavorite(item) ? "#FFD700" : "#CCC"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmHideMove(item)}
              style={styles.hideButton}
              accessibilityLabel={
                isMoveHidden(item) ? "Show move" : "Hide move"
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name={isMoveHidden(item) ? "visibility" : "visibility-off"}
                size={28}
                color={isMoveHidden(item) ? "#4CAF50" : "#FF9800"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const renderVideoItem = ({ item, index }) => {
    const videoKey = item.video.toString()
    const thumbnail = videoThumbnails[videoKey]
    const isLoading = loadingThumbnails[videoKey]

    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => handleVideoItemPress(item)}
      >
        <View style={styles.videoThumbnail}>
          {thumbnail ? (
            <>
              <Image
                source={{ uri: thumbnail }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <MaterialIcons
                  name="play-circle-filled"
                  size={48}
                  color="rgba(98, 0, 238, 0.9)"
                />
              </View>
            </>
          ) : isLoading ? (
            <ActivityIndicator size="large" color="#6200EE" />
          ) : (
            <MaterialIcons
              name="play-circle-filled"
              size={48}
              color="#6200EE"
            />
          )}
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.videoName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.videoMetaRow}>
            <Text style={styles.videoMetaText}>
              {`${item.movesCount} move${item.movesCount !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
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

        {/* Checkbox Row */}
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setShowHiddenMoves(!showHiddenMoves)}
          >
            <MaterialIcons
              name={showHiddenMoves ? "check-box" : "check-box-outline-blank"}
              size={20}
              //color="#6200EE"
            />
            <Text style={styles.checkboxLabel}>Show hidden moves</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <MaterialIcons
              name={showOnlyFavorites ? "check-box" : "check-box-outline-blank"}
              size={20}
              //color="#FFD700"
            />
            <Text style={styles.checkboxLabel}>Show only favorites</Text>
          </TouchableOpacity>
        </View>

        {/* Dance Style Dropdown Menu */}
        {showDanceStyleDropdown && (
          <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedDanceStyle("all")
                setShowDanceStyleDropdown(false)
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
                  <Text style={styles.sectionHeaderText}>{section.title}</Text>
                </View>
                {section.data.map((item, index) => (
                  <TouchableOpacity
                    key={item + index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDanceStyle(item)
                      setShowDanceStyleDropdown(false)
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
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {activeTab === "moves" ? (
          <FlatList
            data={filteredMoves}
            keyExtractor={(item, index) =>
              `${item.danceStyle}-${item.level}-${item.name}-${index}`
            }
            renderItem={renderMoveItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>No moves found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your filters or search query
                </Text>
              </View>
            }
          />
        ) : (
          <View style={styles.videoContainer}>
            <FlatList
              data={filteredVideos}
              keyExtractor={(item, index) =>
                `${item.danceStyle}-${item.level}-${item.name}-${index}`
              }
              renderItem={renderVideoItem}
              contentContainerStyle={styles.videoListContent}
              numColumns={2}
              key={"video-list-2-columns"}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons name="videocam-off" size={64} color="#ccc" />
                  <Text style={styles.emptyStateText}>No videos found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try adjusting your filters or search query
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "moves" && styles.activeTab]}
          onPress={() => setActiveTab("moves")}
        >
          <MaterialIcons
            name="list"
            size={24}
            color={activeTab === "moves" ? "#6200EE" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "moves" && styles.activeTabText,
            ]}
          >
            Moves
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "videos" && styles.activeTab]}
          onPress={() => setActiveTab("videos")}
        >
          <MaterialIcons
            name="video-library"
            size={24}
            color={activeTab === "videos" ? "#6200EE" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "videos" && styles.activeTabText,
            ]}
          >
            Videos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={videoModalVisible}
        onClose={() => {
          setVideoModalVisible(false)
          setSelectedVideoMove(null)
        }}
        videoSource={selectedVideoMove?.video}
        start={selectedVideoMove?.start}
        end={selectedVideoMove?.end}
        moveName={selectedVideoMove?.moveName}
        isCustomVideo={false}
        customVideoId={null}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    flex: 1,
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
  listContent: {
    padding: 16,
  },
  videoListContent: {
    padding: 8,
  },
  moveCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  moveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  moveHeaderLeft: {
    flex: 1,
  },
  moveHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moveName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  moveMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  moveMetaText: {
    fontSize: 13,
    color: "#666",
  },
  moveDivider: {
    fontSize: 13,
    color: "#ccc",
    marginHorizontal: 6,
  },
  videoButton: {
    padding: 4,
  },
  moveDetails: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 16,
    paddingTop: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6200EE",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: "#6200EE",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  activeTabText: {
    color: "#6200EE",
    fontWeight: "600",
  },
  videoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    margin: 8,
    flex: 1,
    maxWidth: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  videoThumbnail: {
    height: 120,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  playOverlay: {
    position: "absolute",
    zIndex: 1,
  },
  videoInfo: {
    padding: 12,
  },
  videoName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  videoMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  videoMetaText: {
    fontSize: 11,
    color: "#666",
  },
  videoContainer: {
    flex: 1,
  },
  addVideoButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 8,
  },
  addVideoButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  customVideoThumbnail: {
    height: 120,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  customVideoText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 15,
    maxHeight: "80%",
    width: "100%",
    maxWidth: 500,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6.27,
    zIndex: 10000,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  dropdownInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6200EE",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6200EE",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#6200EE",
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  youtubeThumbnail: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 20,
  },
  youtubeText: {
    fontSize: 12,
    color: "#FF0000",
    fontWeight: "bold",
    marginTop: 4,
  },
  timestampInfo: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  timestampInfoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  checkboxRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    justifyContent: "space-between",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 12,
    color: "#333",
    marginLeft: 6,
    fontWeight: "500",
  },
  hideButton: {
    padding: 4,
    borderRadius: 4,
  },
})

export default CatalogScreen
