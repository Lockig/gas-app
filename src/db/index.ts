import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

// Khởi tạo lười: chỉ kết nối khi có request đầu tiên, để `next build` không cần DATABASE_URL.
const globalForDb = globalThis as unknown as { db?: Db };

function getDb(): Db {
  if (globalForDb.db) return globalForDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Thiếu biến môi trường DATABASE_URL (chuỗi kết nối Postgres của Supabase).");
  }
  // Supabase pooler (transaction mode, cổng 6543) không hỗ trợ prepared statements.
  // Giữ một kết nối nhỏ cho mỗi instance serverless; pooler của Supabase lo phần còn lại.
  const client = postgres(url, { prepare: false, max: 1 });
  globalForDb.db = drizzle(client, { schema });
  return globalForDb.db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
export { schema };
