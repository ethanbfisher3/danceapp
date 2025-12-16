import { MaterialIcons } from "@expo/vector-icons"
import Slider from "@react-native-community/slider"
import { VideoView, useVideoPlayer } from "expo-video"
import { useEffect, useRef, useState } from "react"
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"

const VideoPlayerModal = ({
  visible,
  onClose,
  videoSource,
  start,
  end,
  moveName,
  isCustomVideo = false,
  onDeleteCustomVideo,
  customVideoId,
  onAddTimestamp,
  videoTimestamps = [],
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [currentTime, setCurrentTime] = useState(start)
  const [videoDuration, setVideoDuration] = useState(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const intervalRef = useRef(null)
  const isMountedRef = useRef(true)

  // Create video player instance
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false
    player.muted = false
    player.volume = 1.0
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Reset currentTime when video changes
  useEffect(() => {
    setCurrentTime(start)
    setVideoDuration(null)
    setHasError(false)
    setErrorMessage("")
  }, [start, end])

  // Get video duration
  useEffect(() => {
    const checkDuration = setInterval(() => {
      if (player && player.duration > 0 && !videoDuration) {
        setVideoDuration(player.duration)
        clearInterval(checkDuration)
      }
    }, 100)

    return () => clearInterval(checkDuration)
  }, [player, videoDuration])

  useEffect(() => {
    if (!visible) {
      // Clean up when modal closes
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (player && isMountedRef.current) {
        try {
          player.pause()
          player.muted = false
        } catch (error) {
          // Player might already be paused
        }
      }
      setIsPlaying(false)
      setHasEnded(false)
      setIsMuted(false)
      setHasError(false)
      setErrorMessage("")
      return
    }

    if (visible && player && isMountedRef.current) {
      try {
        // Wait a bit for video to be ready
        setTimeout(() => {
          if (!isMountedRef.current || !player) return

          try {
            // Start playing from the start position
            player.currentTime = start
            player.play()

            if (isMountedRef.current) {
              setIsPlaying(true)
              setHasEnded(false)
              setHasError(false)
              setErrorMessage("")
            }

            // Get video duration
            if (player.duration > 0 && !videoDuration) {
              setVideoDuration(player.duration)
            }

            // Set up interval to check video position
            intervalRef.current = setInterval(() => {
              if (player && isMountedRef.current) {
                try {
                  // Always update current time display (unless actively seeking)
                  if (!isSeeking) {
                    setCurrentTime(player.currentTime)
                  }

                  // Only check for end condition when not seeking
                  if (!isSeeking) {
                    // Calculate effective end (use video duration if end is very large)
                    const actualEnd =
                      player.duration > 0 && end > player.duration
                        ? player.duration
                        : end

                    if (player.currentTime >= actualEnd) {
                      // Stop and reset when we reach the end time
                      player.pause()
                      player.currentTime = start
                      if (isMountedRef.current) {
                        setIsPlaying(false)
                        setHasEnded(true)
                        setCurrentTime(start)
                      }
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current)
                        intervalRef.current = null
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error in video interval:", error)
                  setHasError(true)
                  setErrorMessage("Video playback error")
                }
              }
            }, 100)
          } catch (error) {
            console.error("Error starting video:", error)
            setHasError(true)
            setErrorMessage("Failed to start video playback")
            setIsPlaying(false)
            setHasEnded(true)
          }
        }, 100)
      } catch (error) {
        console.error("Error setting up video:", error)
        setHasError(true)
        setErrorMessage("Video initialization error")
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (player && isMountedRef.current) {
        try {
          player.pause()
        } catch (error) {
          // Ignore
        }
      }
    }
  }, [visible, start, end, player])

  const handlePlayPause = () => {
    if (!player) return

    try {
      if (isPlaying) {
        player.pause()
        setIsPlaying(false)
      } else {
        // If video has ended, restart from beginning
        if (hasEnded) {
          player.currentTime = start
          setHasEnded(false)
        }
        player.play()
        setIsPlaying(true)
        setHasError(false)
        setErrorMessage("")

        // Restart interval if needed
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            if (player && isMountedRef.current) {
              try {
                // Always update current time display (unless actively seeking)
                if (!isSeeking) {
                  setCurrentTime(player.currentTime)
                }

                // Only check for end condition when not seeking
                if (!isSeeking) {
                  const actualEnd =
                    player.duration > 0 && end > player.duration
                      ? player.duration
                      : end

                  if (player.currentTime >= actualEnd) {
                    player.pause()
                    player.currentTime = start
                    if (isMountedRef.current) {
                      setIsPlaying(false)
                      setHasEnded(true)
                      setCurrentTime(start)
                    }
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current)
                      intervalRef.current = null
                    }
                  }
                }
              } catch (error) {
                console.error("Error in play/pause interval:", error)
                setHasError(true)
                setErrorMessage("Video playback error")
              }
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error("Error in play/pause:", error)
      setHasError(true)
      setErrorMessage("Failed to control video playback")
    }
  }

  const handleReplay = () => {
    if (!player) return

    try {
      player.currentTime = start
      player.play()
      setIsPlaying(true)
      setHasEnded(false)
      setHasError(false)
      setErrorMessage("")

      // Restart interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      intervalRef.current = setInterval(() => {
        if (player && isMountedRef.current) {
          try {
            // Always update current time display (unless actively seeking)
            if (!isSeeking) {
              setCurrentTime(player.currentTime)
            }

            // Only check for end condition when not seeking
            if (!isSeeking) {
              const actualEnd =
                player.duration > 0 && end > player.duration
                  ? player.duration
                  : end

              if (player.currentTime >= actualEnd) {
                player.pause()
                player.currentTime = start
                if (isMountedRef.current) {
                  setIsPlaying(false)
                  setHasEnded(true)
                  setCurrentTime(start)
                }
                if (intervalRef.current) {
                  clearInterval(intervalRef.current)
                  intervalRef.current = null
                }
              }
            }
          } catch (error) {
            console.error("Error in replay interval:", error)
            setHasError(true)
            setErrorMessage("Video playback error")
          }
        }
      }, 100)
    } catch (error) {
      console.error("Error in replay:", error)
      setHasError(true)
      setErrorMessage("Failed to replay video")
    }
  }

  const handleSliderChange = (value) => {
    if (!player) return
    setIsSeeking(true)
    setCurrentTime(value)
  }

  const handleSliderComplete = (value) => {
    if (!player) return

    try {
      player.currentTime = value
      setCurrentTime(value)
      setIsSeeking(false)
    } catch (error) {
      console.error("Error seeking video:", error)
      setHasError(true)
      setErrorMessage("Failed to seek video")
      setIsSeeking(false)
    }
  }

  const handleToggleMute = () => {
    if (!player) return

    try {
      const newMutedState = !isMuted
      player.muted = newMutedState
      setIsMuted(newMutedState)
    } catch (error) {
      console.error("Error toggling mute:", error)
      setHasError(true)
      setErrorMessage("Failed to control audio")
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const jumpToTimestamp = (timestamp) => {
    if (player) {
      player.currentTime = timestamp.time
      setCurrentTime(timestamp.time)
    }
  }

  // Calculate effective end time (use actual video duration if end is very large)
  const effectiveEnd =
    videoDuration && end > videoDuration ? videoDuration : end

  const handleClose = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (player && isMountedRef.current) {
      try {
        player.pause()
        player.muted = false
      } catch (error) {
        // Video might already be paused
      }
    }

    setIsPlaying(false)
    setHasEnded(false)
    setIsMuted(false)
    onClose()
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>{moveName}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {videoSource && visible ? (
                <View style={styles.videoContainer}>
                  {hasError ? (
                    <View style={styles.errorContainer}>
                      <MaterialIcons
                        name="error-outline"
                        size={48}
                        color="#FF4444"
                      />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                      <Text style={styles.errorSubtext}>
                        This video format may not be supported or there may be a
                        network issue.
                      </Text>
                    </View>
                  ) : (
                    <VideoView
                      player={player}
                      style={styles.video}
                      contentFit="contain"
                      nativeControls={false}
                    />
                  )}

                  {/* Time Slider - only show if no error */}
                  {!hasError && (
                    <>
                      <View style={styles.sliderContainer}>
                        <Text style={styles.timeText}>
                          {formatTime(currentTime - start)}
                        </Text>
                        <Slider
                          style={styles.slider}
                          minimumValue={start}
                          maximumValue={effectiveEnd}
                          value={currentTime}
                          onValueChange={handleSliderChange}
                          onSlidingComplete={handleSliderComplete}
                          minimumTrackTintColor="#6200EE"
                          maximumTrackTintColor="#ddd"
                          thumbTintColor="#6200EE"
                        />
                        <Text style={styles.timeText}>
                          {formatTime(effectiveEnd - start)}
                        </Text>
                      </View>

                      <View style={styles.controls}>
                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={handlePlayPause}
                        >
                          <MaterialIcons
                            name={isPlaying ? "pause" : "play-arrow"}
                            size={36}
                            color="#6200EE"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={handleReplay}
                        >
                          <MaterialIcons
                            name="replay"
                            size={32}
                            color="#6200EE"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={handleToggleMute}
                        >
                          <MaterialIcons
                            name={isMuted ? "volume-off" : "volume-up"}
                            size={32}
                            color="#6200EE"
                          />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Add Timestamp button */}
                  <View style={styles.timestampContainer}>
                    <TouchableOpacity
                      style={styles.timestampButton}
                      onPress={() => {
                        // Pause the video when adding timestamp
                        if (player && isPlaying) {
                          player.pause()
                          setIsPlaying(false)
                        }

                        // Pass current time and video info to parent
                        if (onAddTimestamp) {
                          onAddTimestamp({
                            time: currentTime,
                            videoId: customVideoId || videoSource,
                            videoName: moveName,
                          })
                        }
                      }}
                    >
                      <MaterialIcons name="bookmark" size={20} color="white" />
                      <Text style={styles.timestampButtonText}>
                        Add Timestamp
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Existing Timestamps */}
                  {videoTimestamps.length > 0 && (
                    <View style={styles.timestampsList}>
                      <Text style={styles.timestampsTitle}>Timestamps:</Text>
                      {videoTimestamps.map((timestamp) => (
                        <TouchableOpacity
                          key={timestamp.id}
                          style={styles.timestampItem}
                          onPress={() => jumpToTimestamp(timestamp)}
                        >
                          <View style={styles.timestampInfo}>
                            <Text style={styles.timestampName}>
                              {timestamp.name}
                            </Text>
                            <Text style={styles.timestampTime}>
                              {formatTime(timestamp.time)}
                              {timestamp.endTime &&
                                ` - ${formatTime(timestamp.endTime)}`}
                            </Text>
                          </View>
                          <MaterialIcons
                            name="play-arrow"
                            size={20}
                            color="#6200EE"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Delete button for custom videos */}
                  {isCustomVideo && onDeleteCustomVideo && (
                    <View style={styles.deleteContainer}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          onDeleteCustomVideo(customVideoId)
                          onClose()
                        }}
                      >
                        <MaterialIcons name="delete" size={20} color="white" />
                        <Text style={styles.deleteButtonText}>
                          Remove from Catalog
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noVideoContainer}>
                  <MaterialIcons name="videocam-off" size={48} color="#999" />
                  <Text style={styles.noVideoText}>
                    No video available for this move
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200EE",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  videoContainer: {
    width: "100%",
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 8,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    minWidth: 35,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 20,
  },
  controlButton: {
    backgroundColor: "#f0e7ff",
    padding: 12,
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoContainer: {
    alignItems: "center",
    padding: 40,
  },
  noVideoText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    textAlign: "center",
  },
  deleteContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#FF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  timestampContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  timestampButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  timestampButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  timestampsList: {
    marginTop: 20,
    maxHeight: 200,
  },
  timestampsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 10,
  },
  timestampItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  timestampInfo: {
    flex: 1,
  },
  timestampName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  timestampTime: {
    fontSize: 12,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4444",
    marginTop: 12,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
})

export default VideoPlayerModal
