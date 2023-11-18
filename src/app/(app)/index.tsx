import { View, StyleSheet, ScrollView } from "react-native";
import { Avatar, Text } from "react-native-paper";

function ChatItem() {
  return (
    <View style={styles.itemContainer}>
      <Avatar.Image
        size={50}
        source={{
          uri: "https://media.vanityfair.com/photos/5d7bf7cfe8110d0009988413/1:1/w_1332,h_1332,c_limit/bill-gates-interview-tout.jpg",
        }}
      />
      <View style={{ flex: 1 }}>
        <Text variant="bodyLarge">Bill Gates</Text>
        <View style={styles.messageContainer}>
          <Text style={{ flexShrink: 1 }} numberOfLines={1}>
            I plan to take over the world with my new operating system
          </Text>
          <Text> • 10:52 AM</Text>
        </View>
      </View>
    </View>
  );
}

export default function IndexScreen() {
  return (
    <ScrollView style={styles.container}>
      <ChatItem />
      <ChatItem />
      <ChatItem />
      <ChatItem />
      <ChatItem />
      <ChatItem />
      <ChatItem />
      <ChatItem />
      <ChatItem />
      <ChatItem />
      <ChatItem />
    </ScrollView>
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
  messageContainer: {
    flexDirection: "row",
  },
});
