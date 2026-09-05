import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

type CategoryInput = {
  name: string;
  description?: string | null;
  taxId?: number | null;
};

const includeTax = {
  tax: {
    select: {
      id: true,
      name: true,
      rate: true,
      type: true
    }
  },
  _count: {
    select: {
      products: true
    }
  }
} as const;

export const getCategoryById = async (id: number) => {
  const cat = await prisma.productCategory.findUnique({
    where: { id },
    include: includeTax
  });
  if (!cat) throw new AppError(404, "Product Category not found");
  return cat;
};

export const listCategories = async (query: { search?: string; page?: number; pageSize?: number }) => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;

  const where: Prisma.ProductCategoryWhereInput = {
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [data, total] = await prisma.$transaction([
    prisma.productCategory.findMany({
      where,
      include: includeTax,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.productCategory.count({ where })
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

export const createCategory = async (data: CategoryInput) => {
  const existing = await prisma.productCategory.findUnique({ where: { name: data.name } });
  if (existing) throw new AppError(400, "A product category with this name already exists");

  if (data.taxId) {
    const tax = await prisma.tax.findUnique({ where: { id: data.taxId } });
    if (!tax || !tax.isActive) throw new AppError(400, "Selected tax rate is invalid or inactive");
  }

  return prisma.productCategory.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      taxId: data.taxId ?? null
    },
    include: includeTax
  });
};

export const updateCategory = async (id: number, data: CategoryInput) => {
  await getCategoryById(id);

  const duplicate = await prisma.productCategory.findFirst({
    where: { name: data.name, id: { not: id } }
  });
  if (duplicate) throw new AppError(400, "Another product category with this name already exists");

  if (data.taxId) {
    const tax = await prisma.tax.findUnique({ where: { id: data.taxId } });
    if (!tax || !tax.isActive) throw new AppError(400, "Selected tax rate is invalid or inactive");
  }

  return prisma.productCategory.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      taxId: data.taxId ?? null
    },
    include: includeTax
  });
};
