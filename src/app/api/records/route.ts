import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { computeLiters, validateOdometer, withMetrics } from "@/lib/calc";
import { parseRecordInput } from "@/lib/validation";


export async function GET() {
  try {
    const rows = await db.select().from(schema.fuelRecords);
    return NextResponse.json({ records: withMetrics(rows) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const parsed = parseRecordInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;
  try {
    const rows = await db.select().from(schema.fuelRecords);
    const odoError = v.odometer === null ? null : validateOdometer(rows, v.date, v.odometer);
    if (odoError) return NextResponse.json({ error: odoError }, { status: 400 });
    const now = new Date().toISOString();
    const [created] = await db
      .insert(schema.fuelRecords)
      .values({ ...v, liters: computeLiters(v.amount, v.pricePerLiter), createdAt: now, updatedAt: now })
      .returning();
    return NextResponse.json({ record: created }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
