import MaterialTabBar from "@/components/material-tab-bar";
import { Link, Tabs } from "expo-router";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Appbar, Avatar, Dialog, Portal, Text } from "react-native-paper";
import { getHeaderTitle } from "@react-navigation/elements";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "reactfire";
import { useAppTheme } from "@/lib/Material3ThemeProvider";
import { View } from "react-native";

export default function HomeLayout() {
  const [isDialogVisible, setDialogVisible] = useState(false);
  const theme = useAppTheme();

  const { currentUser } = useAuth();
  if (!currentUser) {
    return null;
  }

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
              <Link href="/settings" asChild>
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
          header: (props) => (
            <>
              <Portal>
                <Dialog
                  visible={isDialogVisible}
                  onDismiss={() => {
                    setDialogVisible(false);
                  }}
                  style={{ alignSelf: "center", paddingHorizontal: 10 }}
                >
                  <View style={{ marginBottom: 15 }}>
                    <Avatar.Image
                      size={50}
                      style={{ alignSelf: "center", marginBottom: 10 }}
                      source={
                        currentUser.photoURL
                          ? { uri: currentUser.photoURL }
                          : require("@/assets/images/avatar-2.png")
                      }
                    />
                    <Text style={{ textAlign: "center" }} variant="titleMedium">
                      {currentUser.displayName}
                    </Text>
                    <Text
                      style={{ textAlign: "center", lineHeight: 12 }}
                      variant="labelSmall"
                    >
                      {currentUser.email}
                    </Text>
                  </View>
                  <Dialog.Content style={{ alignItems: "center" }}>
                    <QRCode
                      value={`iacchat:${currentUser.uid}`}
                      logo={require("@/assets/images/icon.png")}
                      backgroundColor="transparent"
                      color={theme.colors.inverseSurface}
                      size={150}
                    />
                  </Dialog.Content>
                </Dialog>
              </Portal>
              <Navbar {...props} elevated={true}>
                <Appbar.Action
                  icon="qrcode"
                  onPress={() => {
                    setDialogVisible(true);
                  }}
                />
              </Navbar>
            </>
          ),
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
