import {
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  User,
  UserApprovalStatus,
  UserPermissions,
  UserRole,
} from '@/lib/types'; // Using lib/types for now

const USERS_COLLECTION = 'users';

// Convert Firestore document to User
interface FirestoreUserData {
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  approvalStatus?: UserApprovalStatus;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const convertToUser = (doc: DocumentSnapshot): User => {
  const data = doc.data() as FirestoreUserData;
  return {
    id: doc.id,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role: data.role,
    permissions: data.permissions,
    isActive: data.isActive,
    approvalStatus: data.approvalStatus ?? 'approved',
    lastLogin: data.lastLogin?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

export const getUsersPath = () => USERS_COLLECTION;
export const getUserPath = (userId: string) => `${getUsersPath()}/${userId}`;

// Gateways
export const fetchUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, getUsersPath()));
  return snapshot.docs.map(convertToUser);
};

export const fetchUserById = async (id: string): Promise<User | null> => {
  const docRef = doc(db, getUserPath(id));
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return convertToUser(docSnap);
};

export const fetchUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(collection(db, getUsersPath()), where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  return convertToUser(snapshot.docs[0]);
};

export const createUserDoc = async (id: string, userData: Omit<User, 'id'>): Promise<void> => {
  const now = Timestamp.now();
  await setDoc(doc(db, getUserPath(id)), {
    ...userData,
    createdAt: now,
    updatedAt: now,
  });
};

export const updateUserDoc = async (id: string, updates: Record<string, any>): Promise<void> => {
  const docRef = doc(db, getUserPath(id));
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteUserDoc = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, getUserPath(id)));
};

export const countUsers = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, getUsersPath()));
  return snapshot.size;
};
