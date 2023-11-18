import { User } from "@/types";
import { DocumentReference, doc } from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { View, StyleSheet, FlatList } from "react-native";
import { ActivityIndicator, Avatar, FAB, Text } from "react-native-paper";
import { useFirestore, useFirestoreDocData, useUser } from "reactfire";

export default function ContactScreen() {
  const { status, data: currentUser } = useUser();

  if (status === "loading") {
    return <ActivityIndicator />;
  }
  if (!currentUser) {
    return null;
  }

  return <ScreenWithUser user={currentUser} />;
}

function ScreenWithUser({ user }: { user: FirebaseUser }) {
  const firestore = useFirestore();
  const userDoc = doc(firestore, "users", user.uid) as DocumentReference<User>;
  const { status: userDataStatus, data: userData } = useFirestoreDocData(
    userDoc,
    {
      idField: "id",
    }
  );
  if (userDataStatus === "loading") {
    return <ActivityIndicator />;
  }
  if (!userData) {
    return null;
  }

  return (
    <>
      <FlatList
        style={styles.container}
        data={userData.contacts}
        renderItem={({ item }) => <ContactItem userId={item} />}
        keyExtractor={(item) => item}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log("Pressed")}
      />
    </>
  );
}

function ContactItem({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const userDoc = doc(firestore, "users", userId) as DocumentReference<User>;
  const { status: userDataStatus, data: user } = useFirestoreDocData(userDoc, {
    idField: "id",
  });
  if (userDataStatus === "loading") {
    return <ActivityIndicator />;
  }
  if (!user) {
    return null;
  }

  return (
    <View style={styles.itemContainer}>
      <Avatar.Image
        size={40}
        source={
          user.avatarUrl
            ? { uri: user.avatarUrl }
            : require("@/assets/images/avatar-2.png")
        }
      />
      <View style={{ flex: 1 }}>
        <View>
          <Text variant="titleMedium">{user.name}</Text>
          <Text numberOfLines={1}>{user.email}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: "5%",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 28,
    gap: 15,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
