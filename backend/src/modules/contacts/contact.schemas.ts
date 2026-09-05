import { z } from "zod";
const contactType = z.enum(["CUSTOMER", "VENDOR", "BOTH"]);
const nullableText = z.string().trim().max(500).optional().transform((value) => value || null);
const nullableBase64 = z.string().trim().optional().transform((value) => value || null);
const contactFields = z.object({
  name: z.string().trim().min(2).max(120), type: contactType,
  email: z.string().trim().email().max(254).optional().transform((value) => value?.toLowerCase() || null),
  phone: nullableText, address: nullableText, profileImage: nullableBase64,
});
const id = z.coerce.number().int().positive();
export const createContactSchema = z.object({ body: contactFields, params: z.object({}), query: z.object({}) });
export const updateContactSchema = z.object({ body: contactFields, params: z.object({ id }), query: z.object({}) });
export const statusContactSchema = z.object({ body: z.object({ active: z.boolean() }), params: z.object({ id }), query: z.object({}) });
export const getContactSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
export const listContactsSchema = z.object({ body: z.object({}), params: z.object({}), query: z.object({ search: z.string().trim().max(120).optional(), type: contactType.optional(), active: z.enum(["true", "false"]).optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(10) }) });
