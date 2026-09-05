import { z } from "zod";

const contactType = z.enum(["CUSTOMER", "VENDOR", "BOTH"]);

const nullableText = z
  .union([z.string().trim().max(2000), z.literal(""), z.null(), z.undefined()])
  .transform((val) => (val && typeof val === "string" && val.trim().length > 0 ? val.trim() : null));

const nullableEmail = z
  .union([
    z.string().trim().email().max(254),
    z.literal(""),
    z.null(),
    z.undefined()
  ])
  .transform((val) => (val && typeof val === "string" && val.trim().length > 0 ? val.trim().toLowerCase() : null));

const nullableBase64 = z
  .union([z.string(), z.literal(""), z.null(), z.undefined()])
  .transform((val) => (val && typeof val === "string" && val.trim().length > 0 ? val : null));

const contactFields = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  type: contactType,
  email: nullableEmail,
  phone: nullableText,
  address: nullableText,
  profileImage: nullableBase64,
});

const id = z.coerce.number().int().positive();

export const createContactSchema = z.object({
  body: contactFields,
  params: z.object({}),
  query: z.object({})
});

export const updateContactSchema = z.object({
  body: contactFields,
  params: z.object({ id }),
  query: z.object({})
});

export const statusContactSchema = z.object({
  body: z.object({ active: z.boolean() }),
  params: z.object({ id }),
  query: z.object({})
});

export const getContactSchema = z.object({
  body: z.object({}),
  params: z.object({ id }),
  query: z.object({})
});

export const listContactsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().max(120).optional(),
    type: contactType.optional(),
    active: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10)
  })
});
