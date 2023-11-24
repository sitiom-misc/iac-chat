import MaterialNavBar from "@/components/material-nav-bar";
import { User } from "@/types";
import { Redirect, Stack } from "expo-router";
import {
  DocumentReference,
  WithFieldValue,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { ActivityIndicator } from "react-native-paper";
import {
  SigninCheckResult,
  useFirestore,
  useFirestoreDocOnce,
  useSigninCheck,
} from "reactfire";

export default function AppLayout() {
  const { status: signInStatus, data: signInCheckResult } = useSigninCheck();

  if (signInStatus === "loading") {
    return <ActivityIndicator />;
  }
  if (!signInCheckResult.signedIn) {
    return <Redirect href="/login" />;
  }

  return <LayoutWithAuth signInCheckResult={signInCheckResult} />;
}

function LayoutWithAuth({
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
      contacts: [],
    };
    setDoc(userDoc, user);
  }

  return (
    <Stack
      screenOptions={{
        header: (props) => <MaterialNavBar {...props} />,
        animation: "fade_from_bottom",
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          headerTitle: "Scan QR",
        }}
      />
    </Stack>
  );
}
