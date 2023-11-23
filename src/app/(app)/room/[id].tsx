import useChatDetails from "@/hooks/useChatDetails";
import { Message, Room } from "@/types";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  CollectionReference,
  DocumentReference,
  collection,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import {
  View,
  StyleSheet,
  ImageRequireSource,
  ImageURISource,
  ImageSourcePropType,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Icon,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";
import {
  useAuth,
  useFirestore,
  useFirestoreCollection,
  useFirestoreCollectionData,
  useFirestoreDocData,
} from "reactfire";
import {
  GiftedChat,
  InputToolbar,
  Message as GiftedMessage,
  IMessage,
} from "react-native-gifted-chat";
import MaterialNavBar from "@/components/material-nav-bar";

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

  return <ChatRoom room={room} />;
}

function ChatRoom({ room }: { room: Room }) {
  const { status: chatDetailsStatus, iconUrl, roomName } = useChatDetails(room);
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

  return <Chat roomName={roomName} iconUrl={iconUrl} />;
}

function Chat({
  roomName,
  iconUrl,
}: {
  roomName: string;
  iconUrl: ImageSourcePropType;
}) {
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  if (!roomId || !currentUser) return null;
  const firestore = useFirestore();
  const messagesQuery = query(
    collection(
      firestore,
      `rooms/${roomId}/messages`
    ) as CollectionReference<Message>,
    orderBy("createdAt", "desc")
  );
  const { status: messagesStatus, data: messages } = useFirestoreCollectionData(
    messagesQuery,
    {
      idField: "id",
    }
  );
  if (messagesStatus === "loading") {
    return <ActivityIndicator />;
  }

  let avatar: string | ImageRequireSource | undefined;

  if ((iconUrl as ImageURISource).uri) {
    avatar = (iconUrl as ImageURISource).uri;
  }

  const giftedMessages: IMessage[] = messages.map((message) => ({
    _id: message.id!,
    text: message.content,
    createdAt: message.createdAt.toDate(),
    user: {
      _id: message.from,
      name: roomName,
      avatar,
    },
    sent: true,
    received: true,
  }));

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: roomName,
          header: (props) => (
            <MaterialNavBar {...props}>
              <Avatar.Image
                source={iconUrl}
                size={40}
                style={{ marginRight: 10 }}
              />
            </MaterialNavBar>
          ),
        }}
      />
      <GiftedChat
        messages={giftedMessages}
        user={{
          _id: currentUser.uid,
        }}
        renderSend={({ disabled }) => (
          <IconButton
            icon="send"
            size={25}
            onPress={() => console.log("Pressed send button")}
            disabled={disabled}
          />
        )}
        renderInputToolbar={(props) => {
          const { containerStyle, ...rest } = props;
          const {
            renderActions,
            onPressActionButton,
            renderComposer,
            renderSend,
            renderAccessory,
          } = rest;
          return (
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                alignItems: "center",
                paddingLeft: 10,
              }}
            >
              <TextInput
                mode="outlined"
                placeholder="Message"
                outlineStyle={{ borderRadius: 100 }}
                style={{ flex: 1, height: 50 }}
              />
              {renderSend?.(props)}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
});
