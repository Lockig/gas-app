import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("Thiếu biến môi trường DATABASE_URL (chuỗi kết nối Postgres của Supabase).");
}

// Supabase pooler (transaction mode, cổng 6543) không hỗ trợ prepared statements.
// Giữ một kết nối nhỏ cho mỗi instance serverless; pooler của Supabase lo phần còn lại.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
const client = globalForDb.pg ?? postgres(url, { prepare: false, max: 1 });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
