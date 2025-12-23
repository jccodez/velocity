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
  deleteField,
} from "firebase/firestore";
import { db } from "./config";

export interface SocialPost {
  id?: string;
  content: string;
  businessId: string;
  campaignId?: string;
  platform: string; // "facebook", "instagram", "twitter", etc.
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledDate?: Timestamp;
  publishedDate?: Timestamp;
  failureReason?: string; // Reason why post failed to publish
  mediaUrls?: string[]; // URLs to images/videos
  aiGenerated: boolean;
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const createPost = async (
  post: Omit<SocialPost, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  // Clean the data - remove undefined, null, and empty values
  const cleanedPost: any = {
    content: post.content,
    businessId: post.businessId,
    platform: post.platform,
    status: post.status,
    aiGenerated: post.aiGenerated,
    userId: post.userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Only include optional fields if they have values
  if (post.campaignId) {
    cleanedPost.campaignId = post.campaignId;
    console.log(`[createPost] Including campaignId: ${post.campaignId}`);
  }
  if (post.scheduledDate) {
    cleanedPost.scheduledDate = post.scheduledDate;
  }
  if (post.publishedDate) {
    cleanedPost.publishedDate = post.publishedDate;
  }
  if (post.mediaUrls && post.mediaUrls.length > 0) {
    cleanedPost.mediaUrls = post.mediaUrls;
  }

  const docRef = await addDoc(collection(db, "posts"), cleanedPost);
  return docRef.id;
};

export const updatePost = async (
  postId: string,
  updates: Partial<SocialPost> & { __deleteScheduledDate?: boolean }
): Promise<void> => {
  const postRef = doc(db, "posts", postId);
  
  // Clean the updates - remove undefined and null values
  const cleanedUpdates: any = {
    updatedAt: Timestamp.now(),
  };

  // Handle field deletion markers
  if (updates.__deleteScheduledDate) {
    cleanedUpdates.scheduledDate = deleteField();
  }

  Object.entries(updates).forEach(([key, value]) => {
    // Skip internal deletion markers and fields that should be deleted
    if (key.startsWith('__')) {
      return;
    }
    if (value !== undefined && value !== null) {
      // Handle empty arrays
      if (Array.isArray(value) && value.length === 0) {
        // Skip empty arrays
      } else {
        cleanedUpdates[key] = value;
      }
    }
  });

  await updateDoc(postRef, cleanedUpdates);
};

export const deletePost = async (postId: string): Promise<void> => {
  await deleteDoc(doc(db, "posts", postId));
};

export const getPostsByBusinessId = async (
  businessId: string
): Promise<SocialPost[]> => {
  const q = query(collection(db, "posts"), where("businessId", "==", businessId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    // Firestore Timestamps are already Timestamp objects, so we can return them as-is
    return {
      id: doc.id,
      ...data,
    } as SocialPost;
  });
};

export const getPostsByCampaignId = async (
  campaignId: string
): Promise<SocialPost[]> => {
  try {
    console.log(`[getPostsByCampaignId] Querying posts for campaign ${campaignId}`);
    const q = query(
      collection(db, "posts"),
      where("campaignId", "==", campaignId)
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as SocialPost;
    });
    console.log(`[getPostsByCampaignId] Found ${posts.length} post(s) for campaign ${campaignId}:`, posts.map(p => ({ id: p.id, content: p.content?.substring(0, 50) + "...", status: p.status })));
    return posts;
  } catch (error: any) {
    console.error(`[getPostsByCampaignId] Error querying posts for campaign ${campaignId}:`, error);
    if (error.code === 'permission-denied') {
      console.warn(`[getPostsByCampaignId] Permission denied - this might be a Firestore security rules issue`);
      // Try to get all user posts and filter client-side as fallback
      throw new Error(`Permission denied: Unable to query posts by campaign. Please check Firestore security rules.`);
    }
    throw error;
  }
};

export const getPostById = async (
  postId: string
): Promise<SocialPost | null> => {
  const docRef = doc(db, "posts", postId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as SocialPost;
  }
  return null;
};

