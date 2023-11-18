import { View, StyleSheet, ScrollView } from "react-native";
import { Avatar, FAB, Text } from "react-native-paper";

function ContactItem() {
  return (
    <View style={styles.itemContainer}>
      <Avatar.Image
        size={40}
        source={{
          uri: "https://pbs.twimg.com/profile_images/1674815862879178752/nTGMV1Eo_400x400.jpg",
        }}
      />
      <View style={{ flex: 1 }}>
        <View>
          <Text variant="titleMedium">Bill Gates</Text>
          <Text numberOfLines={1}>bill.gates@iacademy.edu.ph</Text>
        </View>
      </View>
    </View>
  );
}

export default function ContactScreen() {
  return (
    <>
      <ScrollView style={styles.container}>
        <ContactItem />
        <ContactItem />
        <ContactItem />
        <ContactItem />
        <ContactItem />
        <ContactItem />
        <ContactItem />
        <ContactItem />
        <ContactItem />
        <ContactItem />
        <ContactItem />
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log("Pressed")}
      />
    </>
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
