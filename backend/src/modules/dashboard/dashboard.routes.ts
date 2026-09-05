import { Router } from "express";
import { Prisma } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate.js";
import { prisma } from "../../lib/prisma.js";
export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get("/", async (_req, res, next) => { try {
  const [customers, vendors, products, purchaseOrders, salesOrders, bills, postedEntries, recentOrders, recentBills, recentEntries] = await prisma.$transaction([
    prisma.contact.count({ where: { active: true, type: { in: ["CUSTOMER", "BOTH"] } } }),
    prisma.contact.count({ where: { active: true, type: { in: ["VENDOR", "BOTH"] } } }), prisma.product.count({ where: { active: true } }),
    prisma.purchaseOrder.aggregate({ _sum: { total: true }, _count: true }), prisma.salesOrder.aggregate({ _sum: { total: true }, _count: true }),
    prisma.vendorBill.aggregate({ _sum: { total: true, paidAmount: true, outstanding: true }, _count: true }), prisma.journalEntry.count({ where: { status: "POSTED" } }),
    prisma.purchaseOrder.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { vendor: { select: { name: true } } } }),
    prisma.vendorBill.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { vendor: { select: { name: true } }, journalEntry: { select: { id: true, entryNumber: true } } } }),
    prisma.journalEntry.findMany({ take: 5, where: { status: "POSTED" }, orderBy: { createdAt: "desc" }, include: { journal: { select: { code: true, name: true } } } }),
  ]);
  res.json({ metrics: { customers, vendors, products, purchaseOrderCount: purchaseOrders._count, purchaseTotal: purchaseOrders._sum.total ?? new Prisma.Decimal(0), salesOrderCount: salesOrders._count, salesTotal: salesOrders._sum.total ?? new Prisma.Decimal(0), vendorBillCount: bills._count, vendorBillTotal: bills._sum.total ?? new Prisma.Decimal(0), paid: bills._sum.paidAmount ?? new Prisma.Decimal(0), outstanding: bills._sum.outstanding ?? new Prisma.Decimal(0), postedEntries }, recentOrders, recentBills, recentEntries });
} catch (error) { next(error); } });
