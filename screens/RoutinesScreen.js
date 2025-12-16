import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { DANCE_STYLE_CATEGORIES } from "../data/dance_info"

const RoutinesScreen = () => {
  const router = useRouter()
  const [routines, setRoutines] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [routineName, setRoutineName] = useState("")
  const [routineDescription, setRoutineDescription] = useState("")
  const [selectedDanceStyle, setSelectedDanceStyle] = useState("")
  const [showDanceStyleDropdown, setShowDanceStyleDropdown] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)

  // Load routines from storage on component mount
  useEffect(() => {
    loadRoutines()
  }, [])

  const loadRoutines = async () => {
    try {
      const storedRoutines = await AsyncStorage.getItem("routines")
      if (storedRoutines) {
        setRoutines(JSON.parse(storedRoutines))
      }
    } catch (error) {
      console.error("Error loading routines:", error)
    }
  }

  const saveRoutines = async (routinesToSave) => {
    try {
      await AsyncStorage.setItem("routines", JSON.stringify(routinesToSave))
    } catch (error) {
      console.error("Error saving routines:", error)
    }
  }

  const handleCreateRoutine = async () => {
    if (!routineName.trim() || !selectedDanceStyle) {
      Alert.alert("Error", "Please fill in both name and dance style")
      return
    }

    const newRoutine = {
      id: Date.now().toString(),
      name: routineName.trim(),
      description: routineDescription.trim(),
      danceStyle: selectedDanceStyle,
      createdAt: new Date().toISOString(),
    }

    const updatedRoutines = [...routines, newRoutine]
    setRoutines(updatedRoutines)
    await saveRoutines(updatedRoutines)

    Alert.alert(
      "Success",
      `Created routine "${routineName}" with style "${selectedDanceStyle}"`
    )

    // Reset form and close modal
    setRoutineName("")
    setRoutineDescription("")
    setSelectedDanceStyle("")
    setShowDanceStyleDropdown(false)
    setModalVisible(false)
  }

  const handleCancel = () => {
    setRoutineName("")
    setRoutineDescription("")
    setSelectedDanceStyle("")
    setShowDanceStyleDropdown(false)
    setModalVisible(false)
  }

  const handleRandomRoutine = async () => {
    // TODO: Implement random routine generation
    Alert.alert(
      "Random Routine",
      "Random routine generation will be implemented soon!"
    )
  }

  const handleEditRoutine = (routine) => {
    setEditingRoutine(routine)
    setRoutineName(routine.name)
    setRoutineDescription(routine.description || "")
    setSelectedDanceStyle(routine.danceStyle)
    setEditModalVisible(true)
  }

  const handleUpdateRoutine = async () => {
    if (!routineName.trim() || !selectedDanceStyle) {
      Alert.alert("Error", "Please fill in both name and dance style")
      return
    }

    const updatedRoutines = routines.map((routine) =>
      routine.id === editingRoutine.id
        ? {
            ...routine,
            name: routineName.trim(),
            description: routineDescription.trim(),
            danceStyle: selectedDanceStyle,
            updatedAt: new Date().toISOString(),
          }
        : routine
    )

    setRoutines(updatedRoutines)
    await saveRoutines(updatedRoutines)

    Alert.alert("Success", "Routine updated successfully!")

    // Reset form and close modal
    setRoutineName("")
    setRoutineDescription("")
    setSelectedDanceStyle("")
    setShowDanceStyleDropdown(false)
    setEditModalVisible(false)
    setEditingRoutine(null)
  }

  const handleDeleteRoutine = (routine) => {
    Alert.alert(
      "Delete Routine",
      `Are you sure you want to delete "${routine.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedRoutines = routines.filter((r) => r.id !== routine.id)
            setRoutines(updatedRoutines)
            await saveRoutines(updatedRoutines)
            Alert.alert("Success", "Routine deleted successfully!")
          },
        },
      ]
    )
  }

  const handleCancelEdit = () => {
    setRoutineName("")
    setRoutineDescription("")
    setSelectedDanceStyle("")
    setShowDanceStyleDropdown(false)
    setEditModalVisible(false)
    setEditingRoutine(null)
  }

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

  const renderDanceStyleItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.danceStyleItem,
        selectedDanceStyle === item && styles.selectedDanceStyle,
      ]}
      onPress={() => {
        setSelectedDanceStyle(item)
        setShowDanceStyleDropdown(false)
      }}
    >
      <Text
        style={[
          styles.danceStyleText,
          selectedDanceStyle === item && styles.selectedDanceStyleText,
        ]}
      >
        {formatDanceName(item)}
      </Text>
    </TouchableOpacity>
  )

  const renderRoutineItem = ({ item }) => (
    <TouchableOpacity
      style={styles.routineItem}
      onPress={() =>
        router.push({
          pathname: "/routine-detail",
          params: { routine: JSON.stringify(item) },
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.routineInfo}>
        <Text style={styles.routineName}>{item.name}</Text>
        <Text style={styles.routineStyle}>
          {formatDanceName(item.danceStyle)}
        </Text>
      </View>
      <View style={styles.routineActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation()
            handleEditRoutine(item)
          }}
        >
          <MaterialIcons name="edit" size={20} color="#6200EE" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation()
            handleDeleteRoutine(item)
          }}
        >
          <MaterialIcons name="close" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No routines created yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to create your first routine
            </Text>
          </View>
        ) : (
          <FlatList
            data={routines}
            renderItem={renderRoutineItem}
            keyExtractor={(item) => item.id}
            style={styles.routinesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.routinesListContent}
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

      {/* Modal for creating new routine */}
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
                <Text style={styles.modalTitle}>Create New Routine</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Routine Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={routineName}
                    onChangeText={setRoutineName}
                    placeholder="Enter routine name"
                    placeholderTextColor="#999"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description (Optional)</Text>
                  <TextInput
                    style={styles.textInputMultiline}
                    value={routineDescription}
                    onChangeText={setRoutineDescription}
                    placeholder="Add a description for this routine..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Dance Style</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() =>
                      setShowDanceStyleDropdown(!showDanceStyleDropdown)
                    }
                  >
                    <Text
                      style={[
                        styles.dropdownButtonText,
                        !selectedDanceStyle && styles.placeholderText,
                      ]}
                    >
                      {selectedDanceStyle
                        ? selectedDanceStyle.charAt(0).toUpperCase() +
                          selectedDanceStyle.slice(1)
                        : "Select dance style"}
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

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.randomButton}
                    onPress={handleRandomRoutine}
                  >
                    <MaterialIcons name="shuffle" size={18} color="#fff" />
                    <Text style={styles.randomButtonText}>Random</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateRoutine}
                  >
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Routine Modal */}
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
                <Text style={styles.modalTitle}>Edit Routine</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Routine Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={routineName}
                    onChangeText={setRoutineName}
                    placeholder="Enter routine name"
                    placeholderTextColor="#999"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description (Optional)</Text>
                  <TextInput
                    style={styles.textInputMultiline}
                    value={routineDescription}
                    onChangeText={setRoutineDescription}
                    placeholder="Add a description for this routine..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Dance Style</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() =>
                      setShowDanceStyleDropdown(!showDanceStyleDropdown)
                    }
                  >
                    <Text
                      style={[
                        styles.dropdownButtonText,
                        !selectedDanceStyle && styles.placeholderText,
                      ]}
                    >
                      {selectedDanceStyle
                        ? selectedDanceStyle.charAt(0).toUpperCase() +
                          selectedDanceStyle.slice(1)
                        : "Select dance style"}
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

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleUpdateRoutine}
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
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
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
  textInputMultiline: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
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
  randomButton: {
    flex: 0.8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FF6F00",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  randomButtonText: {
    color: "#fff",
    fontSize: Platform.OS === "web" ? 16 : 13,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#6200EE",
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: Platform.OS === "web" ? 16 : 13,
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
    zIndex: 1000,
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
  sectionHeader: {
    backgroundColor: "#f0e7ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d4f7",
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6200EE",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  routinesList: {
    flex: 1,
  },
  routinesListContent: {
    paddingTop: 0,
  },
  routineItem: {
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
  routineInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  routineName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  routineStyle: {
    fontSize: 16,
    color: "#999",
  },
  routineActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },
})

export default RoutinesScreen
