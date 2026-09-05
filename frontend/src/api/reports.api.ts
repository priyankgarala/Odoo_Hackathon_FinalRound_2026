import { api } from "./client";

export type BalanceSheetData = {
  asOfDate: string;
  assets: Array<{ id: number; code: string; name: string; balance: number }>;
  liabilities: Array<{ id: number; code: string; name: string; balance: number }>;
  capital: Array<{ id: number; code: string; name: string; balance: number }>;
  totals: {
    assets: number;
    liabilities: number;
    capital: number;
    totalLiabilitiesAndCapital: number;
  };
};

export type ProfitLossData = {
  period: { start: string; end: string };
  income: Array<{ id: number; code: string; name: string; amount: number }>;
  expenses: Array<{ id: number; code: string; name: string; amount: number }>;
  totals: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
  };
};

export type BudgetReportItem = {
  id: number;
  name: string;
  period: string;
  responsiblePerson: string;
  analyticAccount: string;
  analyticType: string;
  plannedAmount: number;
  achievedAmount: number;
  remainingAmount: number;
  percentage: number;
};

export type BudgetReportData = {
  period: string;
  data: BudgetReportItem[];
  totals: {
    totalPlanned: number;
    totalAchieved: number;
  };
};

export const getBalanceSheet = async (asOfDate?: string) =>
  (await api.get<{ data: BalanceSheetData }>("/reports/balance-sheet", { params: { asOfDate } })).data.data;

export const getProfitLoss = async (params?: { startDate?: string; endDate?: string }) =>
  (await api.get<{ data: ProfitLossData }>("/reports/profit-loss", { params })).data.data;

export const getBudgetReport = async (period?: string) =>
  (await api.get<{ data: BudgetReportData }>("/reports/budget", { params: { period } })).data.data;
