import { Prisma, type TaxType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

type TaxInput = {
  name: string;
  rate: number;
  type?: TaxType;
  salesAccountId: number;
  purchaseAccountId: number;
  isActive?: boolean;
};

const includeAccounts = {
  salesAccount: { select: { id: true, code: true, name: true } },
  purchaseAccount: { select: { id: true, code: true, name: true } }
} as const;

export const getTaxById = async (id: number) => {
  const tax = await prisma.tax.findUnique({
    where: { id },
    include: includeAccounts
  });
  if (!tax) throw new AppError(404, "Tax not found");
  return tax;
};

export const listTaxes = async (query: {
  search?: string;
  isActive?: "true" | "false";
  type?: TaxType;
  page?: number;
  pageSize?: number;
}) => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;

  const where: Prisma.TaxWhereInput = {
    ...(query.isActive !== undefined ? { isActive: query.isActive === "true" } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
          ]
        }
      : {})
  };

  const [data, total] = await prisma.$transaction([
    prisma.tax.findMany({
      where,
      include: includeAccounts,
      orderBy: [{ rate: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.tax.count({ where })
  ]);

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

export const createTax = async (data: TaxInput) => {
  const [salesAcc, purchaseAcc] = await Promise.all([
    prisma.account.findUnique({ where: { id: data.salesAccountId } }),
    prisma.account.findUnique({ where: { id: data.purchaseAccountId } })
  ]);

  if (!salesAcc || !salesAcc.active) {
    throw new AppError(400, "A valid active Sales Tax Account is required");
  }
  if (!purchaseAcc || !purchaseAcc.active) {
    throw new AppError(400, "A valid active Purchase Tax Account is required");
  }

  return prisma.tax.create({
    data: {
      name: data.name,
      rate: new Prisma.Decimal(data.rate),
      type: data.type ?? "GST",
      salesAccountId: data.salesAccountId,
      purchaseAccountId: data.purchaseAccountId,
      isActive: data.isActive ?? true
    },
    include: includeAccounts
  });
};

export const updateTax = async (id: number, data: TaxInput) => {
  await getTaxById(id);

  const [salesAcc, purchaseAcc] = await Promise.all([
    prisma.account.findUnique({ where: { id: data.salesAccountId } }),
    prisma.account.findUnique({ where: { id: data.purchaseAccountId } })
  ]);

  if (!salesAcc || !salesAcc.active) {
    throw new AppError(400, "A valid active Sales Tax Account is required");
  }
  if (!purchaseAcc || !purchaseAcc.active) {
    throw new AppError(400, "A valid active Purchase Tax Account is required");
  }

  return prisma.tax.update({
    where: { id },
    data: {
      name: data.name,
      rate: new Prisma.Decimal(data.rate),
      type: data.type ?? "GST",
      salesAccountId: data.salesAccountId,
      purchaseAccountId: data.purchaseAccountId,
      isActive: data.isActive ?? true
    },
    include: includeAccounts
  });
};

export const setTaxStatus = async (id: number, isActive: boolean) => {
  await getTaxById(id);
  return prisma.tax.update({
    where: { id },
    data: { isActive },
    include: includeAccounts
  });
};
