import { z } from "zod";

const id = z.coerce.number().int().positive();

const nullableText = z
  .union([z.string().trim().max(2000), z.literal(""), z.null(), z.undefined()])
  .transform((val) => (val && typeof val === "string" && val.trim().length > 0 ? val.trim() : null));

const nullableImage = z
  .union([z.string(), z.literal(""), z.null(), z.undefined()])
  .transform((val) => (val && typeof val === "string" && val.trim().length > 0 ? val : null));

const productFields = z.object({
  sku: z
    .union([z.string().trim().max(64), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value && typeof value === "string" && value.trim().length > 0 ? value.trim().toUpperCase() : `PRD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)),
  name: z.string().trim().min(2).max(160),
  description: nullableText,
  type: z.enum(["GOODS", "SERVICE", "COMBO"]).default("GOODS"),
  unitPrice: z.coerce.number().finite().min(0).max(999999999999.99),
  costPrice: z.coerce.number().finite().min(0).default(0),
  defaultTaxId: z.union([id, z.literal(""), z.null(), z.undefined()]).transform((val) => (val && typeof val === "number" ? val : null)),
  category: nullableText,
  image: nullableImage,
});

export const createProductSchema = z.object({ body: productFields, params: z.object({}), query: z.object({}) });
export const updateProductSchema = z.object({ body: productFields, params: z.object({ id }), query: z.object({}) });
export const getProductSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
export const statusProductSchema = z.object({ body: z.object({ active: z.boolean() }), params: z.object({ id }), query: z.object({}) });
export const listProductsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().max(160).optional(),
    active: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10)
  })
});
