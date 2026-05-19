import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/index';
import { CustomerProfile } from '@/lib/types';

const CUSTOMERS_COLLECTION = 'customers';

export const getCustomersPath = () => CUSTOMERS_COLLECTION;
export const getCustomerPath = (customerId: string) =>
  `${getCustomersPath()}/${customerId}`;

interface FirestoreCustomerData {
  name: string;
  phone?: string;
  city?: string;
  address?: string;
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const convertToCustomerProfile = (
  id: string,
  data: FirestoreCustomerData
): CustomerProfile => {
  return {
    id,
    name: data.name,
    phone: data.phone,
    city: data.city,
    address: data.address,
    email: data.email,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

export const fetchCustomerProfile = async (
  customerId: string
): Promise<CustomerProfile | null> => {
  const ref = doc(db, getCustomerPath(customerId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as FirestoreCustomerData;
  return convertToCustomerProfile(snap.id, data);
};

export const upsertCustomerProfileDoc = async (
  customerId: string,
  profile: Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'>,
  existing?: CustomerProfile | null
): Promise<CustomerProfile> => {
  const now = Timestamp.now();
  const ref = doc(collection(db, getCustomersPath()), customerId);

  const payload: Partial<FirestoreCustomerData> & {
    name: string;
    email: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  } = {
    name: profile.name,
    email: profile.email,
    createdAt: existing
      ? Timestamp.fromDate(existing.createdAt)
      : now,
    updatedAt: now,
  };

  if (profile.phone !== undefined) payload.phone = profile.phone;
  if (profile.city !== undefined) payload.city = profile.city;
  if (profile.address !== undefined) payload.address = profile.address;

  await setDoc(ref, payload, { merge: true });

  return {
    id: customerId,
    name: profile.name,
    phone: profile.phone !== undefined ? profile.phone : existing?.phone,
    city: profile.city !== undefined ? profile.city : existing?.city,
    address: profile.address !== undefined ? profile.address : existing?.address,
    email: profile.email,
    createdAt: existing?.createdAt || now.toDate(),
    updatedAt: now.toDate(),
  };
};

