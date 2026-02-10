import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
} from '@/firebase';
import {
  DEFAULT_PERMISSIONS,
  User,
  UserPermissions,
  UserRole,
} from '@/lib/types';
import {
  countUsers,
  createUserDoc,
  deleteUserDoc,
  fetchUserByEmail,
  fetchUserById,
  fetchUsers,
  updateUserDoc,
} from '../gateways/users.gateway';

// Get all users
export async function getUsers(): Promise<User[]> {
  return fetchUsers();
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  return fetchUserById(id);
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  return fetchUserByEmail(email);
}

// Create user in Firestore after Firebase Auth creation
export async function createUserProfile(
  firebaseUser: FirebaseUser,
  role: UserRole = 'viewer',
  displayName?: string,
  approvalStatus: User['approvalStatus'] = 'approved'
): Promise<User> {
  const now = Timestamp.now();
  const isApproved = approvalStatus === 'approved';

  const userData: Omit<User, 'id'> = {
    email: firebaseUser.email || '',
    displayName: displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
    photoURL: firebaseUser.photoURL || null,
    role,
    permissions: DEFAULT_PERMISSIONS[role],
    isActive: isApproved,
    approvalStatus,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };

  await createUserDoc(firebaseUser.uid, userData);

  return { id: firebaseUser.uid, ...userData };
}

// Update user profile
export async function updateUserProfile(id: string, updates: Partial<User>): Promise<void> {
  // Filter out undefined values (Firestore doesn't accept undefined)
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  
  await updateUserDoc(id, cleanUpdates);
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

// Одобрити заявку користувача (дозволити вхід в адмінку)
export async function approveUser(id: string): Promise<void> {
  await updateUserProfile(id, { approvalStatus: 'approved', isActive: true });
}

// Delete user
export async function deleteUser(id: string): Promise<void> {
  await deleteUserDoc(id);
}

// Update last login
export async function updateLastLogin(id: string): Promise<void> {
  await updateUserDoc(id, {
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

  // First user becomes admin and is approved; others need manager approval
  const usersCount = await countUsers();
  const isFirstUser = usersCount === 0;
  const role: UserRole = isFirstUser ? 'admin' : 'viewer';
  const approvalStatus: User['approvalStatus'] = isFirstUser ? 'approved' : 'pending';

  return createUserProfile(userCredential.user, role, displayName, approvalStatus);
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

  // Заявка ще не одобрена — не пускати в адмінку
  if (user.approvalStatus === 'pending') {
    await signOut(auth);
    throw new Error('Ваша заявка очікує підтвердження адміністратором.');
  }

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
export async function resetPassword(email: string, continueUrl?: string): Promise<void> {
  const actionCodeSettings = continueUrl
    ? {
        url: continueUrl,
        handleCodeInApp: false,
      }
    : undefined;

  await sendPasswordResetEmail(auth, email, actionCodeSettings);
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
  return countUsers();
}
