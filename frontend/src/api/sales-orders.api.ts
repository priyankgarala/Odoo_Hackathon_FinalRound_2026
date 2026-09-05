import { api } from "./client";

export type SalesOrderItem = {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  taxId?: number | null;
  tax?: { id: number; name: string; rate: string; type: string } | null;
  lineSubtotal: string;
  taxAmount: string;
  lineTotal: string;
};

export type SalesOrder = {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  notes?: string | null;
  subtotal: string;
  taxTotal: string;
  total: string;
  customer: { id: number; name: string; email?: string; phone?: string };
  items?: SalesOrderItem[];
  _count?: { items: number };
};

export type SalesOrderItemInput = {
  productId: number;
  quantity: number;
  unitPrice?: number;
  taxId?: number | null;
  taxRate?: number;
};

export type SalesOrderInput = {
  customerId: number;
  orderDate?: string;
  notes?: string | null;
  items: SalesOrderItemInput[];
};

export const getSalesOrders = async (params: { status?: string; search?: string; page: number; pageSize: number }) =>
  (await api.get<{ data: SalesOrder[]; meta: { page: number; totalPages: number; total: number } }>("/sales-orders", { params })).data;

export const getSalesOrder = async (id: number) =>
  (await api.get<{ data: SalesOrder }>(`/sales-orders/${id}`)).data.data;

export const setSalesOrderStatus = async ({ id, status }: { id: number; status: "CONFIRMED" | "CANCELLED" }) =>
  (await api.patch<{ data: SalesOrder }>(`/sales-orders/${id}/status`, { status })).data.data;

export const createSalesOrder = async (input: SalesOrderInput) =>
  (await api.post<{ data: SalesOrder }>("/sales-orders", input)).data.data;

export const updateSalesOrder = async ({ id, input }: { id: number; input: SalesOrderInput }) =>
  (await api.put<{ data: SalesOrder }>(`/sales-orders/${id}`, input)).data.data;
