import { api } from "./client";

export type Budget = {
  id: number;
  name: string;
  period: string;
  plannedAmount: string;
  responsiblePerson: string;
  analyticAccountId: number;
  analyticAccount: { id: number; name: string; type: string };
  createdAt: string;
  updatedAt: string;
};

export const getBudgets = async (params?: { period?: string; analyticAccountId?: number }) =>
  (await api.get<{ data: Budget[]; meta: { total: number } }>("/budgets", { params })).data;

export const getBudget = async (id: number) =>
  (await api.get<{ data: Budget }>(`/budgets/${id}`)).data.data;

export const createBudget = async (data: {
  name: string;
  period: string;
  plannedAmount: number;
  responsiblePerson: string;
  analyticAccountId: number;
}) => (await api.post<{ data: Budget }>("/budgets", data)).data.data;

export const updateBudget = async (id: number, data: Partial<Budget>) =>
  (await api.put<{ data: Budget }>(`/budgets/${id}`, data)).data.data;
