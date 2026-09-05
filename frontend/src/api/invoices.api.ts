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

export type InvoiceItem = {
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

export type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: "POSTED" | "PAID" | "CANCELLED";
  subtotal: string;
  taxTotal: string;
  total: string;
  paidAmount: string;
  outstanding: string;
  customer: { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null };
  salesOrder: { id: number; orderNumber: string };
  journalEntry?: { id: number; entryNumber: string };
  items?: InvoiceItem[];
  payments?: Array<{ id: number; paymentNumber: string; amount: string; paymentMethod: string; reference: string | null; paymentDate: string; journalEntry: { id: number; entryNumber: string } }>;
  _count?: { items: number; payments: number };
};

type InvoiceList = { data: Invoice[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

export const getInvoices = async (params: { status?: string; search?: string; page: number; pageSize: number }) => (await api.get<InvoiceList>("/invoices", { params })).data;
export const getInvoice = async (id: number) => (await api.get<{ data: Invoice }>(`/invoices/${id}`)).data.data;
export const generateInvoice = async (salesOrderId: number) => (await api.post<{ data: Invoice }>("/invoices/generate", { salesOrderId })).data.data;
export const payInvoice = async ({ id, amount, paymentMethod, reference, paymentDate }: { id: number; amount: number; paymentMethod: string; reference?: string; paymentDate?: string }) => (await api.post<{ data: Invoice }>(`/invoices/${id}/payments`, { amount, paymentMethod, reference, paymentDate })).data.data;
