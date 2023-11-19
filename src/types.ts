import { Timestamp } from "firebase/firestore";

export type User = {
  id?: string;
  name: string;
  avatarUrl: string;
  createdAt: Timestamp;
  email: string;
  contacts: string[];
};

export type Room = {
  id?: string;
  name?: string;
  lastUpdated: Timestamp;
  members: string[];
  iconUrl?: string;
};

export type Message = {
  id?: string;
  createdAt: Timestamp;
  content: string;
  from: string;
};
