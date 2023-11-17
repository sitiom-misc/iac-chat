import MaterialTabBar from "@/components/material-tab-bar";
import { Link, Redirect, Tabs } from "expo-router";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, Appbar } from "react-native-paper";
import {
  SigninCheckResult,
  useFirestore,
  useFirestoreDocOnce,
  useSigninCheck,
} from "reactfire";
import { getHeaderTitle } from "@react-navigation/elements";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import {
  DocumentReference,
  WithFieldValue,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { User } from "@/types";

export default function HomeLayout() {
  const { status: signInStatus, data: signInCheckResult } = useSigninCheck();

  if (signInStatus === "loading") {
    return <ActivityIndicator />;
  }
  if (!signInCheckResult.signedIn) {
    return <Redirect href="/login" />;
  }
  return <TabsLayout signInCheckResult={signInCheckResult} />;
}

function TabsLayout({
  signInCheckResult,
}: {
  signInCheckResult: SigninCheckResult;
}) {
  if (!signInCheckResult.user) {
    return null;
  }

  const firestore = useFirestore();
  const userDoc = doc(
    firestore,
    "users",
    signInCheckResult.user.uid
  ) as DocumentReference<User>;
  const { status: userSnapStatus, data: userSnap } =
    useFirestoreDocOnce(userDoc);

  if (userSnapStatus === "loading") {
    return <ActivityIndicator />;
  }

  if (!userSnap.exists()) {
    const user: WithFieldValue<User> = {
      name: signInCheckResult.user.displayName ?? "",
      email: signInCheckResult.user.email ?? "",
      avatarUrl: signInCheckResult.user.photoURL ?? "",
      createdAt: serverTimestamp(),
    };
    setDoc(userDoc, user);
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
