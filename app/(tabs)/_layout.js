import { MaterialIcons } from "@expo/vector-icons"
import { Tabs } from "expo-router"

import { HapticTab } from "@/components/haptic-tab"

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6200EE",
        tabBarInactiveTintColor: "#757575",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#6200EE",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Routines",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="playlist-play"
              size={size || 28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="steps"
        options={{
          title: "Steps",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="directions-walk"
              size={size || 28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Catalog",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="library-books"
              size={size || 28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="school" size={size || 28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: "Info",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="info" size={size || 28} color={color} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size || 28} color={color} />
          ),
        }}
      /> */}
    </Tabs>
  )
}
