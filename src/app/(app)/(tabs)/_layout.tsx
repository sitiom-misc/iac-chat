import MaterialTabBar from "@/components/material-tab-bar";
import { Link, Tabs } from "expo-router";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Appbar } from "react-native-paper";
import { getHeaderTitle } from "@react-navigation/elements";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

export default function HomeLayout() {
  return (
    <Tabs
      screenOptions={{
        header: (props) => <Navbar {...props} elevated={true} />,
      }}
      tabBar={(props) => <MaterialTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "Chats",
          tabBarLabel: "Chats",
          header: (props) => (
            <Navbar {...props}>
              <Link href="/settings">
                <Appbar.Action icon="account-circle-outline" />
              </Link>
            </Navbar>
          ),
          tabBarIcon: ({ color, size, focused }) => {
            return (
              <Icon
                name={focused ? "chat" : "chat-outline"}
                size={size}
                color={color}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          headerTitle: "People",
          tabBarLabel: "People",
          tabBarIcon: ({ color, size, focused }) => {
            return (
              <Icon
                name={focused ? "account-multiple" : "account-multiple-outline"}
                size={size}
                color={color}
              />
            );
          },
        }}
      />
    </Tabs>
  );
}

function Navbar({
  route,
  options,
  elevated,
  children,
}: BottomTabHeaderProps & { elevated?: boolean; children?: React.ReactNode }) {
  const title = getHeaderTitle(options, route.name);

  return (
    <Appbar.Header elevated={elevated}>
      <Appbar.Content title={title} />
      {children}
    </Appbar.Header>
  );
}
