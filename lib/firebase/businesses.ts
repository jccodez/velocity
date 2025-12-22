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
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";

export interface Business {
  id?: string;
  name: string;
  description?: string;
  website?: string;
  socialMediaAccounts?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  toneOfVoice?: string; // AI-learned tone
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const createBusiness = async (
  business: Omit<Business, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  // Clean up socialMediaAccounts - remove undefined values and empty strings
  let cleanedSocialMediaAccounts;
  if (business.socialMediaAccounts) {
    const cleaned = Object.entries(business.socialMediaAccounts).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && typeof value === 'string' && value.trim() !== "") {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );
    
    // Only include socialMediaAccounts if it has at least one value
    cleanedSocialMediaAccounts = Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  // Build the business data, omitting undefined fields
  const businessData: any = {
    name: business.name,
    userId: business.userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Only add optional fields if they have values
  if (business.description && business.description.trim() !== "") {
    businessData.description = business.description;
  }
  if (business.website && business.website.trim() !== "") {
    businessData.website = business.website;
  }
  if (cleanedSocialMediaAccounts) {
    businessData.socialMediaAccounts = cleanedSocialMediaAccounts;
  }
  if (business.toneOfVoice && business.toneOfVoice.trim() !== "") {
    businessData.toneOfVoice = business.toneOfVoice;
  }

  const docRef = await addDoc(collection(db, "businesses"), businessData);
  return docRef.id;
};

export const updateBusiness = async (
  businessId: string,
  updates: Partial<Business>
): Promise<void> => {
  const businessRef = doc(db, "businesses", businessId);
  
  // Clean up socialMediaAccounts if present
  let cleanedUpdates: any = { ...updates };
  if (cleanedUpdates.socialMediaAccounts) {
    const cleaned = Object.entries(cleanedUpdates.socialMediaAccounts).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && typeof value === 'string' && value.trim() !== "") {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );
    cleanedUpdates.socialMediaAccounts = Object.keys(cleaned).length > 0 ? cleaned : null;
  }

  // Remove undefined values
  Object.keys(cleanedUpdates).forEach(key => {
    if (cleanedUpdates[key] === undefined) {
      delete cleanedUpdates[key];
    }
  });

  cleanedUpdates.updatedAt = Timestamp.now();
  
  await updateDoc(businessRef, cleanedUpdates);
};

export const deleteBusiness = async (businessId: string): Promise<void> => {
  await deleteDoc(doc(db, "businesses", businessId));
};

export const getBusinessesByUserId = async (
  userId: string
): Promise<Business[]> => {
  const q = query(collection(db, "businesses"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Business[];
};

export const getBusinessById = async (
  businessId: string
): Promise<Business | null> => {
  const docRef = doc(db, "businesses", businessId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Business;
  }
  return null;
};

