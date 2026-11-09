export type RecordInput = {
  date: string;
  fuelType: string | null;
  pricePerLiter: number;
  priceSource: "api" | "manual";
  amount: number;
  odometer: number | null;
};

export function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Trả về RecordInput hợp lệ hoặc mã lỗi. */
export function parseRecordInput(body: unknown): { ok: true; value: RecordInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const b = body as Record<string, unknown>;
  const date = typeof b.date === "string" ? b.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { ok: false, error: "invalid_date" };
  }
  if (date > todayIso()) return { ok: false, error: "future_date" };
  const price = Number(b.pricePerLiter);
  const amount = Number(b.amount);
  const odoRaw = b.odometer;
  const hasOdo = odoRaw !== null && odoRaw !== undefined && odoRaw !== "";
  const odometer = hasOdo ? Number(odoRaw) : null;
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: "invalid_price" };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "invalid_amount" };
  if (odometer !== null && (!Number.isFinite(odometer) || odometer < 0)) return { ok: false, error: "invalid_odometer" };
  return {
    ok: true,
    value: {
      date,
      fuelType: typeof b.fuelType === "string" && b.fuelType.trim() ? b.fuelType.trim().slice(0, 80) : null,
      pricePerLiter: price,
      priceSource: b.priceSource === "api" ? "api" : "manual",
      amount,
      odometer,
    },
  };
}
