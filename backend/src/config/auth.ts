import { env } from "./env.js";
export const AUTH_COOKIE = "urban_furniture_session";
export const authCookieOptions = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 8 * 60 * 60 * 1000 };
