import { NextResponse } from "next/server";
import { eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { computeLiters, validateOdometer } from "@/lib/calc";
import { parseRecordInput } from "@/lib/validation";


type Ctx = { params: Promise<{ id: string }> };

async function getId(ctx: Ctx): Promise<number | null> {
  const { id } = await ctx.params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PUT(req: Request, ctx: Ctx) {
  const id = await getId(ctx);
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  const parsed = parseRecordInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;
  try {
    const others = await db.select().from(schema.fuelRecords).where(ne(schema.fuelRecords.id, id));
    const odoError = v.odometer === null ? null : validateOdometer(others, v.date, v.odometer);
    if (odoError) return NextResponse.json({ error: odoError }, { status: 400 });
    const [updated] = await db
      .update(schema.fuelRecords)
      .set({ ...v, liters: computeLiters(v.amount, v.pricePerLiter), updatedAt: new Date().toISOString() })
      .where(eq(schema.fuelRecords.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ record: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = await getId(ctx);
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  try {
    await db.delete(schema.fuelRecords).where(eq(schema.fuelRecords.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
