"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecordView } from "@/lib/calc";
import { fmtMoney, fmtNum, useI18n } from "@/lib/i18n";

type View = "table" | "bar" | "line";
type Point = { month: string; amount: number; liters: number; count: number };

/** Gộp theo tháng, lấp các tháng không đổ bằng 0, tối đa 12 tháng gần nhất. */
function monthlyTotals(records: RecordView[]): Point[] {
  if (!records.length) return [];
  const map = new Map<string, Point>();
  for (const r of records) {
    const m = r.date.slice(0, 7);
    const p = map.get(m) ?? { month: m, amount: 0, liters: 0, count: 0 };
    p.amount += r.amount;
    p.liters += r.liters;
    p.count += 1;
    map.set(m, p);
  }
  const keys = [...map.keys()].sort();
  const [y0, m0] = keys[0].split("-").map(Number);
  const [y1, m1] = keys[keys.length - 1].split("-").map(Number);
  const out: Point[] = [];
  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? (y++, (m = 1)) : m++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push(map.get(key) ?? { month: key, amount: 0, liters: 0, count: 0 });
  }
  return out.slice(-12);
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

const W = 360;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 44 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

function shortMonth(m: string) {
  const [y, mm] = m.split("-");
  return `${mm}/${y.slice(2)}`;
}

function Chart({ data, kind, title }: { data: Point[]; kind: "bar" | "line"; title: string }) {
  const { lang } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.amount)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const band = PW / data.length;
  const x = (i: number) => PAD.left + band * i + band / 2;
  const y = (v: number) => PAD.top + PH - (v / max) * PH;
  const compact = (v: number) => new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
  const barW = Math.min(28, band * 0.6);
  const activePoint = active !== null ? data[active] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        className="h-auto w-full touch-manipulation"
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((tv) => (
          <g key={tv}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(tv)} y2={y(tv)} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(tv) + 4} textAnchor="end" fontSize={10} fill="var(--chart-muted)">
              {compact(tv)}
            </text>
          </g>
        ))}

        {kind === "bar" &&
          data.map((d, i) => {
            const h = (d.amount / max) * PH;
            const r = Math.min(4, barW / 2, h);
            return d.amount > 0 ? (
              <path
                key={d.month}
                d={`M${x(i) - barW / 2},${y(0)} v${-(h - r)} a${r},${r} 0 0 1 ${r},${-r} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} z`}
                fill="var(--chart-series)"
                opacity={active === null || active === i ? 1 : 0.45}
              />
            ) : null;
          })}

        {kind === "line" && (
          <>
            <polyline
              fill="none"
              stroke="var(--chart-series)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={data.map((d, i) => `${x(i)},${y(d.amount)}`).join(" ")}
            />
            {data.map((d, i) => (
              <circle
                key={d.month}
                cx={x(i)}
                cy={y(d.amount)}
                r={active === i ? 5 : 4}
                fill="var(--chart-series)"
                stroke="var(--chart-surface)"
                strokeWidth={2}
              />
            ))}
          </>
        )}

        {data.map((d, i) => (
          <text
            key={d.month}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={10}
            fill="var(--chart-muted)"
            display={data.length > 6 && i % 2 === 1 ? "none" : undefined}
          >
            {shortMonth(d.month)}
          </text>
        ))}

        {/* Vùng bắt chạm rộng hơn mark: cả cột theo chiều dọc */}
        {data.map((d, i) => (
          <rect
            key={d.month}
            x={PAD.left + band * i}
            y={PAD.top}
            width={band}
            height={PH}
            fill="transparent"
            tabIndex={0}
            role="presentation"
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="outline-none focus-visible:stroke-[var(--chart-series)]"
          />
        ))}
      </svg>

      {activePoint && active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${Math.min(Math.max((x(active) / W) * 100, 18), 82)}%`,
            top: `${(Math.max(y(activePoint.amount) - 50, 0) / H) * 100}%`,
          }}
        >
          <p className="font-medium">{shortMonth(activePoint.month)}</p>
          <p>{fmtMoney(activePoint.amount, lang)}</p>
          <p className="text-muted-foreground">{fmtNum(activePoint.liters, lang)} L</p>
        </div>
      )}
    </div>
  );
}

export function SpendingCharts({ records, error, onRetry }: { records: RecordView[] | null; error: boolean; onRetry: () => void }) {
  const { t, lang } = useI18n();
  const [view, setView] = useState<View>("table");
  const data = useMemo(() => (records ? monthlyTotals(records) : []), [records]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-2">
          {t("loadError")}
          <Button size="sm" variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!records) return <Skeleton className="h-64 w-full rounded-xl" aria-label={t("loading")} />;
  if (!data.length) {
    return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("chartEmpty")}</p>;
  }

  const viewLabels: Record<View, string> = { table: t("viewTable"), bar: t("viewBar"), line: t("viewLine") };

  return (
    <div className="space-y-3 [--chart-grid:oklch(0.3_0.02_165)] [--chart-muted:oklch(0.72_0.03_165)] [--chart-series:oklch(0.74_0.19_150)] [--chart-surface:oklch(0.19_0.016_165)]">
      <div className="flex items-center justify-end gap-2">
        <Label htmlFor="chart-view" className="text-muted-foreground">
          {t("viewAs")}
        </Label>
        <Select value={view} items={viewLabels} onValueChange={(v) => v && setView(v as View)}>
          <SelectTrigger id="chart-view" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(viewLabels) as View[]).map((v) => (
              <SelectItem key={v} value={v}>
                {viewLabels[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {view === "table" ? (
        <Card size="sm">
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 font-normal">{t("monthCol")}</th>
                  <th className="py-1 text-right font-normal">{t("fillCount")}</th>
                  <th className="py-1 text-right font-normal">{t("totalLiters")}</th>
                  <th className="py-1 text-right font-normal">{t("totalCost")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.month} className="border-t">
                    <td className="py-2">{shortMonth(d.month)}</td>
                    <td className="py-2 text-right">{d.count}</td>
                    <td className="py-2 text-right">{fmtNum(d.liters, lang)}</td>
                    <td className="py-2 text-right font-medium">{fmtMoney(d.amount, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t(view === "bar" ? "chartBarTitle" : "chartLineTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={data} kind={view} title={t(view === "bar" ? "chartBarTitle" : "chartLineTitle")} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
