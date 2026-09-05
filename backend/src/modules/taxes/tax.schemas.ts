import { z } from "zod";

const id = z.coerce.number().int().positive();

const taxFields = z.object({
  name: z.string().trim().min(2).max(100),
  rate: z.coerce.number().finite().min(0).max(100),
  type: z.enum(["GST", "OTHER"]).default("GST"),
  salesAccountId: id,
  purchaseAccountId: id,
  isActive: z.boolean().default(true),
});

export const createTaxSchema = z.object({ body: taxFields, params: z.object({}), query: z.object({}) });
export const updateTaxSchema = z.object({ body: taxFields, params: z.object({ id }), query: z.object({}) });
export const getTaxSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
export const statusTaxSchema = z.object({ body: z.object({ isActive: z.boolean() }), params: z.object({ id }), query: z.object({}) });
export const listTaxSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    type: z.enum(["GST", "OTHER"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50)
  })
});
