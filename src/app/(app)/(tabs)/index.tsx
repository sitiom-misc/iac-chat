import { Message, Room } from "@/types";
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
import { ActivityIndicator, Avatar, Text } from "react-native-paper";
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
    if (!currentUser) return null;
    const firestore = useFirestore();

    let roomName: string;
    let icon: ImageSourcePropType;
    let message: string;
    if (room.members.length === 2) {
      const otherUserId = room.members.find((id) => id !== currentUser.uid);
      if (!otherUserId) return null;
      const userDoc = doc(firestore, `users/${otherUserId}`);
      const { status, data: user } = useFirestoreDocData(userDoc, {
        idField: "id",
      });
      if (status === "loading") {
        return <ActivityIndicator />;
      }
      if (!user) {
        return null;
      }
      message =
        lastMessage.from === currentUser.uid
          ? `You: ${lastMessage.content}`
          : lastMessage.content;
      roomName = user.name;
      icon = user.avatarUrl
        ? { uri: user.avatarUrl }
        : require("@/assets/images/avatar-2.png");
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
        lastMessage.from !== currentUser.uid ? user.name.split(" ")[0] : "You"
      }: ${lastMessage.content}`;
      roomName = room.name ?? room.members.join(", "); // TODO: Join actual names
      icon = room.iconUrl
        ? { uri: room.iconUrl }
        : require("@/assets/images/group_chat.png");
    }
    return (
      <View style={styles.itemContainer}>
        <Avatar.Image size={53} source={icon} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyLarge">{roomName}</Text>
          <View style={styles.messageContainer}>
            <Text style={{ flexShrink: 1 }} numberOfLines={1}>
              {message}
            </Text>
            <Text>
              {" "}
              •{" "}
              {formatTime(DateTime.fromJSDate(lastMessage.createdAt.toDate()))}
            </Text>
          </View>
        </View>
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
      contentContainerStyle={{ gap: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: "5%",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  messageContainer: {
    flexDirection: "row",
  },
});
