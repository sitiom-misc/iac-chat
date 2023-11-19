import useChatDetails from "@/hooks/useChatDetails";
import { Message, Room } from "@/types";
import { router } from "expo-router";
import {
  CollectionReference,
  collection,
  doc,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { DateTime } from "luxon";
import { View, StyleSheet, ImageSourcePropType, FlatList } from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Text,
  TouchableRipple,
} from "react-native-paper";
import {
  useAuth,
  useFirestore,
  useFirestoreCollectionData,
  useFirestoreDocData,
} from "reactfire";

function formatTime(date: DateTime) {
  const now = DateTime.now();
  if (now.diff(date, "hours").hours < 24) {
    return date.toLocaleString(DateTime.TIME_SIMPLE);
  } else if (now.diff(date, "days").days < 7) {
    return date.toLocaleString({ weekday: "short" });
  } else if (now.diff(date, "months").months < 6) {
    return date.toLocaleString({ month: "short", day: "numeric" });
  } else {
    return date.toLocaleString({
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

function ChatItem({ room }: { room: Room }) {
  if (!room) return null;
  const firestore = useFirestore();

  const messagesCol = collection(
    firestore,
    `rooms/${room.id}/messages`
  ) as CollectionReference<Message>;
  const lastMessageQuery = query(
    messagesCol,
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const { status: lastMessageStatus, data: lastMessage } =
    useFirestoreCollectionData(lastMessageQuery, {
      idField: "id",
    });

  if (lastMessageStatus === "loading") {
    return <ActivityIndicator />;
  }

  const ChatItemWithLastMessage = ({
    room,
    lastMessage,
  }: {
    room: Room;
    lastMessage: Message;
  }) => {
    const { currentUser } = useAuth();
    if (!currentUser || !lastMessage) return null;

    const { status: detailsStatus, roomName, iconUrl } = useChatDetails(room);

    let message: string;
    if (room.members.length === 2) {
      message =
        lastMessage.from === currentUser.uid
          ? `You: ${lastMessage.content}`
          : lastMessage.content;
    } else {
      const userDoc = doc(firestore, `users/${lastMessage.from}`);
      const { status, data: user } = useFirestoreDocData(userDoc, {
        idField: "id",
      });
      if (status === "loading") {
        return <ActivityIndicator />;
      }
      if (!user) {
        return null;
      }
      message = `${
        lastMessage.from === currentUser.uid ? "You" : user.name.split(" ")[0]
      }: ${lastMessage.content}`;
    }

    switch (detailsStatus) {
      case "loading":
        return <ActivityIndicator />;
      case "error":
        return null;
    }

    return (
      <View style={{ borderRadius: 20, overflow: "hidden" }}>
        <TouchableRipple
          onPress={() => router.push(`/room/${room.id}`)}
          style={styles.itemContainer}
        >
          <>
            <Avatar.Image size={53} source={iconUrl} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyLarge">{roomName}</Text>
              <View style={styles.messageContainer}>
                <Text style={{ flexShrink: 1 }} numberOfLines={1}>
                  {message}
                </Text>
                <Text>
                  {" "}
                  •{" "}
                  {formatTime(
                    DateTime.fromJSDate(lastMessage.createdAt.toDate())
                  )}
                </Text>
              </View>
            </View>
          </>
        </TouchableRipple>
      </View>
    );
  };

  return <ChatItemWithLastMessage room={room} lastMessage={lastMessage[0]} />;
}

export default function IndexScreen() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const firestore = useFirestore();
  const roomsCol = collection(firestore, "rooms") as CollectionReference<Room>;
  const myRoomsQuery = query(
    roomsCol,
    where("members", "array-contains", currentUser.uid),
    orderBy("lastUpdated", "desc")
  );

  const { status, data: myRooms } = useFirestoreCollectionData(myRoomsQuery, {
    idField: "id",
  });

  if (status === "loading") {
    return <ActivityIndicator />;
  }
  if (!myRooms) return null;

  return (
    <FlatList
      data={myRooms}
      renderItem={({ item }) => <ChatItem room={item} />}
      keyExtractor={(item) => item.id!}
      style={styles.container}
    />
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
    paddingHorizontal: "3%",
  },
  messageContainer: {
    flexDirection: "row",
  },
});
