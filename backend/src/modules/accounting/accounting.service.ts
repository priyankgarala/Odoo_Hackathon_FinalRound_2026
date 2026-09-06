import type { Prisma } from "@prisma/client";
import { SYSTEM_ACCOUNT_CODES } from "../../config/accounts.js";
import { createAccountingEntryInTransaction, type EntryLineInput } from "../journals/journal.service.js";

type Source = { referenceType: string; referenceId: string; amount: number; date?: Date; description: string; partnerId?: number };

export type InvoiceAccountingSource = {
  referenceType: string;
  referenceId: string;
  partnerId?: number;
  subtotal: number;
  taxTotal: number;
  total: number;
  date?: Date;
  description: string;
  taxAccountId?: number;
};

const getAccountId = async (tx: Prisma.TransactionClient, code: string) => {
  const acc = await tx.account.findUnique({ where: { code } });
  if (acc) return acc.id;
  // Fallback if 1300 is not yet in db, fallback to 2100
  if (code === SYSTEM_ACCOUNT_CODES.taxInputCredit) {
    const fallback = await tx.account.findUnique({ where: { code: SYSTEM_ACCOUNT_CODES.taxPayable } });
    if (fallback) return fallback.id;
  }
  const anyAcc = await tx.account.findFirst();
  return anyAcc!.id;
};

const journalId = async (tx: Prisma.TransactionClient, type: "SALES" | "PURCHASE" | "CASH" | "BANK") =>
  (await tx.journal.findUniqueOrThrow({ where: { type } })).id;

export const createSalesInvoiceJournalEntry = async (
  tx: Prisma.TransactionClient,
  source: InvoiceAccountingSource
) => {
  const receivableId = await getAccountId(tx, SYSTEM_ACCOUNT_CODES.receivable);
  const salesRevId = await getAccountId(tx, SYSTEM_ACCOUNT_CODES.salesRevenue);
  const taxPayableId = source.taxAccountId ?? (await getAccountId(tx, SYSTEM_ACCOUNT_CODES.taxPayable));

  const lines: EntryLineInput[] = [
    {
      accountId: receivableId,
      partnerId: source.partnerId,
      debit: source.total,
      credit: 0,
      description: source.description
    },
    {
      accountId: salesRevId,
      partnerId: source.partnerId,
      debit: 0,
      credit: source.subtotal,
      description: "Sales Revenue"
    }
  ];

  if (source.taxTotal > 0) {
    lines.push({
      accountId: taxPayableId,
      partnerId: source.partnerId,
      debit: 0,
      credit: source.taxTotal,
      description: "GST Output Tax Payable"
    });
  }

  return createAccountingEntryInTransaction(
    tx,
    {
      journalId: await journalId(tx, "SALES"),
      entryDate: source.date ?? new Date(),
      description: source.description,
      referenceType: source.referenceType,
      referenceId: source.referenceId,
      lines
    },
    true,
    true
  );
};

export const createVendorBillJournalEntry = async (
  tx: Prisma.TransactionClient,
  source: InvoiceAccountingSource
) => {
  const payableId = await getAccountId(tx, SYSTEM_ACCOUNT_CODES.payable);
  const purchaseExpId = await getAccountId(tx, SYSTEM_ACCOUNT_CODES.purchaseExpense);
  const taxInputId = source.taxAccountId ?? (await getAccountId(tx, SYSTEM_ACCOUNT_CODES.taxInputCredit));

  const lines: EntryLineInput[] = [
    {
      accountId: purchaseExpId,
      partnerId: source.partnerId,
      debit: source.subtotal,
      credit: 0,
      description: "Purchase Expense"
    }
  ];

  if (source.taxTotal > 0) {
    lines.push({
      accountId: taxInputId,
      partnerId: source.partnerId,
      debit: source.taxTotal,
      credit: 0,
      description: "GST Input Tax Credit"
    });
  }

  lines.push({
    accountId: payableId,
    partnerId: source.partnerId,
    debit: 0,
    credit: source.total,
    description: source.description
  });

  return createAccountingEntryInTransaction(
    tx,
    {
      journalId: await journalId(tx, "PURCHASE"),
      entryDate: source.date ?? new Date(),
      description: source.description,
      referenceType: source.referenceType,
      referenceId: source.referenceId,
      lines
    },
    true,
    true
  );
};

export const createSalesJournalEntry = async (tx: Prisma.TransactionClient, source: Source) =>
  createSalesInvoiceJournalEntry(tx, {
    referenceType: source.referenceType,
    referenceId: source.referenceId,
    partnerId: source.partnerId,
    subtotal: source.amount,
    taxTotal: 0,
    total: source.amount,
    date: source.date,
    description: source.description
  });

export const createCustomerPaymentJournalEntry = async (tx: Prisma.TransactionClient, source: Source) =>
  createAccountingEntryInTransaction(
    tx,
    {
      journalId: await journalId(tx, "BANK"),
      entryDate: source.date ?? new Date(),
      description: source.description,
      referenceType: source.referenceType,
      referenceId: source.referenceId,
      lines: [
        { accountId: await getAccountId(tx, SYSTEM_ACCOUNT_CODES.bank), partnerId: source.partnerId, debit: source.amount, credit: 0 },
        { accountId: await getAccountId(tx, SYSTEM_ACCOUNT_CODES.receivable), partnerId: source.partnerId, debit: 0, credit: source.amount }
      ]
    },
    true,
    true
  );

export const createPurchaseJournalEntry = async (tx: Prisma.TransactionClient, source: Source) =>
  createVendorBillJournalEntry(tx, {
    referenceType: source.referenceType,
    referenceId: source.referenceId,
    partnerId: source.partnerId,
    subtotal: source.amount,
    taxTotal: 0,
    total: source.amount,
    date: source.date,
    description: source.description
  });

export const createVendorPaymentJournalEntry = async (tx: Prisma.TransactionClient, source: Source) =>
  createAccountingEntryInTransaction(
    tx,
    {
      journalId: await journalId(tx, "BANK"),
      entryDate: source.date ?? new Date(),
      description: source.description,
      referenceType: source.referenceType,
      referenceId: source.referenceId,
      lines: [
        { accountId: await getAccountId(tx, SYSTEM_ACCOUNT_CODES.payable), partnerId: source.partnerId, debit: source.amount, credit: 0 },
        { accountId: await getAccountId(tx, SYSTEM_ACCOUNT_CODES.bank), partnerId: source.partnerId, debit: 0, credit: source.amount }
      ]
    },
    true,
    true
  );
