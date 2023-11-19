import useChatDetails from "@/hooks/useChatDetails";
import { Room } from "@/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { DocumentReference, collection, doc } from "firebase/firestore";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Avatar, Text } from "react-native-paper";
import { useFirestore, useFirestoreDocData } from "reactfire";

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  const firestore = useFirestore();
  const roomRef = doc(firestore, "rooms", id) as DocumentReference<Room>;
  const { status: roomStatus, data: room } = useFirestoreDocData(roomRef, {
    idField: "id",
  });
  if (roomStatus === "loading") {
    return (
      <>
        <Stack.Screen
          options={{
            title: "",
          }}
        />
        <ActivityIndicator />
      </>
    );
  }

  const ScreenWithRoom = ({ room }: { room: Room }) => {
    const {
      status: chatDetailsStatus,
      iconUrl,
      roomName,
    } = useChatDetails(room);
    if (chatDetailsStatus === "loading") {
      return (
        <>
          <Stack.Screen
            options={{
              title: "",
            }}
          />
          <ActivityIndicator />
        </>
      );
    }
    if (chatDetailsStatus === "error") {
      return <Text>Error loading chat details</Text>;
    }

    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: roomName,
          }}
        />
        <Avatar.Image source={iconUrl} />
        <Text>Chat goes here</Text>
      </View>
    );
  };

  return <ScreenWithRoom room={room} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: "6%",
  },
});
