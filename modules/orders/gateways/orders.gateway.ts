import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  Order,
  OrderStatus,
} from '@/lib/types';

const ORDERS_COLLECTION = 'orders';

interface FirestoreOrderData {
  customerId?: string;
  customerEmail?: string;
  customerInfo: Order['customerInfo'];
  items: Order['items'];
  totalPrice: number;
  totalItems: number;
  status: OrderStatus;
  createdAt: Timestamp;
}

const convertToOrder = (doc: QueryDocumentSnapshot): Order => {
  const data = doc.data() as FirestoreOrderData;
  return {
    id: doc.id,
    customerId: data.customerId,
    customerEmail: data.customerEmail,
    customerInfo: data.customerInfo,
    items: data.items,
    totalPrice: data.totalPrice,
    totalItems: data.totalItems,
    status: data.status,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
};

export const createOrderDoc = async (
  orderData: Omit<Order, 'id' | 'createdAt'>
): Promise<string> => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...orderData,
    createdAt: now,
  });
  return docRef.id;
};

export const fetchOrdersByCustomer = async (customerId: string): Promise<Order[]> => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToOrder);
};

