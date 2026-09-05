import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const roles = ["Admin", "Accountant", "Sales", "Purchase", "Viewer"];
async function main() {
  for (const name of roles) await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  const role = await prisma.role.findUniqueOrThrow({ where: { name: "Admin" } });
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({ where: { email: "admin@urbanfurniture.local" }, update: { name: "System Administrator", passwordHash, roleId: role.id, isActive: true }, create: { name: "System Administrator", email: "admin@urbanfurniture.local", passwordHash, roleId: role.id } });
}
main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
