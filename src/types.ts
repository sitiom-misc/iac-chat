import { Timestamp } from "firebase/firestore";

export type User = {
  id?: string;
  name: string;
  avatarUrl: string;
  createdAt: Timestamp;
  email: string;
};

export type Transaction = {
  id?: string;
  senderId: string;
  receiverId: string;
  amount: number;
  date: Timestamp;
};
