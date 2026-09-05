import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";

export const app = express();
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
