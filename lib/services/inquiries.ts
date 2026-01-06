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
import { Inquiry } from '../types';

const INQUIRIES_COLLECTION = 'inquiries';

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

// Get all inquiries
export async function getInquiries(): Promise<Inquiry[]> {
  const q = query(collection(db, INQUIRIES_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToInquiry);
}

// Get inquiries by status
export async function getInquiriesByStatus(status: Inquiry['status']): Promise<Inquiry[]> {
  const q = query(
    collection(db, INQUIRIES_COLLECTION),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToInquiry);
}

// Get inquiry by ID
export async function getInquiryById(id: string): Promise<Inquiry | null> {
  const docRef = doc(db, INQUIRIES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return convertToInquiry(docSnap);
}

// Create inquiry (from customer on frontend)
export async function createInquiry(
  inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  const now = Timestamp.now();
  
  const docRef = await addDoc(collection(db, INQUIRIES_COLLECTION), {
    ...inquiryData,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

// Update inquiry status
export async function updateInquiryStatus(
  id: string,
  status: Inquiry['status'],
  assignedTo?: string
): Promise<void> {
  const docRef = doc(db, INQUIRIES_COLLECTION, id);
  await updateDoc(docRef, {
    status,
    assignedTo,
    updatedAt: Timestamp.now(),
  });
}

// Delete inquiry
export async function deleteInquiry(id: string): Promise<void> {
  await deleteDoc(doc(db, INQUIRIES_COLLECTION, id));
}

// Get new inquiries count
export async function getNewInquiriesCount(): Promise<number> {
  const q = query(collection(db, INQUIRIES_COLLECTION), where('status', '==', 'new'));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Get inquiries count
export async function getInquiriesCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, INQUIRIES_COLLECTION));
  return snapshot.size;
}

