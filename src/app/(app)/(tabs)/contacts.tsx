import { Room, User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import {
  CollectionReference,
  DocumentReference,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, StyleSheet, FlatList } from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Dialog,
  FAB,
  HelperText,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
} from "react-native-paper";
import {
  useAuth,
  useFirestore,
  useFirestoreCollectionData,
  useFirestoreDocData,
} from "reactfire";
import ConfettiCannon from "react-native-confetti-cannon";
import { z } from "zod";
import { RectButton, Swipeable } from "react-native-gesture-handler";

export default function ContactScreen() {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return null;
  }

  const firestore = useFirestore();
  const deleteContact = async (contactId: string) => {
    const updatedContacts = userData.contacts.filter((id) => id !== contactId);
    await updateDoc(userDoc, { contacts: updatedContacts });
  };

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
  const [isDialogvisible, setDialogVisible] = useState(false);
  const [isConfettiVisible, setConfettiVisible] = useState(false);
  const [fabState, setFabState] = useState({ open: false });
  const { open } = fabState;

  const validUserSchema = z.object({
    email: z
      .string()
      .email()
      .refine(
        (email) => email !== currentUser.email,
        "You cannot add yourself as a contact"
      )
      .refine(async (email) => {
        const userQuery = query(
          collection(firestore, "users") as CollectionReference<User>,
          where("email", "==", email),
          limit(1)
        );
        const userSnap = await getDocs(userQuery);
        return !userSnap.empty;
      }, "User does not exist")
      .refine(async (email) => {
        const userQuery = query(
          collection(firestore, "users") as CollectionReference<User>,
          where("email", "==", email),
          limit(1)
        );
        const userSnap = await getDocs(userQuery);
        if (userSnap.empty) {
          return false;
        }
        const userId = userSnap.docs[0].id ?? "";
        return !userData.contacts.includes(userId);
      }, "User is already in your contacts"),
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting, isValid, isSubmitSuccessful },
    reset,
  } = useForm<z.infer<typeof validUserSchema>>({
    resolver: zodResolver(validUserSchema),
    mode: "onChange",
  });
  const email = watch("email");

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful]);

  if (userDataStatus === "loading") {
    return <ActivityIndicator />;
  }
  if (!userData) {
    return null;
  }

  const UserProfile = ({ email }: { email: string }) => {
    const userQuery = query(
      collection(firestore, "users") as CollectionReference<User>,
      where("email", "==", email),
      limit(1)
    );

    const { status: userStatus, data: userResults } =
      useFirestoreCollectionData(userQuery, {
        idField: "id",
      });
    if (userStatus === "loading") {
      return <ActivityIndicator />;
    }
    if (!userResults || userResults.length === 0) {
      return null;
    }

    const user = userResults[0];

    return (
      <>
        <Avatar.Image
          size={60}
          source={
            user.avatarUrl
              ? { uri: user.avatarUrl }
              : require("@/assets/images/avatar-2.png")
          }
        />
        <Text variant="bodyLarge">{user.name}</Text>
      </>
    );
  };

  return (
    <>
      {isConfettiVisible && (
        <ConfettiCannon
          count={100}
          origin={{ x: -10, y: 0 }}
          fadeOut={true}
          onAnimationEnd={() => setConfettiVisible(false)}
        />
      )}
      <Portal>
        <Dialog
          visible={isDialogvisible}
          onDismiss={() => {
            setDialogVisible(false);
            reset();
          }}
        >
          <Dialog.Title style={{ textAlign: "center" }}>
            Add Contact
          </Dialog.Title>
          <Dialog.Content>
            <View style={{ alignItems: "center", margin: 20, gap: 8 }}>
              {(email && !errors.email) ||
              errors.email?.message === "User is already in your contacts" ||
              errors.email?.message ===
                "You cannot add yourself as a contact" ? (
                <UserProfile email={email} />
              ) : (
                <Avatar.Image
                  size={60}
                  source={require("@/assets/images/avatar-2.png")}
                />
              )}
            </View>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
                  onBlur={onBlur}
                  keyboardType="email-address"
                  onChangeText={onChange}
                  value={value}
                  error={!!errors.email}
                />
              )}
              name="email"
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email && errors.email.message}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={handleSubmit(async ({ email }) => {
                // Add user to contacts
                const userQuery = query(
                  collection(firestore, "users") as CollectionReference<User>,
                  where("email", "==", email),
                  limit(1)
                );
                const userSnap = await getDocs(userQuery);
                if (userSnap.empty) {
                  return;
                }
                const userId = userSnap.docs[0].id ?? "";
                await updateDoc(userDoc, {
                  contacts: [...userData.contacts, userId],
                });
                setDialogVisible(false);
                setConfettiVisible(true);
              })}
              disabled={!isValid || isSubmitting}
            >
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <FlatList
        style={styles.container}
        data={userData.contacts}
        renderItem={({ item }) => (
          <SwipeableContactItem
            userId={item}
            onDelete={() => deleteContact(item)}
          />
        )}
        keyExtractor={(item) => item}
      />

      <FAB.Group
        open={open}
        visible
        icon={open ? "close" : "plus"}
        actions={[
          {
            icon: "email",
            label: "Email",
            onPress: () => setDialogVisible(true),
          },
          {
            icon: "qrcode-scan",
            label: "Scan QR",
            onPress: () => console.log("Pressed QR Code scan"),
          },
        ]}
        onStateChange={({ open }) => setFabState({ open })}
      />
    </>
  );
}

const SwipeableContactItem = ({
  userId,
  onDelete,
}: {
  userId: string;
  onDelete: () => void;
}) => {
  const renderRightActions = () => (
    <RectButton
      style={styles.deleteButton}
      onPress={() => {
        onDelete();
      }}
    >
      <FAB icon="delete" style={{ backgroundColor: "#6e0000" }} />
    </RectButton>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <ContactItem userId={userId} />
    </Swipeable>
  );
};

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
  deleteButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
  },
});
