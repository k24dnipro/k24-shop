import { Timestamp } from 'firebase/firestore';
import {
  Order,
  OrderCustomerInfo,
  OrderItem,
} from '@/lib/types';
import {
  createOrderDoc,
  fetchOrdersByCustomer,
} from '../gateways/orders.gateway';

export interface CreateOrderInput {
  customerInfo: OrderCustomerInfo;
  items: OrderItem[];
  totalPrice: number;
  totalItems: number;
  customerId?: string;
  customerEmail?: string;
}

// Створити замовлення з корзини
export async function createOrderFromCart(input: CreateOrderInput): Promise<string> {
  const orderData: Omit<Order, 'id' | 'createdAt'> = {
    customerId: input.customerId,
    customerEmail: input.customerEmail,
    customerInfo: input.customerInfo,
    items: input.items,
    totalPrice: input.totalPrice,
    totalItems: input.totalItems,
    status: 'new',
  };

  return createOrderDoc(orderData);
}

// Отримати історію замовлень поточного користувача
export async function getOrdersForCustomer(customerId: string): Promise<Order[]> {
  return fetchOrdersByCustomer(customerId);
}

