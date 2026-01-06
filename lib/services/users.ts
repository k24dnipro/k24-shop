import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
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
import {
  auth,
  db,
} from '@/firebase';
import {
  DEFAULT_PERMISSIONS,
  User,
  UserPermissions,
  UserRole,
} from '../types';

const USERS_COLLECTION = 'users';

// Convert Firestore document to User
interface FirestoreUserData {
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
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
    lastLogin: data.lastLogin?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Get all users
export async function getUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map(convertToUser);
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const docRef = doc(db, USERS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return convertToUser(docSnap);
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  return convertToUser(snapshot.docs[0]);
}

// Create user in Firestore after Firebase Auth creation
export async function createUserProfile(
  firebaseUser: FirebaseUser,
  role: UserRole = 'viewer',
  displayName?: string
): Promise<User> {
  const now = Timestamp.now();
  
  const userData: Omit<User, 'id'> = {
    email: firebaseUser.email || '',
    displayName: displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
    photoURL: firebaseUser.photoURL || null,
    role,
    permissions: DEFAULT_PERMISSIONS[role],
    isActive: true,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };

  await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), {
    ...userData,
    createdAt: now,
    updatedAt: now,
  });

  return { id: firebaseUser.uid, ...userData };
}

// Update user profile
export async function updateUserProfile(id: string, updates: Partial<User>): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  
  // Filter out undefined values (Firestore doesn't accept undefined)
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  
  await updateDoc(docRef, {
    ...cleanUpdates,
    updatedAt: Timestamp.now(),
  });
}

// Update user role (and permissions)
export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  await updateUserProfile(id, {
    role,
    permissions: DEFAULT_PERMISSIONS[role],
  });
}

// Update user permissions (custom permissions)
export async function updateUserPermissions(id: string, permissions: UserPermissions): Promise<void> {
  await updateUserProfile(id, { permissions });
}

// Deactivate user
export async function deactivateUser(id: string): Promise<void> {
  await updateUserProfile(id, { isActive: false });
}

// Activate user
export async function activateUser(id: string): Promise<void> {
  await updateUserProfile(id, { isActive: true });
}

// Delete user
export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(db, USERS_COLLECTION, id));
}

// Update last login
export async function updateLastLogin(id: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  await updateDoc(docRef, {
    lastLogin: Timestamp.now(),
  });
}

// ---- Auth Functions ----

// Sign up
export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  // Create user profile in Firestore
  // First user becomes admin, others start as viewers
  const usersCount = (await getDocs(collection(db, USERS_COLLECTION))).size;
  const role: UserRole = usersCount === 0 ? 'admin' : 'viewer';
  
  return createUserProfile(userCredential.user, role, displayName);
}

// Sign in
export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Get or create user profile
  let user = await getUserById(userCredential.user.uid);
  
  if (!user) {
    // Create user profile if doesn't exist (shouldn't happen normally)
    user = await createUserProfile(userCredential.user);
  }

  // Check if user is active
  if (!user.isActive) {
    await signOut(auth);
    throw new Error('Ваш акаунт деактивовано. Зверніться до адміністратора.');
  }

  // Update last login
  await updateLastLogin(user.id);

  return user;
}

// Sign out
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Get current auth user
export function getCurrentAuthUser(): FirebaseUser | null {
  return auth.currentUser;
}

// Check if user has permission
export function hasPermission(user: User | null, permission: keyof UserPermissions): boolean {
  if (!user) return false;
  return user.permissions[permission];
}

// Get users count
export async function getUsersCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.size;
}

