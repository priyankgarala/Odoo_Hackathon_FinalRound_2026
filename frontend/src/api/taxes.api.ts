import { api } from "./client";

export type TaxType = "GST" | "OTHER";

export type Tax = {
  id: number;
  name: string;
  rate: string;
  type: TaxType;
  salesAccountId: number;
  purchaseAccountId: number;
  salesAccount?: { id: number; code: string; name: string };
  purchaseAccount?: { id: number; code: string; name: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaxInput = {
  name: string;
  rate: number;
  type?: TaxType;
  salesAccountId: number;
  purchaseAccountId: number;
  isActive?: boolean;
};

export type TaxList = {
  data: Tax[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type TaxFilters = {
  search?: string;
  isActive?: "true" | "false";
  type?: TaxType;
  page?: number;
  pageSize?: number;
};

export const getTaxes = async (params?: TaxFilters) => {
  const query = params
    ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""))
    : {};
  return (await api.get<TaxList>("/taxes", { params: query })).data;
};

export const getTax = async (id: number) =>
  (await api.get<{ data: Tax }>(`/taxes/${id}`)).data.data;

export const createTax = async (input: TaxInput) =>
  (await api.post<{ data: Tax }>("/taxes", input)).data.data;

export const updateTax = async ({ id, input }: { id: number; input: TaxInput }) =>
  (await api.put<{ data: Tax }>(`/taxes/${id}`, input)).data.data;

export const setTaxStatus = async ({ id, isActive }: { id: number; isActive: boolean }) =>
  (await api.patch<{ data: Tax }>(`/taxes/${id}/status`, { isActive })).data.data;
