import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./config";

import { Timestamp } from "firebase/firestore";

export interface FacebookConnection {
  businessId: string;
  userId: string; // Owner of the business
  accessToken: string;
  pageId?: string;
  pageName?: string;
  connectedAt: Date | Timestamp;
  expiresAt?: Date | Timestamp;
}

/**
 * Store Facebook access token for a business
 */
export const saveFacebookToken = async (
  businessId: string,
  userId: string,
  accessToken: string,
  pageId?: string,
  pageName?: string
): Promise<void> => {
  const connectionRef = doc(db, "facebook_connections", businessId);
  
  await setDoc(connectionRef, {
    businessId,
    userId,
    accessToken,
    pageId,
    pageName,
    connectedAt: Timestamp.now(),
  });
};

/**
 * Get Facebook access token for a business
 */
export const getFacebookToken = async (
  businessId: string
): Promise<string | null> => {
  const connectionRef = doc(db, "facebook_connections", businessId);
  const docSnap = await getDoc(connectionRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.accessToken || null;
  }
  
  return null;
};

/**
 * Get Facebook connection details for a business
 */
export const getFacebookConnection = async (
  businessId: string
): Promise<FacebookConnection | null> => {
  const connectionRef = doc(db, "facebook_connections", businessId);
  const docSnap = await getDoc(connectionRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      businessId: data.businessId,
      userId: data.userId,
      accessToken: data.accessToken,
      pageId: data.pageId,
      pageName: data.pageName,
      connectedAt: data.connectedAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate(),
    };
  }
  
  return null;
};

/**
 * Get all Facebook connections for a user's businesses
 */
export const getFacebookConnectionsByUserId = async (
  userId: string
): Promise<FacebookConnection[]> => {
  const q = query(
    collection(db, "facebook_connections"),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      businessId: data.businessId,
      userId: data.userId,
      accessToken: data.accessToken,
      pageId: data.pageId,
      pageName: data.pageName,
      connectedAt: data.connectedAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate(),
    };
  });
};

/**
 * Disconnect Facebook account for a business
 */
export const disconnectFacebook = async (businessId: string): Promise<void> => {
  const connectionRef = doc(db, "facebook_connections", businessId);
  await deleteDoc(connectionRef);
};

