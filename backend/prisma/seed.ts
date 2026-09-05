import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const roles = ["Admin", "Accountant", "Sales", "Purchase", "Viewer"];
async function main() {
  for (const name of roles) await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  const role = await prisma.role.findUniqueOrThrow({ where: { name: "Admin" } });
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({ where: { email: "admin@urbanfurniture.local" }, update: { name: "System Administrator", passwordHash, roleId: role.id, isActive: true }, create: { name: "System Administrator", email: "admin@urbanfurniture.local", passwordHash, roleId: role.id } });
  const accounts = [
    { code: "1000", name: "Cash", type: "ASSET" }, { code: "1010", name: "Bank", type: "ASSET" },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" }, { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
    { code: "2100", name: "Tax Payable", type: "LIABILITY" }, { code: "3000", name: "Owner's Equity", type: "EQUITY" },
    { code: "4000", name: "Sales Revenue", type: "REVENUE" }, { code: "5000", name: "Purchase Expense", type: "EXPENSE" },
  ] as const;
  for (const account of accounts) await prisma.account.upsert({ where: { code: account.code }, update: { name: account.name, type: account.type }, create: account });
  const journals = [
    { code: "SAL", name: "Sales Journal", type: "SALES" }, { code: "PUR", name: "Purchase Journal", type: "PURCHASE" },
    { code: "CSH", name: "Cash Journal", type: "CASH" }, { code: "BNK", name: "Bank Journal", type: "BANK" }, { code: "GEN", name: "General Journal", type: "GENERAL" },
  ] as const;
  for (const journal of journals) await prisma.journal.upsert({ where: { code: journal.code }, update: { name: journal.name, type: journal.type, active: true }, create: journal });
}
main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
