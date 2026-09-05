import { z } from "zod";

const id = z.coerce.number().int().positive();
const productFields = z.object({
  sku: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "SKU may contain only letters, numbers, hyphens, and underscores.").transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().transform((value) => value || null),
  unitPrice: z.coerce.number().finite().positive().max(999999999999.99),
});
export const createProductSchema = z.object({ body: productFields, params: z.object({}), query: z.object({}) });
export const updateProductSchema = z.object({ body: productFields, params: z.object({ id }), query: z.object({}) });
export const getProductSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
export const statusProductSchema = z.object({ body: z.object({ active: z.boolean() }), params: z.object({ id }), query: z.object({}) });
export const listProductsSchema = z.object({ body: z.object({}), params: z.object({}), query: z.object({ search: z.string().trim().max(160).optional(), active: z.enum(["true", "false"]).optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(10) }) });
