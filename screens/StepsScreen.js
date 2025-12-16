import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import React, { useEffect, useMemo, useState } from "react"
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
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
import { DANCE_STYLE_CATEGORIES } from "../data/dance_info"

const StepsScreen = () => {
  const router = useRouter()
  const [steps, setSteps] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [stepName, setStepName] = useState("")
  const [selectedDanceStyles, setSelectedDanceStyles] = useState([])
  const [showDanceStyleDropdown, setShowDanceStyleDropdown] = useState(false)
  const [editingStep, setEditingStep] = useState(null)
  const [videoUri, setVideoUri] = useState(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDanceStyle, setFilterDanceStyle] = useState("all")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Load steps from storage on component mount
  useEffect(() => {
    loadSteps()
  }, [])

  const loadSteps = async () => {
    try {
      const storedSteps = await AsyncStorage.getItem("steps")
      if (storedSteps) {
        setSteps(JSON.parse(storedSteps))
      }
    } catch (error) {
      console.error("Error loading steps:", error)
    }
  }

  const saveSteps = async (stepsToSave) => {
    try {
      await AsyncStorage.setItem("steps", JSON.stringify(stepsToSave))
    } catch (error) {
      console.error("Error saving steps:", error)
    }
  }

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your media library to upload videos."
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri)
        Alert.alert("Success", "Video uploaded successfully!")
      }
    } catch (error) {
      console.error("Error picking video:", error)
      Alert.alert("Error", "Failed to upload video. Please try again.")
    }
  }

  const handleCreateStep = async () => {
    if (!stepName.trim() || selectedDanceStyles.length === 0) {
      Alert.alert(
        "Error",
        "Please fill in name and select at least one dance style"
      )
      return
    }

    const newStep = {
      id: Date.now().toString(),
      name: stepName.trim(),
      danceStyles: selectedDanceStyles,
      // For backwards compatibility, keep single danceStyle as first selected
      danceStyle: selectedDanceStyles[0],
      createdAt: new Date().toISOString(),
      videoUri: videoUri || null,
    }

    const updatedSteps = [...steps, newStep]
    setSteps(updatedSteps)
    await saveSteps(updatedSteps)

    Alert.alert(
      "Success",
      `Created step "${stepName}" with ${
        selectedDanceStyles.length
      } dance style${selectedDanceStyles.length > 1 ? "s" : ""}`
    )

    // Reset form and close modal
    setStepName("")
    setSelectedDanceStyles([])
    setShowDanceStyleDropdown(false)
    setVideoUri(null)
    setModalVisible(false)
  }

  const handleCancel = () => {
    setStepName("")
    setSelectedDanceStyles([])
    setShowDanceStyleDropdown(false)
    setVideoUri(null)
    setModalVisible(false)
  }

  const handleEditStep = (step) => {
    setEditingStep(step)
    setStepName(step.name)
    // Support both old single danceStyle and new danceStyles array
    setSelectedDanceStyles(step.danceStyles || [step.danceStyle])
    setVideoUri(step.videoUri || null)
    setEditModalVisible(true)
  }

  const handleUpdateStep = async () => {
    if (!stepName.trim() || selectedDanceStyles.length === 0) {
      Alert.alert(
        "Error",
        "Please fill in name and select at least one dance style"
      )
      return
    }

    const updatedSteps = steps.map((step) =>
      step.id === editingStep.id
        ? {
            ...step,
            name: stepName.trim(),
            danceStyles: selectedDanceStyles,
            danceStyle: selectedDanceStyles[0],
            videoUri: videoUri || null,
            updatedAt: new Date().toISOString(),
          }
        : step
    )

    setSteps(updatedSteps)
    await saveSteps(updatedSteps)

    Alert.alert("Success", "Step updated successfully!")

    // Reset form and close modal
    setStepName("")
    setSelectedDanceStyles([])
    setShowDanceStyleDropdown(false)
    setVideoUri(null)
    setEditModalVisible(false)
    setEditingStep(null)
  }

  const handleDeleteStep = (step) => {
    Alert.alert(
      "Delete Step",
      `Are you sure you want to delete "${step.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedSteps = steps.filter((s) => s.id !== step.id)
            setSteps(updatedSteps)
            await saveSteps(updatedSteps)
          },
        },
      ]
    )
  }

  const handleCancelEdit = () => {
    setStepName("")
    setSelectedDanceStyles([])
    setShowDanceStyleDropdown(false)
    setVideoUri(null)
    setEditModalVisible(false)
    setEditingStep(null)
  }

  // Filter steps based on search and dance style
  const filteredSteps = useMemo(() => {
    let filtered = [...steps]

    // Filter by search query
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery.length > 0) {
      const query = trimmedQuery.toLowerCase()
      filtered = filtered.filter((step) => {
        const stepName = step.name || ""
        return stepName.toLowerCase().includes(query)
      })
    }

    // Filter by dance style
    if (filterDanceStyle !== "all") {
      filtered = filtered.filter((step) => {
        // Support both old single danceStyle and new danceStyles array
        const styles = step.danceStyles || [step.danceStyle]
        return styles.includes(filterDanceStyle)
      })
    }

    return filtered
  }, [steps, searchQuery, filterDanceStyle])

  // Create section data for the dropdown
  const getDanceStyleSections = () => {
    return Object.entries(DANCE_STYLE_CATEGORIES).map(([category, styles]) => ({
      title: category,
      data: styles,
    }))
  }

  const formatDanceName = (danceStyle) => {
    return danceStyle
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const renderDanceStyleHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  )

  const toggleDanceStyle = (style) => {
    if (selectedDanceStyles.includes(style)) {
      setSelectedDanceStyles(selectedDanceStyles.filter((s) => s !== style))
    } else {
      setSelectedDanceStyles([...selectedDanceStyles, style])
    }
  }

  const renderDanceStyleItem = ({ item }) => {
    const isSelected = selectedDanceStyles.includes(item)

    return (
      <TouchableOpacity
        style={[styles.danceStyleItem, isSelected && styles.selectedDanceStyle]}
        onPress={() => toggleDanceStyle(item)}
      >
        <View style={styles.danceStyleItemContent}>
          <Text
            style={[
              styles.danceStyleText,
              isSelected && styles.selectedDanceStyleText,
            ]}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </Text>
          {isSelected && <MaterialIcons name="check" size={20} color="white" />}
        </View>
      </TouchableOpacity>
    )
  }

  const renderStepItem = ({ item }) => (
    <TouchableOpacity
      style={styles.stepItem}
      onPress={() =>
        router.push({
          pathname: "/step-detail",
          params: { step: JSON.stringify(item) },
        })
      }
      activeOpacity={0.7}
    >
      <Text style={styles.stepName}>{item.name}</Text>
      <View style={styles.stepActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation()
            handleEditStep(item)
          }}
        >
          <MaterialIcons name="edit" size={20} color="#6200EE" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation()
            handleDeleteStep(item)
          }}
        >
          <MaterialIcons name="close" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Container */}
      <View style={styles.filterContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search steps..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dance Style Filter */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Dance Style</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Text style={styles.filterDropdownText}>
                {filterDanceStyle === "all"
                  ? "All Styles"
                  : formatDanceName(filterDanceStyle)}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dance Style Dropdown Menu */}
        {showFilterDropdown && (
          <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setFilterDanceStyle("all")
                setShowFilterDropdown(false)
              }}
            >
              <Text style={styles.dropdownItemText}>All Styles</Text>
              {filterDanceStyle === "all" && (
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
                      setFilterDanceStyle(item)
                      setShowFilterDropdown(false)
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {formatDanceName(item)}
                    </Text>
                    {filterDanceStyle === item && (
                      <MaterialIcons name="check" size={20} color="#6200EE" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredSteps.length} step{filteredSteps.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {steps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No steps created yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to create your first step
            </Text>
          </View>
        ) : filteredSteps.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No steps found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your filters or search query
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSteps}
            renderItem={renderStepItem}
            keyExtractor={(item) => item.id}
            style={styles.stepsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepsListContent}
          />
        )}
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Modal for creating new step */}
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
                <Text style={styles.modalTitle}>Create New Step</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Step Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={stepName}
                    onChangeText={setStepName}
                    placeholder="Enter step name"
                    placeholderTextColor="#999"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Dance Styles (tap to select multiple)
                  </Text>

                  {selectedDanceStyles.length > 0 && (
                    <View style={styles.selectedStylesContainer}>
                      {selectedDanceStyles.map((style) => (
                        <View key={style} style={styles.selectedStyleChip}>
                          <Text style={styles.selectedStyleChipText}>
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleDanceStyle(style)}
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                          >
                            <MaterialIcons
                              name="close"
                              size={16}
                              color="#6200EE"
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() =>
                      setShowDanceStyleDropdown(!showDanceStyleDropdown)
                    }
                  >
                    <Text
                      style={[
                        styles.dropdownButtonText,
                        selectedDanceStyles.length === 0 &&
                          styles.placeholderText,
                      ]}
                    >
                      {selectedDanceStyles.length > 0
                        ? `${selectedDanceStyles.length} style${
                            selectedDanceStyles.length > 1 ? "s" : ""
                          } selected`
                        : "Select dance styles"}
                    </Text>
                    <MaterialIcons
                      name={
                        showDanceStyleDropdown
                          ? "keyboard-arrow-up"
                          : "keyboard-arrow-down"
                      }
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {showDanceStyleDropdown && (
                    <View style={styles.dropdownContainer}>
                      <SectionList
                        sections={getDanceStyleSections()}
                        renderItem={renderDanceStyleItem}
                        renderSectionHeader={renderDanceStyleHeader}
                        keyExtractor={(item, index) => item + index}
                        style={styles.dropdownList}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        stickySectionHeadersEnabled={false}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Video (Optional)</Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={pickVideo}
                  >
                    <MaterialIcons
                      name={videoUri ? "check-circle" : "videocam"}
                      size={24}
                      color={videoUri ? "#4CAF50" : "#6200EE"}
                    />
                    <Text
                      style={[
                        styles.uploadButtonText,
                        videoUri && styles.uploadedText,
                      ]}
                    >
                      {videoUri ? "Video Uploaded" : "Upload Video"}
                    </Text>
                  </TouchableOpacity>
                  {videoUri && (
                    <TouchableOpacity
                      style={styles.removeVideoButton}
                      onPress={() => setVideoUri(null)}
                    >
                      <MaterialIcons name="close" size={18} color="#f44336" />
                      <Text style={styles.removeVideoText}>Remove Video</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateStep}
                  >
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Step Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={handleCancelEdit}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Step</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Step Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={stepName}
                    onChangeText={setStepName}
                    placeholder="Enter step name"
                    placeholderTextColor="#999"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Dance Styles (tap to select multiple)
                  </Text>

                  {selectedDanceStyles.length > 0 && (
                    <View style={styles.selectedStylesContainer}>
                      {selectedDanceStyles.map((style) => (
                        <View key={style} style={styles.selectedStyleChip}>
                          <Text style={styles.selectedStyleChipText}>
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleDanceStyle(style)}
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                          >
                            <MaterialIcons
                              name="close"
                              size={16}
                              color="#6200EE"
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() =>
                      setShowDanceStyleDropdown(!showDanceStyleDropdown)
                    }
                  >
                    <Text
                      style={[
                        styles.dropdownButtonText,
                        selectedDanceStyles.length === 0 &&
                          styles.placeholderText,
                      ]}
                    >
                      {selectedDanceStyles.length > 0
                        ? `${selectedDanceStyles.length} style${
                            selectedDanceStyles.length > 1 ? "s" : ""
                          } selected`
                        : "Select dance styles"}
                    </Text>
                    <MaterialIcons
                      name={
                        showDanceStyleDropdown
                          ? "keyboard-arrow-up"
                          : "keyboard-arrow-down"
                      }
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {showDanceStyleDropdown && (
                    <View style={styles.dropdownContainer}>
                      <SectionList
                        sections={getDanceStyleSections()}
                        renderItem={renderDanceStyleItem}
                        renderSectionHeader={renderDanceStyleHeader}
                        keyExtractor={(item, index) => item + index}
                        style={styles.dropdownList}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        stickySectionHeadersEnabled={false}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Video (Optional)</Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={pickVideo}
                  >
                    <MaterialIcons
                      name={videoUri ? "check-circle" : "videocam"}
                      size={24}
                      color={videoUri ? "#4CAF50" : "#6200EE"}
                    />
                    <Text
                      style={[
                        styles.uploadButtonText,
                        videoUri && styles.uploadedText,
                      ]}
                    >
                      {videoUri ? "Video Uploaded" : "Upload Video"}
                    </Text>
                  </TouchableOpacity>
                  {videoUri && (
                    <TouchableOpacity
                      style={styles.removeVideoButton}
                      onPress={() => setVideoUri(null)}
                    >
                      <MaterialIcons name="close" size={18} color="#f44336" />
                      <Text style={styles.removeVideoText}>Remove Video</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleUpdateStep}
                  >
                    <Text style={styles.createButtonText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  resultsContainer: {
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  content: {
    flex: 1,
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
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: "600",
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
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 4,
    zIndex: 9999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownList: {
    maxHeight: 200,
  },
  danceStyleItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  danceStyleItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedDanceStyle: {
    backgroundColor: "#6200EE",
  },
  danceStyleText: {
    fontSize: 16,
    color: "#333",
  },
  selectedDanceStyleText: {
    color: "white",
  },
  selectedStylesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  selectedStyleChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0e7ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  selectedStyleChipText: {
    fontSize: 14,
    color: "#6200EE",
    fontWeight: "600",
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
  stepsList: {
    flex: 1,
  },
  stepsListContent: {
    paddingTop: 0,
  },
  stepItem: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 1,
    marginHorizontal: 0,
    borderRadius: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stepName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  stepActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6200EE",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadedText: {
    color: "white",
  },
  removeVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    padding: 8,
    gap: 4,
  },
  removeVideoText: {
    color: "#f44336",
    fontSize: 14,
    fontWeight: "500",
  },
})

export default StepsScreen
