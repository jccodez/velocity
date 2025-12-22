import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  businessId: string;
  status: "draft" | "active" | "paused" | "completed";
  startDate?: Timestamp;
  endDate?: Timestamp;
  platforms: string[]; // e.g., ["facebook", "instagram", "twitter"]
  posts: string[]; // Array of post IDs
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const createCampaign = async (
  campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  const campaignData = {
    ...campaign,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, "campaigns"), campaignData);
  return docRef.id;
};

export const updateCampaign = async (
  campaignId: string,
  updates: Partial<Campaign>
): Promise<void> => {
  const campaignRef = doc(db, "campaigns", campaignId);
  await updateDoc(campaignRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCampaign = async (campaignId: string): Promise<void> => {
  await deleteDoc(doc(db, "campaigns", campaignId));
};

export const getCampaignsByBusinessId = async (
  businessId: string
): Promise<Campaign[]> => {
  const q = query(
    collection(db, "campaigns"),
    where("businessId", "==", businessId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Campaign[];
};

export const getCampaignById = async (
  campaignId: string
): Promise<Campaign | null> => {
  const docRef = doc(db, "campaigns", campaignId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Campaign;
  }
  return null;
};

