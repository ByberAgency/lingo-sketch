import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { Platform, StyleSheet, type ColorValue } from "react-native"
import { getTheme, inkMuted } from "../../src/theme/colors"

const theme = getTheme()

type IoniconName = keyof typeof Ionicons.glyphMap

function TabBarIcon({
    name,
    color,
    focused,
}: {
    name: IoniconName
    color: ColorValue
    focused: boolean
}) {
    return (
        <Ionicons
            name={name}
            size={focused ? 27 : 24}
            color={color}
            style={{ opacity: focused ? 1 : 0.82, transform: [{ translateY: focused ? -1 : 0 }] }}
        />
    )
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: theme.ink,
                tabBarInactiveTintColor: inkMuted(theme.ink, 0.4),
                tabBarStyle: {
                    backgroundColor: theme.surface,
                    borderTopColor: inkMuted(theme.ink, 0.1),
                    borderTopWidth: StyleSheet.hairlineWidth,
                    elevation: 0,
                    shadowOpacity: 0,
                    paddingTop: 8,
                    height: Platform.OS === "ios" ? 84 : 64,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarAccessibilityLabel: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            name={focused ? "home" : "home-outline"}
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="vocabularies"
                options={{
                    title: "My vocabularies",
                    tabBarAccessibilityLabel: "My vocabularies",
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            name={focused ? "bookmark" : "bookmark-outline"}
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="games"
                options={{
                    title: "Games",
                    tabBarAccessibilityLabel: "Games and messages",
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            name={focused ? "chatbubbles" : "chatbubbles-outline"}
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarAccessibilityLabel: "Profile",
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            name={focused ? "person" : "person-outline"}
                            color={color}
                            focused={focused}
                        />
                    ),
                }}
            />
        </Tabs>
    )
}
