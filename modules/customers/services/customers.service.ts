import {
  CustomerProfile,
} from '@/lib/types';
import {
  fetchCustomerProfile,
  upsertCustomerProfileDoc,
} from '../gateways/customers.gateway';

export type CustomerProfileInput = Omit<
  CustomerProfile,
  'id' | 'createdAt' | 'updatedAt'
>;

export async function getCustomerProfileById(
  customerId: string
): Promise<CustomerProfile | null> {
  return fetchCustomerProfile(customerId);
}

export async function upsertCustomerProfile(
  customerId: string,
  data: CustomerProfileInput
): Promise<CustomerProfile> {
  const existing = await fetchCustomerProfile(customerId);
  return upsertCustomerProfileDoc(customerId, data, existing || undefined);
}

