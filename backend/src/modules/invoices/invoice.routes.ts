import { Router } from "express";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error-handler.js";
import { createCustomerPaymentJournalEntry, createSalesInvoiceJournalEntry } from "../accounting/accounting.service.js";
import { calculateItemTaxLines } from "../taxes/tax.calculation.service.js";

const id = z.coerce.number().int().positive();
const generateSchema = z.object({ body: z.object({ salesOrderId: id, dueDate: z.coerce.date().optional() }), params: z.object({}), query: z.object({}) });
const paymentSchema = z.object({ body: z.object({ amount: z.coerce.number().positive(), paymentMethod: z.string().min(2).max(80), reference: z.string().max(120).optional().transform((value) => value || null), paymentDate: z.coerce.date().optional() }), params: z.object({ id }), query: z.object({}) });
const getSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
const listSchema = z.object({ body: z.object({}), params: z.object({}), query: z.object({ status: z.enum(["POSTED", "PAID", "CANCELLED"]).optional(), search: z.string().max(120).optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }) });
const invoiceNumber = () => `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
const paymentNumber = () => `PAY-${randomUUID().slice(0, 8).toUpperCase()}`;

const include = {
  customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
  salesOrder: { select: { id: true, orderNumber: true } },
  items: {
    include: {
      taxLines: true
    }
  },
  payments: {
    include: {
      journalEntry: { select: { id: true, entryNumber: true } }
    },
    orderBy: { paymentDate: "desc" as const }
  },
  journalEntry: { select: { id: true, entryNumber: true } }
} as const;

const router = Router();
router.use(authenticate);

router.get("/", validate(listSchema), async (req, res, next) => {
  try {
    const query = req.query as unknown as { status?: "POSTED" | "PAID" | "CANCELLED"; search?: string; page: number; pageSize: number };
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { invoiceNumber: { contains: query.search, mode: "insensitive" as const } },
              { customer: { name: { contains: query.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };
    const [data, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
          journalEntry: { select: { id: true, entryNumber: true } },
          _count: { select: { items: true, payments: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.invoice.count({ where }),
    ]);
    res.json({ data, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } });
  } catch (error) { next(error); }
});

router.get("/:id", validate(getSchema), async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!invoice) throw new AppError(404, "Invoice not found");
    res.json({ data: invoice });
  } catch (error) { next(error); }
});

router.post("/generate", authorize("Admin", "Accountant", "Sales"), validate(generateSchema), async (req, res, next) => {
  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: req.body.salesOrderId },
        include: { items: { include: { tax: true } } }
      });
      if (!order || order.status !== "CONFIRMED") throw new AppError(400, "A confirmed sales order is required");
      if (await tx.invoice.findUnique({ where: { salesOrderId: order.id } })) throw new AppError(400, "Sales order is already invoiced");

      // Prepare items with immutable tax line snapshots
      const preparedItems = order.items.map((item) => {
        const { taxLines } = calculateItemTaxLines({
          taxableAmount: item.lineSubtotal,
          tax: item.tax,
          taxRate: item.taxRate,
          isInterState: false
        });

        return {
          productId: item.productId,
          productSku: item.productSku,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          lineSubtotal: item.lineSubtotal,
          taxAmount: item.taxAmount,
          lineTotal: item.lineTotal,
          taxLines: {
            create: taxLines.map((tl) => ({
              taxId: tl.taxId,
              taxName: tl.taxName,
              taxType: tl.taxType,
              rate: tl.rate,
              taxableAmount: tl.taxableAmount,
              taxAmount: tl.taxAmount,
              jurisdiction: tl.jurisdiction
            }))
          }
        };
      });

      const created = await tx.invoice.create({
        data: {
          invoiceNumber: invoiceNumber(),
          salesOrderId: order.id,
          customerId: order.customerId,
          invoiceDate: new Date(),
          dueDate: req.body.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: order.subtotal,
          taxTotal: order.taxTotal,
          total: order.total,
          outstanding: order.total,
          items: {
            create: preparedItems
          }
        },
        include
      });

      const entry = await createSalesInvoiceJournalEntry(tx, {
        referenceType: "INVOICE",
        referenceId: String(created.id),
        partnerId: created.customerId,
        subtotal: Number(created.subtotal),
        taxTotal: Number(created.taxTotal),
        total: Number(created.total),
        description: `Customer invoice ${created.invoiceNumber}`
      });

      return tx.invoice.update({ where: { id: created.id }, data: { journalEntryId: entry.id }, include });
    });
    res.status(201).json({ data: invoice });
  } catch (error) { next(error); }
});

router.post("/:id/payments", authorize("Admin", "Accountant", "Sales"), validate(paymentSchema), async (req, res, next) => {
  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const current = await tx.invoice.findUnique({ where: { id: Number(req.params.id) } });
      if (!current || current.status === "CANCELLED") throw new AppError(400, "A valid invoice is required");
      const amount = new Prisma.Decimal(req.body.amount);
      if (amount.gt(current.outstanding)) throw new AppError(400, "Payment exceeds outstanding amount");
      const entry = await createCustomerPaymentJournalEntry(tx, {
        amount: Number(amount),
        date: req.body.paymentDate,
        referenceType: "CUSTOMER_PAYMENT",
        referenceId: String(current.id),
        partnerId: current.customerId,
        description: `Customer payment for ${current.invoiceNumber}`
      });
      const outstanding = current.outstanding.minus(amount);
      await tx.payment.create({
        data: {
          paymentNumber: paymentNumber(),
          type: "CUSTOMER_PAYMENT",
          invoiceId: current.id,
          amount,
          paymentMethod: req.body.paymentMethod,
          reference: req.body.reference,
          paymentDate: req.body.paymentDate ?? new Date(),
          journalEntryId: entry.id
        }
      });
      return tx.invoice.update({
        where: { id: current.id },
        data: { paidAmount: current.paidAmount.plus(amount), outstanding, status: outstanding.equals(0) ? "PAID" : "POSTED" },
        include
      });
    });
    res.json({ data: invoice });
  } catch (error) { next(error); }
});

export { router as invoiceRouter };
