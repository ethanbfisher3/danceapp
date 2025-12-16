import { MaterialIcons } from "@expo/vector-icons"
import React, { useState } from "react"
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { FACING_DIRECTIONS, getMovesWithSections } from "../data/dance_info"

const AddMoveModal = ({
  visible,
  onClose,
  onAddMove,
  onCreateMove,
  routine,
  replacingMoveId = null,
}) => {
  const [activeTab, setActiveTab] = useState("add")

  // Add Move tab state
  const [selectedMove, setSelectedMove] = useState("")
  const [showMoveDropdown, setShowMoveDropdown] = useState(false)
  const [showTimingDropdown, setShowTimingDropdown] = useState(false)
  const [selectedTimingMultiple, setSelectedTimingMultiple] = useState(null)
  const [selectedRotation, setSelectedRotation] = useState(null)
  const [showRotationSlider, setShowRotationSlider] = useState(false)
  const [selectedStartFacing, setSelectedStartFacing] = useState(null)
  const [selectedEndFacing, setSelectedEndFacing] = useState(null)
  const [showStartFacingDropdown, setShowStartFacingDropdown] = useState(false)
  const [showEndFacingDropdown, setShowEndFacingDropdown] = useState(false)
  const [selectedEnding, setSelectedEnding] = useState(null)
  const [showEndingDropdown, setShowEndingDropdown] = useState(false)
  const [customMoveTitle, setCustomMoveTitle] = useState("")
  const [moveSearchQuery, setMoveSearchQuery] = useState("")
  const [showMoveSearch, setShowMoveSearch] = useState(false)

  // Create Move tab state
  const [customMoveName, setCustomMoveName] = useState("")
  const [customMoveCounts, setCustomMoveCounts] = useState("")
  const [customMoveStartFacing, setCustomMoveStartFacing] = useState(null)
  const [customMoveEndFacing, setCustomMoveEndFacing] = useState(null)
  const [showCustomStartFacingDropdown, setShowCustomStartFacingDropdown] =
    useState(false)
  const [showCustomEndFacingDropdown, setShowCustomEndFacingDropdown] =
    useState(false)

  const availableMovesSections = getMovesWithSections(routine?.danceStyle)

  // Filter moves based on search query
  const filteredMovesSections = React.useMemo(() => {
    if (!moveSearchQuery.trim()) return availableMovesSections

    const query = moveSearchQuery.toLowerCase()
    return availableMovesSections
      .map((section) => ({
        ...section,
        data: section.data.filter(
          (item) => item.name && item.name.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.data.length > 0)
  }, [availableMovesSections, moveSearchQuery])

  const closeAllAddMoveDropdowns = () => {
    setShowMoveDropdown(false)
    setShowTimingDropdown(false)
    setShowRotationSlider(false)
    setShowStartFacingDropdown(false)
    setShowEndFacingDropdown(false)
    setShowEndingDropdown(false)
  }

  const resetForm = () => {
    // Add Move tab
    setSelectedMove("")
    setShowMoveDropdown(false)
    setShowTimingDropdown(false)
    setSelectedTimingMultiple(null)
    setSelectedRotation(null)
    setShowRotationSlider(false)
    setSelectedStartFacing(null)
    setSelectedEndFacing(null)
    setShowStartFacingDropdown(false)
    setShowEndFacingDropdown(false)
    setSelectedEnding(null)
    setShowEndingDropdown(false)
    setCustomMoveTitle("")
    setMoveSearchQuery("")
    setShowMoveSearch(false)

    // Create Move tab
    setActiveTab("add")
    setCustomMoveName("")
    setCustomMoveCounts("")
    setCustomMoveStartFacing(null)
    setCustomMoveEndFacing(null)
    setShowCustomStartFacingDropdown(false)
    setShowCustomEndFacingDropdown(false)
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  const handleAddMove = () => {
    if (!selectedMove) {
      Alert.alert("Error", "Please select a move")
      return
    }

    const move = availableMovesSections
      .flatMap((section) => section.data)
      .find((item) => item.name === selectedMove)

    onAddMove(move)
    resetForm()
  }

  const handleCreateMove = () => {
    if (!customMoveName.trim()) {
      Alert.alert("Error", "Please enter a move name")
      return
    }

    const moveData = {
      name: customMoveName.trim(),
      counts: customMoveCounts ? parseInt(customMoveCounts) : 2,
      startFacing: customMoveStartFacing,
      endFacing: customMoveEndFacing,
    }

    onCreateMove(moveData)
    resetForm()
  }

  const renderMoveOption = ({ item }) => {
    const isSelected = selectedMove === item.name

    return (
      <TouchableOpacity
        style={[styles.moveOption, isSelected && styles.selectedMoveOption]}
        onPress={() => {
          setSelectedMove(item.name)
          setShowMoveDropdown(false)
        }}
      >
        <View style={styles.moveOptionContent}>
          <Text
            style={[
              styles.moveOptionText,
              isSelected && styles.selectedMoveOptionText,
            ]}
          >
            {item.name}
          </Text>
          {item.counts && (
            <Text
              style={[
                styles.moveCounts,
                isSelected && styles.selectedMoveCounts,
              ]}
            >
              {item.counts}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderMoveSectionHeader = ({ section: { title } }) => (
    <View style={styles.moveSectionHeader}>
      <Text style={styles.moveSectionHeaderText}>{title}</Text>
    </View>
  )

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Tab Headers */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "add" && styles.activeTab]}
                  onPress={() => setActiveTab("add")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "add" && styles.activeTabText,
                    ]}
                  >
                    Add Move
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "create" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("create")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "create" && styles.activeTabText,
                    ]}
                  >
                    Create Move
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Add Move Tab Content */}
              {activeTab === "add" && (
                <>
                  <View style={[styles.inputContainer, { zIndex: 5 }]}>
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
                      onPress={() => {
                        closeAllAddMoveDropdowns()
                        setShowMoveDropdown(!showMoveDropdown)
                      }}
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
                          keyExtractor={(item, index) =>
                            `${item.name}-${index}`
                          }
                          renderItem={renderMoveOption}
                          renderSectionHeader={renderMoveSectionHeader}
                          style={styles.dropdownList}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        />
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Create Move Tab Content */}
              {activeTab === "create" && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Move Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customMoveName}
                      onChangeText={setCustomMoveName}
                      placeholder="Enter move name"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Counts</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customMoveCounts}
                      onChangeText={setCustomMoveCounts}
                      placeholder="Enter number of counts (e.g., 4)"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Start Facing</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => {
                        setShowCustomEndFacingDropdown(false)
                        setShowCustomStartFacingDropdown(
                          !showCustomStartFacingDropdown
                        )
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownButtonText,
                          !customMoveStartFacing && styles.placeholderText,
                        ]}
                      >
                        {customMoveStartFacing || "Select start facing"}
                      </Text>
                      <MaterialIcons
                        name={
                          showCustomStartFacingDropdown
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>

                    {showCustomStartFacingDropdown && (
                      <View style={styles.dropdownContainer}>
                        <ScrollView
                          style={styles.dropdownList}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        >
                          {Object.entries(FACING_DIRECTIONS).map(
                            ([key, value]) => (
                              <TouchableOpacity
                                key={key}
                                style={[
                                  styles.moveOption,
                                  customMoveStartFacing === value &&
                                    styles.selectedMoveOption,
                                ]}
                                onPress={() => {
                                  setCustomMoveStartFacing(value)
                                  setShowCustomStartFacingDropdown(false)
                                }}
                              >
                                <Text
                                  style={[
                                    styles.moveOptionText,
                                    customMoveStartFacing === value &&
                                      styles.selectedMoveOptionText,
                                  ]}
                                >
                                  {value}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>End Facing</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => {
                        setShowCustomStartFacingDropdown(false)
                        setShowCustomEndFacingDropdown(
                          !showCustomEndFacingDropdown
                        )
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownButtonText,
                          !customMoveEndFacing && styles.placeholderText,
                        ]}
                      >
                        {customMoveEndFacing || "Select end facing"}
                      </Text>
                      <MaterialIcons
                        name={
                          showCustomEndFacingDropdown
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>

                    {showCustomEndFacingDropdown && (
                      <View style={styles.dropdownContainer}>
                        <ScrollView
                          style={styles.dropdownList}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        >
                          {Object.entries(FACING_DIRECTIONS).map(
                            ([key, value]) => (
                              <TouchableOpacity
                                key={key}
                                style={[
                                  styles.moveOption,
                                  customMoveEndFacing === value &&
                                    styles.selectedMoveOption,
                                ]}
                                onPress={() => {
                                  setCustomMoveEndFacing(value)
                                  setShowCustomEndFacingDropdown(false)
                                }}
                              >
                                <Text
                                  style={[
                                    styles.moveOptionText,
                                    customMoveEndFacing === value &&
                                      styles.selectedMoveOptionText,
                                  ]}
                                >
                                  {value}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                {activeTab === "add" ? (
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleAddMove}
                  >
                    <Text style={styles.createButtonText}>
                      {replacingMoveId ? "Replace" : "Add"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateMove}
                  >
                    <Text style={styles.createButtonText}>
                      {replacingMoveId ? "Replace" : "Create"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#6200EE",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#333",
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
    flex: 1,
    marginRight: 8,
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
    marginLeft: 8,
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
})

export default AddMoveModal
