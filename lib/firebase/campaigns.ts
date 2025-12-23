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

/**
 * Auto-update campaign status based on start/end dates
 * Should be called periodically (e.g., via cron job or on campaign access)
 */
export const updateCampaignStatusByDates = async (
  campaignId: string
): Promise<{ updated: boolean; newStatus?: Campaign["status"] }> => {
  const campaign = await getCampaignById(campaignId);
  if (!campaign || !campaign.id) {
    return { updated: false };
  }

  const now = Timestamp.now();
  let newStatus: Campaign["status"] | null = null;

  // Check if campaign should be active
  if (campaign.startDate && campaign.endDate) {
    const startTime = campaign.startDate instanceof Timestamp
      ? campaign.startDate.toMillis()
      : new Date(campaign.startDate).getTime();
    const endTime = campaign.endDate instanceof Timestamp
      ? campaign.endDate.toMillis()
      : new Date(campaign.endDate).getTime();
    const nowTime = now.toMillis();

    if (nowTime >= startTime && nowTime <= endTime) {
      // Campaign should be active
      if (campaign.status !== "active" && campaign.status !== "paused") {
        newStatus = "active";
      }
    } else if (nowTime > endTime) {
      // Campaign should be completed
      if (campaign.status !== "completed") {
        newStatus = "completed";
      }
    } else if (nowTime < startTime) {
      // Campaign hasn't started yet
      if (campaign.status !== "draft") {
        newStatus = "draft";
      }
    }
  } else if (campaign.startDate) {
    // Only start date set
    const startTime = campaign.startDate instanceof Timestamp
      ? campaign.startDate.toMillis()
      : new Date(campaign.startDate).getTime();
    const nowTime = now.toMillis();

    if (nowTime >= startTime) {
      if (campaign.status !== "active" && campaign.status !== "paused") {
        newStatus = "active";
      }
    }
  } else if (campaign.endDate) {
    // Only end date set
    const endTime = campaign.endDate instanceof Timestamp
      ? campaign.endDate.toMillis()
      : new Date(campaign.endDate).getTime();
    const nowTime = now.toMillis();

    if (nowTime > endTime) {
      if (campaign.status !== "completed") {
        newStatus = "completed";
      }
    }
  }

  if (newStatus) {
    await updateCampaign(campaign.id, { status: newStatus });
    return { updated: true, newStatus };
  }

  return { updated: false };
};

/**
 * Get all campaigns that need status updates
 */
export const getAllCampaigns = async (): Promise<Campaign[]> => {
  const querySnapshot = await getDocs(collection(db, "campaigns"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Campaign[];
};
