import { Prisma, type AnalyticType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

export const listAnalytics = async (query: { search?: string; type?: AnalyticType; active?: "true" | "false" }) => {
  const where: Prisma.AnalyticAccountWhereInput = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.active ? { active: query.active === "true" } : {}),
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {})
  };
  const data = await prisma.analyticAccount.findMany({
    where,
    include: { _count: { select: { budgets: true } } },
    orderBy: { name: "asc" }
  });
  return { data, meta: { total: data.length } };
};

export const getAnalytic = async (id: number) => {
  const item = await prisma.analyticAccount.findUnique({
    where: { id },
    include: { budgets: true }
  });
  if (!item) throw new AppError(404, "Analytic account not found");
  return item;
};

export const createAnalytic = (data: { name: string; type: AnalyticType }) => {
  return prisma.analyticAccount.create({ data });
};

export const updateAnalytic = async (id: number, data: { name?: string; type?: AnalyticType; active?: boolean }) => {
  await getAnalytic(id);
  return prisma.analyticAccount.update({ where: { id }, data });
};
