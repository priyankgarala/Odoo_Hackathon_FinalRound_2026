import { api } from "./client";

export type AnalyticType = "INCOME" | "EXPENSE";

export type AnalyticAccount = {
  id: number;
  name: string;
  type: AnalyticType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { budgets: number };
};

export const getAnalytics = async (params?: { search?: string; type?: AnalyticType }) =>
  (await api.get<{ data: AnalyticAccount[]; meta: { total: number } }>("/analyticals", { params })).data;

export const getAnalytic = async (id: number) =>
  (await api.get<{ data: AnalyticAccount }>(`/analyticals/${id}`)).data.data;

export const createAnalytic = async (data: { name: string; type: AnalyticType }) =>
  (await api.post<{ data: AnalyticAccount }>("/analyticals", data)).data.data;

export const updateAnalytic = async (id: number, data: { name?: string; type?: AnalyticType; active?: boolean }) =>
  (await api.put<{ data: AnalyticAccount }>(`/analyticals/${id}`, data)).data.data;
