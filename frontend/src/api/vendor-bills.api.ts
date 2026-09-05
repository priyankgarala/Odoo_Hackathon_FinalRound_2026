import { api } from "./client";

export type TaxLineSnapshot = {
  id: number;
  taxId?: number | null;
  taxName: string;
  taxType: string;
  rate: string;
  taxableAmount: string;
  taxAmount: string;
  jurisdiction: string;
};

export type VendorBillItem = {
  id: number;
  productSku: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  lineSubtotal: string;
  taxAmount: string;
  lineTotal: string;
  taxLines?: TaxLineSnapshot[];
};

export type VendorBill = {
  id: number;
  billNumber: string;
  billDate?: string;
  dueDate?: string;
  referenceId?: string | null;
  status: "POSTED" | "PAID" | "CANCELLED";
  subtotal: string;
  taxTotal: string;
  total: string;
  paidAmount: string;
  outstanding: string;
  vendor: { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null };
  purchaseOrder: { id: number; orderNumber: string };
  journalEntry?: { id: number; entryNumber: string };
  items?: VendorBillItem[];
  payments?: Array<{ id: number; paymentNumber: string; amount: string; paymentMethod: string; reference: string | null; journalEntry: { id: number; entryNumber: string } }>;
  createdAt?: string;
  _count?: { items: number; payments: number };
};

export type BillList = { data: VendorBill[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

export const getBills = async (params: { status?: string; page: number; pageSize: number }) => (await api.get<BillList>("/vendor-bills", { params })).data;
export const getBill = async (id: number) => (await api.get<{ data: VendorBill }>(`/vendor-bills/${id}`)).data.data;
export const generateBill = async (purchaseOrderId: number) => (await api.post<{ data: VendorBill }>("/vendor-bills/generate", { purchaseOrderId })).data.data;
export const payBill = async ({ id, amount, paymentMethod, reference }: { id: number; amount: number; paymentMethod: string; reference?: string }) => (await api.post<{ data: VendorBill }>(`/vendor-bills/${id}/payments`, { amount, paymentMethod, reference })).data.data;
