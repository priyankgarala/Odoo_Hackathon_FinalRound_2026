import { z } from "zod";

const id = z.coerce.number().int().positive();

const categoryFields = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.union([z.string().trim().max(1000), z.literal(""), z.null(), z.undefined()]).transform((v) => (v && typeof v === "string" && v.trim().length > 0 ? v.trim() : null)),
  taxId: z.union([id, z.literal(""), z.null(), z.undefined()]).transform((v) => (v && typeof v === "number" ? v : null))
});

export const createCategorySchema = z.object({ body: categoryFields, params: z.object({}), query: z.object({}) });
export const updateCategorySchema = z.object({ body: categoryFields, params: z.object({ id }), query: z.object({}) });
export const getCategorySchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
export const listCategorySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50)
  })
});
