import { z } from "zod";

const id = z.coerce.number().int().positive();
const positive = z.coerce.number().finite().positive().max(999999999999.99);

const nullableNotes = z
  .union([z.string().trim().max(1000), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v && typeof v === "string" && v.trim().length > 0 ? v.trim() : null));

const nullableUnitPrice = z
  .union([z.coerce.number().finite().min(0).max(999999999999.99), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v !== undefined && v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined));

const item = z.object({
  productId: id,
  quantity: positive,
  unitPrice: nullableUnitPrice
});

const order = z.object({
  vendorId: id,
  orderDate: z.coerce.date().optional(),
  notes: nullableNotes,
  items: z.array(item).min(1)
});

export const createSchema = z.object({ body: order, params: z.object({}), query: z.object({}) });
export const updateSchema = z.object({ body: order, params: z.object({ id }), query: z.object({}) });
export const idSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
export const statusSchema = z.object({ body: z.object({ status: z.enum(["CONFIRMED", "CANCELLED"]) }), params: z.object({ id }), query: z.object({}) });
export const listSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
  })
});
