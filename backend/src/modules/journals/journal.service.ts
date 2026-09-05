import { randomUUID } from "node:crypto";
import { Prisma, type JournalType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
export type EntryLineInput = { accountId: number; partnerId?: number | null; debit: number; credit: number; description?: string | null };
type EntryInput = { journalId: number; entryDate: Date; description: string | null; lines: EntryLineInput[]; referenceType?: string; referenceId?: string; postNow?: boolean };
const entryInclude = {
  journal: true,
  lines: {
    include: {
      account: { select: { id: true, code: true, name: true, type: true } },
      partner: { select: { id: true, name: true, type: true } }
    },
    orderBy: { id: "asc" as const }
  }
} as const;
const uniqueEntryNumber = () => `JE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
const validateLines = (lines: EntryLineInput[]) => {
  if (lines.length < 2) throw new AppError(400, "A journal entry requires at least two lines");
  const debit = lines.reduce((sum, line) => sum.plus(line.debit), new Prisma.Decimal(0));
  const credit = lines.reduce((sum, line) => sum.plus(line.credit), new Prisma.Decimal(0));
  if (debit.lte(0) || credit.lte(0)) throw new AppError(400, "An entry requires at least one debit and one credit");
  if (!debit.equals(credit)) throw new AppError(400, "Journal entry is unbalanced: total debit must equal total credit");
  for (const line of lines) if (line.debit < 0 || line.credit < 0 || (line.debit > 0 && line.credit > 0) || (line.debit === 0 && line.credit === 0)) throw new AppError(400, "Each line requires one positive debit or credit amount");
};
const validateJournalAndAccounts = async (tx: Prisma.TransactionClient, input: EntryInput, allowAutomated: boolean) => {
  const journal = await tx.journal.findUnique({ where: { id: input.journalId } });
  if (!journal || !journal.active) throw new AppError(400, "Valid active journal is required");
  const accounts = await tx.account.findMany({ where: { id: { in: input.lines.map((line) => line.accountId) }, active: true }, select: { id: true } });
  if (accounts.length !== new Set(input.lines.map((line) => line.accountId)).size) throw new AppError(400, "All journal lines must use valid active accounts");
  return journal;
};
export const createAccountingEntryInTransaction = async (tx: Prisma.TransactionClient, input: EntryInput, allowAutomated: boolean, post: boolean) => {
  validateLines(input.lines);
  await validateJournalAndAccounts(tx, input, allowAutomated);
  return tx.journalEntry.create({
    data: {
      entryNumber: uniqueEntryNumber(),
      entryDate: input.entryDate,
      journalId: input.journalId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      description: input.description,
      status: (post || input.postNow) ? "POSTED" : "DRAFT",
      lines: {
        create: input.lines.map((line) => ({
          accountId: line.accountId,
          partnerId: line.partnerId || null,
          debit: line.debit,
          credit: line.credit,
          description: line.description
        }))
      }
    },
    include: entryInclude
  });
};
export const listJournals = () => prisma.journal.findMany({
  where: { active: true },
  include: { defaultAccount: { select: { id: true, code: true, name: true, type: true } } },
  orderBy: { code: "asc" }
});
export const createJournal = async (data: { code?: string; name: string; type: JournalType; defaultAccountId?: number | null }) => {
  const code = data.code || data.name.slice(0, 4).toUpperCase();
  return prisma.journal.create({
    data: {
      code,
      name: data.name,
      type: data.type,
      defaultAccountId: data.defaultAccountId || null
    },
    include: { defaultAccount: true }
  });
};
export const listEntries = async (query: { journalId?: number; status?: "DRAFT" | "POSTED"; search?: string; page: number; pageSize: number }) => {
  const where: Prisma.JournalEntryWhereInput = {
    ...(query.journalId ? { journalId: query.journalId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? {
      OR: [
        { entryNumber: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { referenceId: { contains: query.search, mode: "insensitive" } },
        { lines: { some: { partner: { name: { contains: query.search, mode: "insensitive" } } } } }
      ]
    } : {})
  };
  const [data, total] = await prisma.$transaction([
    prisma.journalEntry.findMany({
      where,
      include: {
        journal: true,
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true } },
            partner: { select: { id: true, name: true } }
          }
        },
        _count: { select: { lines: true } }
      },
      orderBy: [{ entryDate: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize
    }),
    prisma.journalEntry.count({ where })
  ]);
  return { data, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
};
export const getEntry = async (id: number) => {
  const entry = await prisma.journalEntry.findUnique({ where: { id }, include: entryInclude });
  if (!entry) throw new AppError(404, "Journal entry not found");
  return entry;
};
export const createManualEntry = (input: EntryInput) => prisma.$transaction((tx) => createAccountingEntryInTransaction(tx, input, false, input.postNow ?? false));
export const postEntry = async (id: number) => prisma.$transaction(async (tx) => {
  const entry = await tx.journalEntry.findUnique({ where: { id }, include: { lines: true } });
  if (!entry) throw new AppError(404, "Journal entry not found");
  if (entry.status === "POSTED") throw new AppError(400, "Journal entry is already posted");
  validateLines(entry.lines.map((line) => ({ accountId: line.accountId, debit: Number(line.debit), credit: Number(line.credit), description: line.description })));
  await validateJournalAndAccounts(tx, { journalId: entry.journalId, entryDate: entry.entryDate, description: entry.description, lines: entry.lines.map((line) => ({ accountId: line.accountId, debit: Number(line.debit), credit: Number(line.credit) })) }, true);
  return tx.journalEntry.update({ where: { id }, data: { status: "POSTED" }, include: entryInclude });
});
export const createAndPostAutomatedEntry = (input: EntryInput) => prisma.$transaction((tx) => createAccountingEntryInTransaction(tx, input, true, true));
