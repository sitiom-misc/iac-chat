import { Timestamp } from "firebase/firestore";

export type User = {
  id?: string;
  name: string;
  avatarUrl: string;
  createdAt: Timestamp;
  email: string;
  contacts: string[];
};
