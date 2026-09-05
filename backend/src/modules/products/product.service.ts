import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

type ProductInput = {
  sku: string;
  name: string;
  description: string | null;
  type?: "GOODS" | "SERVICE" | "COMBO";
  unitPrice: number;
  costPrice?: number;
  defaultTaxId?: number | null;
  category?: string | null;
  image?: string | null;
};

const includeTax = {
  defaultTax: { select: { id: true, name: true, rate: true, type: true } }
} as const;

const getById = async (id: number) => { const product = await prisma.product.findUnique({ where: { id }, include: includeTax }); if (!product) throw new AppError(404, "Product not found"); return product; };

// Future sales/purchase item services must call this while creating an item and save the
// returned Decimal as `unitPriceSnapshot`; they must never read Product.unitPrice for history.
export const getPriceSnapshot = async (productId: number): Promise<Prisma.Decimal> => {
  const product = await getById(productId);
  if (!product.active) throw new AppError(400, "Inactive products cannot be added to transactions");
  return product.unitPrice;
};

export const createProduct = (data: ProductInput) => prisma.product.create({ data, include: includeTax });
export const listProducts = async (query: { search?: string; active?: "true" | "false"; page: number; pageSize: number }) => {
  const where: Prisma.ProductWhereInput = { ...(query.active ? { active: query.active === "true" } : {}), ...(query.search ? { OR: [{ sku: { contains: query.search, mode: "insensitive" } }, { name: { contains: query.search, mode: "insensitive" } }, { description: { contains: query.search, mode: "insensitive" } }] } : {}) };
  const [data, total] = await prisma.$transaction([prisma.product.findMany({ where, include: includeTax, orderBy: { name: "asc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }), prisma.product.count({ where })]);
  return { data, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
};
export const getProduct = getById;
export const updateProduct = async (id: number, data: ProductInput) => { await getById(id); return prisma.product.update({ where: { id }, data, include: includeTax }); };
export const updateStatus = async (id: number, active: boolean) => { await getById(id); return prisma.product.update({ where: { id }, data: { active }, include: includeTax }); };

