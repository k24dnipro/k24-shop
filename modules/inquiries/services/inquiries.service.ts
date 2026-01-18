import { Inquiry } from '@/lib/types';
import {
  countInquiries,
  countNewInquiries,
  createInquiryDoc,
  deleteInquiryDoc,
  fetchInquiries,
  fetchInquiriesByStatus,
  fetchInquiryById,
  updateInquiryDoc,
} from '../gateways/inquiries.gateway';

// Get all inquiries
export async function getInquiries(): Promise<Inquiry[]> {
  return fetchInquiries();
}

// Get inquiries by status
export async function getInquiriesByStatus(status: Inquiry['status']): Promise<Inquiry[]> {
  return fetchInquiriesByStatus(status);
}

// Get inquiry by ID
export async function getInquiryById(id: string): Promise<Inquiry | null> {
  return fetchInquiryById(id);
}

// Create inquiry (from customer on frontend)
export async function createInquiry(
  inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  return createInquiryDoc({
    ...inquiryData,
    status: 'new',
  });
}

// Update inquiry status
export async function updateInquiryStatus(
  id: string,
  status: Inquiry['status'],
  assignedTo?: string
): Promise<void> {
  await updateInquiryDoc(id, {
    status,
    assignedTo,
  });
}

// Delete inquiry
export async function deleteInquiry(id: string): Promise<void> {
  return deleteInquiryDoc(id);
}

// Get new inquiries count
export async function getNewInquiriesCount(): Promise<number> {
  return countNewInquiries();
}

// Get inquiries count
export async function getInquiriesCount(): Promise<number> {
  return countInquiries();
}
