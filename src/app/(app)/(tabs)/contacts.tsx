import { Room, User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
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

export default function ContactScreen() {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return null;
  }

  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

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
  const [isdialogOpened, setDialogOpened] = useState<boolean>(!!emailParam);
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
    setValue,
  } = useForm<z.infer<typeof validUserSchema>>({
    resolver: zodResolver(validUserSchema),
    mode: "onChange",
    defaultValues: {
      email: emailParam,
    },
  });
  const email = watch("email");

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful]);

  if (!!emailParam && emailParam !== email) {
    setValue("email", emailParam, {
      shouldTouch: true,
      shouldValidate: true,
      shouldDirty: true,
    });
  }

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
          visible={isdialogOpened || !!emailParam}
          onDismiss={() => {
            setDialogOpened(false);
            router.setParams({ email: "" });
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
                  onChangeText={(text) => {
                    onChange(text);
                    router.setParams({ email: text });
                  }}
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
                setDialogOpened(false);
                router.setParams({ email: "" });
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
        renderItem={({ item }) => <ContactItem userId={item} />}
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
            onPress: () => setDialogOpened(true),
          },
          {
            icon: "qrcode-scan",
            label: "Scan QR",
            onPress: () => router.push("/scan"),
          },
        ]}
        onStateChange={({ open }) => setFabState({ open })}
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
});
