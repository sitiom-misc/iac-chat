import useChatDetails from "@/hooks/useChatDetails";
import { Room } from "@/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { DocumentReference, collection, doc } from "firebase/firestore";
import {
  View,
  StyleSheet,
  ImageRequireSource,
  ImageURISource,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Icon,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";
import { useFirestore, useFirestoreDocData } from "reactfire";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
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

    let avatar: string | ImageRequireSource | undefined;

    if ((iconUrl as ImageURISource).uri) {
      avatar = (iconUrl as ImageURISource).uri;
    }

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
          messages={[
            {
              _id: 1,
              text: "And my message",
              createdAt: new Date(Date.UTC(2016, 5, 11, 17, 20, 0)),
              user: {
                _id: 2,
                name: "React Native",
                avatar,
              },
              sent: true,
              received: true,
              pending: true,
            },
            {
              _id: 2,
              text: "My message",
              createdAt: new Date(Date.UTC(2016, 5, 11, 17, 20, 0)),
              user: {
                _id: 1,
                name: "React Native",
                avatar: "https://facebook.github.io/react/img/logo_og.png",
              },
              sent: true,
              received: true,
              pending: true,
            },
          ]}
          user={{
            _id: 1,
          }}
          // alwaysShowSend={true}
          // Render custom UI using react-native-paper
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
  };

  return <ScreenWithRoom room={room} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
});
