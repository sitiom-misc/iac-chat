import { Room, User } from "@/types";
import { router } from "expo-router";
import {
  CollectionReference,
  DocumentReference,
  and,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { View, StyleSheet, FlatList, ToastAndroid } from "react-native";
import {
  ActivityIndicator,
  Avatar,
  FAB,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { useAuth, useFirestore, useFirestoreDocData, useUser } from "reactfire";

export default function ContactScreen() {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return null;
  }

  const firestore = useFirestore();
  const userDoc = doc(
    firestore,
    "users",
    currentUser.uid
  ) as DocumentReference<User>;
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
  const { currentUser } = useAuth();
  const userDoc = doc(firestore, "users", userId) as DocumentReference<User>;
  const { status: userDataStatus, data: user } = useFirestoreDocData(userDoc, {
    idField: "id",
  });
  if (userDataStatus === "loading") {
    return <ActivityIndicator />;
  }
  if (!user || !currentUser) {
    return null;
  }

  const openDirectMessage = async () => {
    const roomsCol = collection(
      firestore,
      "rooms"
    ) as CollectionReference<Room>;

    const myRoomsQuery = query(
      roomsCol,
      where("members", "array-contains", currentUser.uid),
      // More than one array-contains not supported
      // where("members", "array-contains", user.id),
      orderBy("lastUpdated", "desc")
    );
    const myRoomsSnap = await getDocs(myRoomsQuery);
    const dmRooms = myRoomsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(
        (room) => room.members.length === 2 && room.members.includes(user.id!)
      );

    if (dmRooms.length === 0) {
      const newRoomRef = doc(roomsCol);
      await setDoc(newRoomRef, {
        members: [currentUser.uid, user.id!],
        lastUpdated: serverTimestamp(),
      });
      router.push(`/room/${newRoomRef.id}`);
    } else {
      router.push(`/room/${dmRooms[0].id}`);
    }
  };

  return (
    <View style={{ borderRadius: 20, overflow: "hidden" }}>
      <TouchableRipple onPress={openDirectMessage} style={styles.itemContainer}>
        <>
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
              <Text variant="titleSmall">{user.name}</Text>
              <Text numberOfLines={1} variant="bodySmall">
                {user.email}
              </Text>
            </View>
          </View>
        </>
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: "3%",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingVertical: 10,
    paddingHorizontal: "2%",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
