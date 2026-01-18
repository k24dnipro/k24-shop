import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Inquiry } from '@/lib/types'; // Using lib/types for now

const INQUIRIES_COLLECTION = 'inquiries';

export const getInquiriesPath = () => INQUIRIES_COLLECTION;
export const getInquiryPath = (inquiryId: string) => `${getInquiriesPath()}/${inquiryId}`;

// Convert Firestore document to Inquiry
const convertToInquiry = (doc: any): Inquiry => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Inquiry;
};

// Gateways
export const fetchInquiries = async (): Promise<Inquiry[]> => {
  const q = query(collection(db, getInquiriesPath()), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToInquiry);
};

export const fetchInquiriesByStatus = async (status: Inquiry['status']): Promise<Inquiry[]> => {
  const q = query(
    collection(db, getInquiriesPath()),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToInquiry);
};

export const fetchInquiryById = async (id: string): Promise<Inquiry | null> => {
  const docRef = doc(db, getInquiryPath(id));
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return convertToInquiry(docSnap);
};

export const createInquiryDoc = async (
  inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, getInquiriesPath()), {
    ...inquiryData,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateInquiryDoc = async (id: string, updates: Partial<Inquiry>): Promise<void> => {
  const docRef = doc(db, getInquiryPath(id));
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteInquiryDoc = async (id: string): Promise<void> => {
  const docRef = doc(db, getInquiryPath(id));
  await deleteDoc(docRef);
};

export const countNewInquiries = async (): Promise<number> => {
  const q = query(collection(db, getInquiriesPath()), where('status', '==', 'new'));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const countInquiries = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, getInquiriesPath()));
  return snapshot.size;
};
