import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
const shutdown = async () => { await prisma.$disconnect(); server.close(() => process.exit(0)); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
