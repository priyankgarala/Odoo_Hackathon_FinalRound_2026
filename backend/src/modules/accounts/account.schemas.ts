import { z } from "zod";
const accountType = z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
const id = z.coerce.number().int().positive();
const accountFields = z.object({ code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Account code may contain letters, numbers, periods, hyphens, and underscores.").transform((value) => value.toUpperCase()), name: z.string().trim().min(2).max(160), type: accountType, parentId: z.coerce.number().int().positive().nullable().optional().transform((value) => value ?? null) });
export const createAccountSchema = z.object({ body: accountFields, params: z.object({}), query: z.object({}) });
export const updateAccountSchema = z.object({ body: accountFields, params: z.object({ id }), query: z.object({}) });
export const getAccountSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
export const statusAccountSchema = z.object({ body: z.object({ active: z.boolean() }), params: z.object({ id }), query: z.object({}) });
export const listAccountsSchema = z.object({ body: z.object({}), params: z.object({}), query: z.object({ search: z.string().trim().max(160).optional(), type: accountType.optional(), active: z.enum(["true", "false"]).optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(50) }) });
