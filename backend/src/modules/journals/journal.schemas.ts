import { z } from "zod";
const id = z.coerce.number().int().positive();
const amount = z.coerce.number().finite().min(0).max(999999999999.99);
const line = z.object({ accountId: id, debit: amount.default(0), credit: amount.default(0), description: z.string().trim().max(500).optional().transform((value) => value || null) }).refine((value) => (value.debit > 0) !== (value.credit > 0), "Each line needs either a debit or a credit amount.");
export const createEntrySchema = z.object({ body: z.object({ journalId: id, entryDate: z.coerce.date(), description: z.string().trim().max(1000).optional().transform((value) => value || null), lines: z.array(line).min(2) }), params: z.object({}), query: z.object({}) });
export const idSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
export const listEntrySchema = z.object({ body: z.object({}), params: z.object({}), query: z.object({ journalId: id.optional(), status: z.enum(["DRAFT", "POSTED"]).optional(), search: z.string().trim().max(120).optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }) });
