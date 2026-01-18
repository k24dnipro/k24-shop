import {
  DocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';

export const handleDocumentSnapshot = <T>(snapshot: DocumentSnapshot): T => {
  if (!snapshot.exists()) {
    throw new Error(`Document ${snapshot.ref.path} not found`);
  }
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as T;
};

export const handleCollectionSnapshot = <T>(snapshot: QuerySnapshot): T[] => {
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};
