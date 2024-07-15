import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ToastAndroid,
} from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { CameraView, Camera } from "expo-camera";
import { useAuth, useFirestore } from "reactfire";
import { DocumentReference, doc, getDoc } from "firebase/firestore";
import { User } from "@/types";
import { router } from "expo-router";

export default function ScanScreen() {
  const { currentUser } = useAuth();
  if (currentUser === null) return null;
  const firestore = useFirestore();
  const { width, height } = useWindowDimensions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={async ({ data }) => {
          if (!data.startsWith("iacchat:")) return;
          const userId = data.replace(/^iacchat:/, "");
          if (userId === currentUser.uid) {
            ToastAndroid.show(
              "You cannot add yourself as a contact!",
              ToastAndroid.SHORT
            );
            return;
          }
          const userDoc = await getDoc(
            doc(firestore, "users", userId) as DocumentReference<User>
          );
          if (!userDoc.exists()) return;
          router.push(`/contacts?email=${userDoc.data().email}`);
        }}
        style={{
          position: "absolute",
          top: 0,
          transform: [{ translateX: width / 2 }],
          right: 0,
          bottom: 0,
          width: width * 2.5,
          height: height * 1.5,
        }}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
