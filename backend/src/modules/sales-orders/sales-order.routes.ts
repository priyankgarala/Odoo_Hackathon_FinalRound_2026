import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error-handler.js";

const id = z.coerce.number().int().positive();
const value = z.coerce.number().positive();

const itemSchema = z.object({
  productId: id,
  quantity: value,
  unitPrice: value.optional()
});

const bodySchema = z.object({
  customerId: id,
  orderDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional().transform((v) => v || null),
  items: z.array(itemSchema).min(1)
});

const createSchema = z.object({ body: bodySchema, params: z.object({}), query: z.object({}) });
const updateSchema = z.object({ body: bodySchema, params: z.object({ id }), query: z.object({}) });
const idSchema = z.object({ body: z.object({}), params: z.object({ id }), query: z.object({}) });
const statusSchema = z.object({ body: z.object({ status: z.enum(["CONFIRMED", "CANCELLED"]) }), params: z.object({ id }), query: z.object({}) });
const listSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
    search: z.string().max(120).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
  })
});

const router = Router();
const include = {
  customer: { select: { id: true, name: true, type: true, email: true, phone: true } },
  items: {
    include: {
      product: { select: { id: true, sku: true, name: true } },
      tax: { select: { id: true, name: true, rate: true, type: true } }
    }
  }
} as const;

const generateOrderNumber = () => `SO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;

type Input = z.infer<typeof bodySchema>;

const prepare = async (tx: Prisma.TransactionClient, input: Input) => {
  const customer = await tx.contact.findUnique({ where: { id: input.customerId } });
  if (!customer || !customer.active || !["CUSTOMER", "BOTH"].includes(customer.type)) {
    throw new AppError(400, "A valid active customer is required");
  }

  const productIds = input.items.map((i) => i.productId);
  const products = await tx.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: {
      defaultTax: true,
      productCategory: { include: { tax: true } }
    }
  });

  if (products.length !== new Set(productIds).size) {
    throw new AppError(400, "All items require valid active products");
  }

  const rows = input.items.map((i) => {
    const product = products.find((x) => x.id === i.productId)!;
    const categoryTax = product.productCategory?.tax ?? null;
    const resolvedTax = product.defaultTax ?? categoryTax;

    const quantity = new Prisma.Decimal(i.quantity);
    const unitPrice = new Prisma.Decimal(i.unitPrice ?? product.unitPrice);
    const rate = resolvedTax ? new Prisma.Decimal(resolvedTax.rate) : new Prisma.Decimal(0);

    const lineSubtotal = quantity.mul(unitPrice);
    const taxAmount = lineSubtotal.mul(rate).div(100);
    const lineTotal = lineSubtotal.plus(taxAmount);

    return {
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      quantity,
      unitPrice,
      taxRate: rate,
      taxId: resolvedTax?.id ?? null,
      lineSubtotal,
      taxAmount,
      lineTotal
    };
  });

  const subtotal = rows.reduce((s, r) => s.plus(r.lineSubtotal), new Prisma.Decimal(0));
  const taxTotal = rows.reduce((s, r) => s.plus(r.taxAmount), new Prisma.Decimal(0));
  const total = subtotal.plus(taxTotal);

  return { rows, subtotal, taxTotal, total };
};

router.use(authenticate);

router.get("/", validate(listSchema), async (req, res, next) => {
  try {
    const query = req.query as unknown as { status?: "DRAFT" | "CONFIRMED" | "CANCELLED"; search?: string; page: number; pageSize: number };
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: "insensitive" as const } },
              { customer: { name: { contains: query.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };

    const [data, total] = await prisma.$transaction([
      prisma.salesOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.salesOrder.count({ where })
    ]);

    res.json({ data, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validate(idSchema), async (req, res, next) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!order) throw new AppError(404, "Sales order not found");
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
});

router.post("/", authorize("Admin", "Accountant", "Sales"), validate(createSchema), async (req, res, next) => {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const prepared = await prepare(tx, req.body);
      return tx.salesOrder.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: req.body.customerId,
          orderDate: req.body.orderDate ?? new Date(),
          notes: req.body.notes,
          subtotal: prepared.subtotal,
          taxTotal: prepared.taxTotal,
          total: prepared.total,
          items: { create: prepared.rows }
        },
        include
      });
    });
    res.status(201).json({ data: order });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authorize("Admin", "Accountant", "Sales"), validate(updateSchema), async (req, res, next) => {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.salesOrder.findUnique({ where: { id: Number(req.params.id) } });
      if (!existing || existing.status !== "DRAFT") throw new AppError(400, "Only draft sales orders can be edited");
      const prepared = await prepare(tx, req.body);
      await tx.salesOrderItem.deleteMany({ where: { salesOrderId: existing.id } });
      return tx.salesOrder.update({
        where: { id: existing.id },
        data: {
          customerId: req.body.customerId,
          notes: req.body.notes,
          subtotal: prepared.subtotal,
          taxTotal: prepared.taxTotal,
          total: prepared.total,
          items: { create: prepared.rows }
        },
        include
      });
    });
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", authorize("Admin", "Accountant", "Sales"), validate(statusSchema), async (req, res, next) => {
  try {
    const existing = await prisma.salesOrder.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing || existing.status !== "DRAFT") throw new AppError(400, "Only draft sales orders can change status");
    const updated = await prisma.salesOrder.update({
      where: { id: existing.id },
      data: { status: req.body.status },
      include
    });
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

export { router as salesOrderRouter };
