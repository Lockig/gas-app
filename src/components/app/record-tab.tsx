"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Droplets, Fuel, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SpendingCharts } from "./spending-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecordForm } from "./record-form";
import type { RecordView } from "@/lib/calc";
import { fmtDate, fmtMoney, fmtNum, useI18n } from "@/lib/i18n";

export function RecordTab() {
  const { t, lang, err } = useI18n();
  const [records, setRecords] = useState<RecordView[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecordView | null>(null);
  const [toDelete, setToDelete] = useState<RecordView | null>(null);
  const [month, setMonth] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/records", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecords(data.records);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  const filtered = useMemo(() => {
    if (!records) return [];
    return records.filter((r) => !month || r.date.startsWith(month));
  }, [records, month]);

  const totals = useMemo(
    () => ({ cost: filtered.reduce((s, r) => s + r.amount, 0), liters: filtered.reduce((s, r) => s + r.liters, 0) }),
    [filtered],
  );


  async function confirmDelete() {
    if (!toDelete) return;
    try {
      const res = await fetch(`/api/records/${toDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("deleted"));
      setToDelete(null);
      load();
    } catch {
      toast.error(err("generic"));
    }
  }

  return (
    <div className="space-y-4">
      <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
        <Droplets />
        <AlertDescription className="text-current">{t("fillTankNotice")}</AlertDescription>
      </Alert>

      <Button
        size="lg"
        className="h-12 w-full text-base"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus /> {t("addRecord")}
      </Button>

      <Tabs defaultValue="history" className="gap-3">
        <TabsList className="grid w-full grid-cols-2 group-data-horizontal/tabs:h-11">
          <TabsTrigger value="history" className="text-sm">
            {t("tabHistory")}
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-sm">
            {t("tabCharts")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <div className="min-w-44 flex-1 sm:max-w-56">
            <Input
              type="month"
              aria-label={t("filterMonth")}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          {month !== "" && (
            <Button variant="ghost" className="h-11" onClick={() => setMonth("")}>
              {t("clearFilter")}
            </Button>
          )}
        </div>

        {records && records.length > 0 && (
          <Card size="sm">
            <CardContent className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">{t("totalCost")}</p>
                <p className="font-semibold">{fmtMoney(totals.cost, lang)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("totalLiters")}</p>
                <p className="font-semibold">{fmtNum(totals.liters, lang)} L</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">&nbsp;</p>
                <p className="font-semibold">{t("records", { n: filtered.length })}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-2">
              {t("loadError")}
              <Button size="sm" variant="outline" onClick={load}>
                {t("retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : !records ? (
          <div className="space-y-3" aria-busy="true" aria-label={t("loading")}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
            <Fuel className="size-8 text-muted-foreground" />
            <p className="font-medium">{t("emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("emptyDesc")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("emptyFiltered")}</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => {
              const open = expandedId === r.id;
              return (
                <li key={r.id}>
                  <Card size="sm" className={open ? "ring-primary/40" : undefined}>
                    <CardContent className="space-y-3">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`record-${r.id}`}
                        onClick={() => setExpandedId(open ? null : r.id)}
                        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold">{fmtDate(r.date, lang)}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {r.fuelType ?? `${fmtMoney(r.pricePerLiter, lang)}/L`}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-lg font-semibold text-primary">{fmtMoney(r.amount, lang)}</span>
                          <ChevronDown className={`size-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                        </span>
                      </button>

                      {open && (
                        <div id={`record-${r.id}`} className="space-y-3 border-t pt-3">
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                            <Stat label={t("pricePerLiter")} value={`${fmtMoney(r.pricePerLiter, lang)}/L`} />
                            <Stat label={t("liters")} value={`${fmtNum(r.liters, lang)} L`} />
                            <Stat label={t("odometerShort")} value={r.odometer !== null ? `${fmtNum(r.odometer, lang, 1)} km` : "—"} />
                            <Stat label={t("distance")} value={r.distance !== null ? `${fmtNum(r.distance, lang, 1)} km` : "—"} />
                            <Stat label={t("litersPer100")} value={r.litersPer100km !== null ? fmtNum(r.litersPer100km, lang) : "—"} />
                            <Stat label={t("costPerKm")} value={r.costPerKm !== null ? fmtMoney(r.costPerKm, lang) : "—"} />
                          </dl>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              className="h-11 px-4"
                              onClick={() => {
                                setEditing(r);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil /> {t("edit")}
                            </Button>
                            <Button variant="outline" className="h-11 px-4 text-destructive" onClick={() => setToDelete(r)}>
                              <Trash2 /> {t("delete")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
        </TabsContent>

        <TabsContent value="charts">
          <SpendingCharts records={records} error={loadError} onRetry={load} />
        </TabsContent>
      </Tabs>

      <Drawer open={formOpen} onOpenChange={setFormOpen}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader>
            <DrawerTitle>{editing ? t("editRecord") : t("addRecord")}</DrawerTitle>
            <DrawerDescription className="sr-only">{t("fillTankNotice")}</DrawerDescription>
          </DrawerHeader>
          {formOpen && (
            <RecordForm
              key={editing?.id ?? "new"}
              editing={editing}
              records={records ?? []}
              onDone={() => {
                setFormOpen(false);
                load();
              }}
            />
          )}
        </DrawerContent>
      </Drawer>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
