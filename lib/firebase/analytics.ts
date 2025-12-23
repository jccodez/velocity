import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

export interface PostAnalytics {
  id?: string;
  postId: string;
  businessId: string;
  platform: string;
  facebookPostId?: string; // The ID returned by Facebook when published
  likes?: number;
  comments?: number;
  shares?: number;
  reactions?: number;
  clicks?: number;
  impressions?: number;
  reach?: number;
  engagement?: number; // Calculated: (likes + comments + shares) / impressions
  lastUpdated?: Timestamp;
  createdAt?: Timestamp;
}

export const createOrUpdatePostAnalytics = async (
  analytics: Omit<PostAnalytics, "id" | "createdAt" | "lastUpdated">
): Promise<string> => {
  // Check if analytics already exists for this post
  const existingQuery = query(
    collection(db, "post_analytics"),
    where("postId", "==", analytics.postId)
  );
  const existingDocs = await getDocs(existingQuery);

  if (!existingDocs.empty) {
    // Update existing analytics
    const existingDoc = existingDocs.docs[0];
    await updateDoc(doc(db, "post_analytics", existingDoc.id), {
      ...analytics,
      lastUpdated: Timestamp.now(),
    });
    return existingDoc.id;
  } else {
    // Create new analytics
    const analyticsData = {
      ...analytics,
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "post_analytics"), analyticsData);
    return docRef.id;
  }
};

export const getAnalyticsByPostId = async (
  postId: string
): Promise<PostAnalytics | null> => {
  const q = query(
    collection(db, "post_analytics"),
    where("postId", "==", postId)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PostAnalytics;
  }
  return null;
};

export const getAnalyticsByBusinessId = async (
  businessId: string
): Promise<PostAnalytics[]> => {
  const q = query(
    collection(db, "post_analytics"),
    where("businessId", "==", businessId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PostAnalytics[];
};

export const getAnalyticsByCampaignId = async (
  campaignId: string
): Promise<PostAnalytics[]> => {
  // First get all posts for the campaign
  const { getPostsByCampaignId } = await import("./posts");
  const posts = await getPostsByCampaignId(campaignId);
  
  if (posts.length === 0) return [];
  
  // Get analytics for all posts
  const postIds = posts.map(p => p.id).filter(Boolean) as string[];
  const allAnalytics: PostAnalytics[] = [];
  
  for (const postId of postIds) {
    const analytics = await getAnalyticsByPostId(postId);
    if (analytics) {
      allAnalytics.push(analytics);
    }
  }
  
  return allAnalytics;
};

