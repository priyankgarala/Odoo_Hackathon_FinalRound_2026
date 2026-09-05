import { api } from "./client";
export type Product = { id: number; sku: string; name: string; description: string | null; unitPrice: string; active: boolean; createdAt: string; updatedAt: string };
export type ProductInput = { sku: string; name: string; description: string | null; unitPrice: number };
export type ProductList = { data: Product[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };
export type ProductFilters = { search?: string; active?: "true" | "false"; page: number; pageSize: number };
export const getProducts = async (params: ProductFilters) => (await api.get<ProductList>("/products", { params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== "")) })).data;
export const createProduct = async (input: ProductInput) => (await api.post<{ data: Product }>("/products", input)).data.data;
export const updateProduct = async ({ id, input }: { id: number; input: ProductInput }) => (await api.put<{ data: Product }>(`/products/${id}`, input)).data.data;
export const setProductStatus = async ({ id, active }: { id: number; active: boolean }) => (await api.patch<{ data: Product }>(`/products/${id}/status`, { active })).data.data;
