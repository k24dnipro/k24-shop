'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/firebase';
import {
  createUserProfile,
  getUserById,
} from '@/modules/users/services/users.service';
import {
  User,
  UserPermissions,
} from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          let userData = await getUserById(fbUser.uid);
          if (!userData) {
            // Avoid a redirect race: auth can be signed-in before the Firestore profile exists.
            userData = await createUserProfile(fbUser);
          }
          setUser(userData);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkPermission = useCallback((permission: keyof UserPermissions): boolean => {
    if (!user) return false;
    return user.permissions[permission];
  }, [user]);

  const handleLogOut = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        hasPermission: checkPermission,
        logOut: handleLogOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

