// Resolve system accounts by immutable codes rather than database IDs.
export const SYSTEM_ACCOUNT_CODES = { cash: "1000", bank: "1010", receivable: "1100", payable: "2000", taxInputCredit: "1300", taxPayable: "2100", equity: "3000", salesRevenue: "4000", purchaseExpense: "5000" } as const;
