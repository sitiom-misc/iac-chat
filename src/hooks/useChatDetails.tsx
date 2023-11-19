import { Room } from "@/types";
import { doc } from "firebase/firestore";
import { ImageSourcePropType } from "react-native";
import { useAuth, useFirestore, useFirestoreDocData } from "reactfire";
function useChatDetails(
  room: Room
):
  | { status: "loading"; roomName?: undefined; iconUrl?: undefined }
  | { status: "error"; roomName?: undefined; iconUrl?: undefined }
  | { status: "success"; roomName: string; iconUrl: ImageSourcePropType } {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return { status: "error" };
  }
  const firestore = useFirestore();

  let roomName: string;
  let iconUrl: ImageSourcePropType;
  if (room.members.length === 2) {
    const otherUserId = room.members.find((id) => id !== currentUser.uid);
    if (!otherUserId) return { status: "error" };
    const userDoc = doc(firestore, `users/${otherUserId}`);
    const { status, data: user } = useFirestoreDocData(userDoc, {
      idField: "id",
    });
    if (status === "loading") {
      return { status: "loading" };
    }
    if (!user) {
      return { status: "error" };
    }

    roomName = user.name;
    iconUrl = user.avatarUrl
      ? { uri: user.avatarUrl }
      : require("@/assets/images/avatar-2.png");
  } else {
    roomName = room.name ?? "Unnamed group";
    iconUrl = room.iconUrl
      ? { uri: room.iconUrl }
      : require("@/assets/images/group_chat.png");
  }
  return { status: "success", roomName, iconUrl };
}

export default useChatDetails;
