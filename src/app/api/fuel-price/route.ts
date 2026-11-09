import { NextResponse } from "next/server";

const DEFAULT_URL = "https://vietfuelapi-demo.pages.dev/mock-data/fuel-prices.json";

type Item = {
  name: string;
  sources: { source: string; region1: number | null; region2: number | null; price: number | null }[];
};
type Payload = { meta?: { priceDate?: string; primarySource?: string; primarySourceId?: string }; data?: Item[] };

/**
 * Lấy giá xăng gần nhất từ API vietfuel (chỉ có một mốc giá mới nhất, không có lịch sử theo ngày).
 * Dù người dùng chọn ngày nào, trả về mức giá của ngày cập nhật gần nhất kèm ngày đó (priceDate).
 * Trả về danh sách loại nhiên liệu kèm giá. Cấu hình qua env: FUEL_PRICE_API_URL,
 * FUEL_PRICE_REGION ("region1" | "region2", mặc định region1).
 * Nếu lỗi/không có dữ liệu thì trả lỗi rõ ràng, không bao giờ trả giá giả.
 */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  const url = process.env.FUEL_PRICE_API_URL || DEFAULT_URL;
  const region = process.env.FUEL_PRICE_REGION === "region2" ? "region2" : "region1";

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.FUEL_PRICE_API_KEY) headers.Authorization = `Bearer ${process.env.FUEL_PRICE_API_KEY}`;
    const res = await fetch(url, { headers, next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    const json = (await res.json()) as Payload;

    const primaryId = json.meta?.primarySourceId ?? "petrolimex";
    const products = (json.data ?? [])
      .map((item) => {
        const src = item.sources.find((s) => s.source === primaryId) ?? item.sources[0];
        return { name: item.name, price: Number(src?.[region] ?? src?.price) };
      })
      .filter((p) => Number.isFinite(p.price) && p.price > 0);
    if (!products.length) return NextResponse.json({ error: "no_data" }, { status: 404 });
    return NextResponse.json({
      products,
      source: `${json.meta?.primarySource ?? primaryId} (${region === "region1" ? "Vùng 1" : "Vùng 2"})`,
      updatedAt: json.meta?.priceDate ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
