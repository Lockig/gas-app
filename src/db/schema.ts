import { doublePrecision, pgTable, serial, text } from "drizzle-orm/pg-core";

// Chưa có tài khoản ở giai đoạn này; sau này thêm cột user_id.
export const fuelRecords = pgTable("fuel_records", {
  id: serial("id").primaryKey(),
  /** Ngày đổ, định dạng YYYY-MM-DD */
  date: text("date").notNull(),
  /** Loại nhiên liệu (tên sản phẩm từ nguồn giá), có thể trống với bản ghi cũ */
  fuelType: text("fuel_type"),
  /** Giá xăng đồng/lít */
  pricePerLiter: doublePrecision("price_per_liter").notNull(),
  /** "api" nếu lấy từ nguồn giá, "manual" nếu nhập tay */
  priceSource: text("price_source").notNull().default("manual"),
  /** Số tiền đã đổ (đồng) */
  amount: doublePrecision("amount").notNull(),
  /** Số lít = amount / pricePerLiter */
  liters: doublePrecision("liters").notNull(),
  /** Số km trên đồng hồ (tuỳ chọn) */
  odometer: doublePrecision("odometer"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type FuelRecord = typeof fuelRecords.$inferSelect;
