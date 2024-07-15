import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signOut } from "firebase/auth";
import { View, StyleSheet, Image } from "react-native";
import { Text, Divider, Drawer } from "react-native-paper";
import { useAuth } from "reactfire";

export default function HistoryScreen() {
  const auth = useAuth();

  if (!auth.currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Image
          source={
            auth.currentUser.photoURL
              ? { uri: auth.currentUser.photoURL }
              : require("@/assets/images/avatar-2.png")
          }
          style={styles.avatarImage}
        />
        <View>
          <Text variant="titleMedium">{auth.currentUser.displayName}</Text>
          <Text>{auth.currentUser.email}</Text>
        </View>
      </View>
      <Divider style={{ marginVertical: 15 }} />
      <Drawer.Item
        icon="logout"
        onPress={async () => {
          if (
            GoogleSignin.hasPreviousSignIn() &&
            auth.currentUser?.providerData[0].providerId === "google.com"
          ) {
            await GoogleSignin.signOut();
          }
          await signOut(auth);
        }}
        label="Sign out"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 50,
  },
});
