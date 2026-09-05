import { Router } from "express";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import { createVendorBillJournalEntry, createVendorPaymentJournalEntry } from "../accounting/accounting.service.js";
import { calculateItemTaxLines } from "../taxes/tax.calculation.service.js";

const id = z.coerce.number().int().positive();
const generateSchema = z.object({ body: z.object({ purchaseOrderId: id }), params: z.object({}), query: z.object({}) });
const paymentSchema = z.object({ body: z.object({ amount: z.coerce.number().positive(), paymentMethod: z.string().min(2).max(80), reference: z.string().max(120).optional().transform((v) => v || null), paymentDate: z.coerce.date().optional() }), params: z.object({ id }), query: z.object({}) });
const listSchema = z.object({ body: z.object({}), params: z.object({}), query: z.object({ status: z.enum(["POSTED", "PAID", "CANCELLED"]).optional(), search: z.string().max(120).optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }) });
const getSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
const tag = (p: string) => `${p}-${randomUUID().slice(0, 8).toUpperCase()}`;

const router = Router();
const include = {
  vendor: { select: { id: true, name: true, email: true, phone: true, address: true } },
  purchaseOrder: { select: { id: true, orderNumber: true } },
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

router.use(authenticate);

router.get("/", validate(listSchema), async (req, res, next) => {
  try {
    const q = req.query as unknown as { status?: "POSTED" | "PAID" | "CANCELLED"; search?: string; page: number; pageSize: number };
    const where = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.search
        ? {
            OR: [
              { billNumber: { contains: q.search, mode: "insensitive" as const } },
              { vendor: { name: { contains: q.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };
    const [data, total] = await prisma.$transaction([
      prisma.vendorBill.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          purchaseOrder: { select: { id: true, orderNumber: true } },
          journalEntry: { select: { id: true, entryNumber: true } },
          _count: { select: { items: true, payments: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize
      }),
      prisma.vendorBill.count({ where })
    ]);
    res.json({ data, meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) } });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", validate(getSchema), async (req, res, next) => {
  try {
    const b = await prisma.vendorBill.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!b) throw new AppError(404, "Vendor bill not found");
    res.json({ data: b });
  } catch (e) {
    next(e);
  }
});

router.post("/generate", authorize("Admin", "Accountant", "Purchase"), validate(generateSchema), async (req, res, next) => {
  try {
    const bill = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: req.body.purchaseOrderId },
        include: { items: { include: { tax: true } } }
      });
      if (!po || po.status !== "CONFIRMED") throw new AppError(400, "A confirmed purchase order is required");
      if (await tx.vendorBill.findFirst({ where: { purchaseOrderId: po.id } })) throw new AppError(400, "Purchase order is already billed");

      // Prepare items with immutable tax line snapshots
      const preparedItems = po.items.map((item) => {
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

      const b = await tx.vendorBill.create({
        data: {
          billNumber: tag("VB"),
          purchaseOrderId: po.id,
          vendorId: po.vendorId,
          billDate: new Date(),
          subtotal: po.subtotal,
          taxTotal: po.taxTotal,
          total: po.total,
          outstanding: po.total,
          items: {
            create: preparedItems
          }
        },
        include
      });

      const entry = await createVendorBillJournalEntry(tx, {
        referenceType: "VENDOR_BILL",
        referenceId: String(b.id),
        partnerId: b.vendorId,
        subtotal: Number(b.subtotal),
        taxTotal: Number(b.taxTotal),
        total: Number(b.total),
        description: `Vendor bill ${b.billNumber}`
      });

      return tx.vendorBill.update({ where: { id: b.id }, data: { journalEntryId: entry.id }, include });
    });
    res.status(201).json({ data: bill });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/payments", authorize("Admin", "Accountant", "Purchase"), validate(paymentSchema), async (req, res, next) => {
  try {
    const bill = await prisma.$transaction(async (tx) => {
      const b = await tx.vendorBill.findUnique({ where: { id: Number(req.params.id) } });
      if (!b || b.status === "CANCELLED") throw new AppError(400, "Valid bill required");
      const amount = new Prisma.Decimal(req.body.amount);
      if (amount.gt(b.outstanding)) throw new AppError(400, "Payment exceeds outstanding amount");
      const entry = await createVendorPaymentJournalEntry(tx, {
        amount: Number(amount),
        date: req.body.paymentDate,
        referenceType: "VENDOR_PAYMENT",
        referenceId: String(b.id),
        partnerId: b.vendorId,
        description: `Vendor payment for ${b.billNumber}`
      });
      const outstanding = b.outstanding.minus(amount);
      await tx.payment.create({
        data: {
          paymentNumber: tag("PAY"),
          type: "VENDOR_PAYMENT",
          vendorBillId: b.id,
          amount,
          paymentMethod: req.body.paymentMethod,
          reference: req.body.reference,
          paymentDate: req.body.paymentDate ?? new Date(),
          journalEntryId: entry.id
        }
      });
      return tx.vendorBill.update({
        where: { id: b.id },
        data: { paidAmount: b.paidAmount.plus(amount), outstanding, status: outstanding.equals(0) ? "PAID" : "POSTED" },
        include
      });
    });
    res.json({ data: bill });
  } catch (e) {
    next(e);
  }
});

export { router as vendorBillRouter };
