import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

export type BudgetInput = {
  name: string;
  period: string;
  plannedAmount: number;
  responsiblePerson: string;
  analyticAccountId: number;
};

export const listBudgets = async (query: { period?: string; analyticAccountId?: number }) => {
  const where: Prisma.BudgetWhereInput = {
    ...(query.period ? { period: query.period } : {}),
    ...(query.analyticAccountId ? { analyticAccountId: query.analyticAccountId } : {})
  };
  const data = await prisma.budget.findMany({
    where,
    include: {
      analyticAccount: { select: { id: true, name: true, type: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return { data, meta: { total: data.length } };
};

export const getBudget = async (id: number) => {
  const item = await prisma.budget.findUnique({
    where: { id },
    include: {
      analyticAccount: true
    }
  });
  if (!item) throw new AppError(404, "Budget not found");
  return item;
};

export const createBudget = async (data: BudgetInput) => {
  const analytic = await prisma.analyticAccount.findUnique({ where: { id: data.analyticAccountId } });
  if (!analytic || !analytic.active) throw new AppError(400, "Valid active analytic account is required");
  return prisma.budget.create({
    data: {
      name: data.name,
      period: data.period,
      plannedAmount: new Prisma.Decimal(data.plannedAmount),
      responsiblePerson: data.responsiblePerson,
      analyticAccountId: data.analyticAccountId
    },
    include: { analyticAccount: true }
  });
};

export const updateBudget = async (id: number, data: Partial<BudgetInput>) => {
  await getBudget(id);
  return prisma.budget.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.period ? { period: data.period } : {}),
      ...(data.plannedAmount ? { plannedAmount: new Prisma.Decimal(data.plannedAmount) } : {}),
      ...(data.responsiblePerson ? { responsiblePerson: data.responsiblePerson } : {}),
      ...(data.analyticAccountId ? { analyticAccountId: data.analyticAccountId } : {})
    },
    include: { analyticAccount: true }
  });
};
