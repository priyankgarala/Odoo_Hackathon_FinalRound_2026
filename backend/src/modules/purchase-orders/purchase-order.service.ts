import { randomUUID } from "node:crypto";
import { Prisma, type PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

type Input = {
  vendorId: number;
  orderDate?: Date;
  notes: string | null;
  items: { productId: number; quantity: number; unitPrice?: number }[];
};

const include = {
  vendor: { select: { id: true, name: true, type: true, email: true, phone: true } },
  items: {
    include: {
      product: { select: { id: true, sku: true, name: true } },
      tax: { select: { id: true, name: true, rate: true, type: true } }
    }
  }
} as const;

const number = () => `PO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;

const prepare = async (tx: Prisma.TransactionClient, input: Input) => {
  const vendor = await tx.contact.findUnique({ where: { id: input.vendorId } });
  if (!vendor || !vendor.active || !["VENDOR", "BOTH"].includes(vendor.type)) {
    throw new AppError(400, "A valid active vendor is required");
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
    throw new AppError(400, "All purchase-order items must use valid active products");
  }

  const rows = input.items.map((i) => {
    const product = products.find((p) => p.id === i.productId)!;
    const categoryTax = product.productCategory?.tax ?? null;
    const resolvedTax = product.defaultTax ?? categoryTax;

    const defaultPrice = Number(product.costPrice) > 0 ? product.costPrice : product.unitPrice;
    const unitPrice = new Prisma.Decimal(i.unitPrice !== undefined ? i.unitPrice : defaultPrice);
    const quantity = new Prisma.Decimal(i.quantity);
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
  return { rows, subtotal, taxTotal, total: subtotal.plus(taxTotal) };
};

export const create = (input: Input) =>
  prisma.$transaction(async (tx) => {
    const data = await prepare(tx, input);
    return tx.purchaseOrder.create({
      data: {
        orderNumber: number(),
        vendorId: input.vendorId,
        orderDate: input.orderDate ?? new Date(),
        notes: input.notes,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        total: data.total,
        items: { create: data.rows }
      },
      include
    });
  });

export const list = async (q: { status?: PurchaseOrderStatus; search?: string; page: number; pageSize: number }) => {
  const where: Prisma.PurchaseOrderWhereInput = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.search
      ? {
          OR: [
            { orderNumber: { contains: q.search, mode: "insensitive" } },
            { vendor: { name: { contains: q.search, mode: "insensitive" } } }
          ]
        }
      : {})
  };
  const [data, total] = await prisma.$transaction([
    prisma.purchaseOrder.findMany({
      where,
      include: { vendor: { select: { id: true, name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize
    }),
    prisma.purchaseOrder.count({ where })
  ]);
  return { data, meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) } };
};

export const get = async (id: number) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include });
  if (!po) throw new AppError(404, "Purchase order not found");
  return po;
};

export const update = (id: number, input: Input) =>
  prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new AppError(404, "Purchase order not found");
    if (po.status !== "DRAFT") throw new AppError(400, "Only draft purchase orders can be edited");
    const data = await prepare(tx, input);
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    return tx.purchaseOrder.update({
      where: { id },
      data: {
        vendorId: input.vendorId,
        orderDate: input.orderDate ?? po.orderDate,
        notes: input.notes,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        total: data.total,
        items: { create: data.rows }
      },
      include
    });
  });

export const transition = async (id: number, status: "CONFIRMED" | "CANCELLED") => {
  const po = await get(id);
  if (po.status !== "DRAFT") throw new AppError(400, "Only draft purchase orders can change status");
  return prisma.purchaseOrder.update({ where: { id }, data: { status }, include });
};
