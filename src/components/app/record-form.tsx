"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "./date-picker";
import { chronological, computeLiters, computeMetrics, type RecordView } from "@/lib/calc";
import { fmtDate, fmtMoney, fmtNum, useI18n } from "@/lib/i18n";
import { todayIso } from "@/lib/validation";

type PriceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; source: string; updatedAt: string | null; products: { name: string; price: number }[] }
  | { status: "error"; code: "not_configured" | "no_data" | "network" };

export function RecordForm({
  editing,
  records,
  onDone,
}: {
  editing: RecordView | null;
  records: RecordView[];
  onDone: () => void;
}) {
  const { t, err, lang } = useI18n();
  const [date, setDate] = useState(editing?.date ?? todayIso());
  const [fuelType, setFuelType] = useState(editing?.fuelType ?? "");
  const [price, setPrice] = useState(editing ? String(editing.pricePerLiter) : "");
  const [priceSource, setPriceSource] = useState<"api" | "manual">((editing?.priceSource as "api" | "manual") ?? "manual");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [odometer, setOdometer] = useState(editing?.odometer != null ? String(editing.odometer) : "");
  const [priceState, setPriceState] = useState<PriceState>({ status: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const firstRun = useRef(true);
  const fuelTypeRef = useRef(fuelType);
  useEffect(() => {
    fuelTypeRef.current = fuelType;
  }, [fuelType]);

  // Gọi API giá xăng mỗi khi đổi ngày. Khi sửa record, lần đầu chỉ nạp danh sách loại xăng và giữ giá đã lưu.
  useEffect(() => {
    if (!date) return;
    const keepSaved = !!editing && firstRun.current;
    firstRun.current = false;
    const ctrl = new AbortController();
    queueMicrotask(() => setPriceState({ status: "loading" }));
    fetch(`/api/fuel-price?date=${date}`, { signal: ctrl.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.products)) {
          setPriceState({ status: "ok", source: data.source, updatedAt: data.updatedAt, products: data.products });
          if (keepSaved) return;
          const match = data.products.find((p: { name: string }) => p.name === fuelTypeRef.current);
          if (match) {
            setPrice(String(match.price));
            setPriceSource("api");
          } else {
            setFuelType("");
            setPrice("");
            setPriceSource("manual");
          }
        } else {
          if (!keepSaved) setPrice("");
          setPriceSource("manual");
          setPriceState({ status: "error", code: data.error === "not_configured" ? "not_configured" : data.error === "no_data" ? "no_data" : "network" });
        }
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        if (!keepSaved) setPrice("");
        setPriceSource("manual");
        setPriceState({ status: "error", code: "network" });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const products = priceState.status === "ok" ? priceState.products : [];
  const fuelItems = Object.fromEntries(products.map((p) => [p.name, p.name]));
  if (fuelType && !(fuelType in fuelItems)) fuelItems[fuelType] = fuelType;
  const showPrice = fuelType !== "" || priceState.status === "error";

  function onFuelTypeChange(name: string) {
    setFuelType(name);
    const match = products.find((p) => p.name === name);
    if (match) {
      setPrice(String(match.price));
      setPriceSource("api");
    }
  }

  const priceNum = Number(price);
  const amountNum = Number(amount);
  const odoNum = Number(odometer);

  const calc = useMemo(() => {
    if (!(priceNum > 0) || !(amountNum > 0)) return null;
    const liters = computeLiters(amountNum, priceNum);
    // Lần đổ liền trước (theo ngày) phải có km thì mới tính được quãng đường.
    const prev = chronological(records.filter((r) => r.id !== editing?.id && r.date <= date)).at(-1);
    const distance =
      odometer !== "" && Number.isFinite(odoNum) && prev?.odometer != null ? odoNum - prev.odometer : null;
    return { liters, distance, ...computeMetrics(liters, amountNum, distance) };
  }, [priceNum, amountNum, odoNum, odometer, records, editing, date]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!date) e.date = "required_date";
    else if (date > todayIso()) e.date = "future_date";
    if (!(priceNum > 0)) e.price = "invalid_price";
    if (!(amountNum > 0)) e.amount = "invalid_amount";
    if (odometer !== "" && !(odoNum >= 0)) e.odometer = "invalid_odometer";
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/records/${editing.id}` : "/api/records", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, fuelType: fuelType || null, pricePerLiter: priceNum, priceSource, amount: amountNum, odometer: odometer === "" ? null : odoNum }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data.error as string | undefined;
        if (code === "odometer_not_greater" || code === "odometer_not_less" || code === "invalid_odometer") setErrors({ odometer: code });
        else if (code === "invalid_price") setErrors({ price: code });
        else if (code === "invalid_amount") setErrors({ amount: code });
        else if (code === "invalid_date" || code === "future_date") setErrors({ date: code });
        else toast.error(err(code));
        return;
      }
      toast.success(t("saved"));
      onDone();
    } catch {
      toast.error(t("loadError"));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldErr = (k: string) =>
    errors[k] ? (
      <p id={`${k}-err`} role="alert" className="text-sm text-destructive">
        {err(errors[k])}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">{t("date")}</Label>
          <DatePicker id="date" value={date} onChange={setDate} max={new Date()} invalid={!!errors.date} />
          {fieldErr("date")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fuel-type">{t("fuelType")}</Label>
          <Select
            value={fuelType || null}
            items={fuelItems}
            disabled={priceState.status === "loading" || products.length === 0}
            onValueChange={(v) => v && onFuelTypeChange(v)}
          >
            <SelectTrigger id="fuel-type" className="w-full">
              <SelectValue placeholder={t("pickFuelType")} />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(fuelItems).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {priceState.status === "loading" && (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
              <Loader2 className="size-3.5 animate-spin" /> {t("priceLoading")}
            </p>
          )}
          {priceState.status === "ok" && fuelType === "" && (
            <p className="text-sm text-muted-foreground">{t("priceSelectFirst")}</p>
          )}
        </div>

        {showPrice && (
          <div className="space-y-1.5">
            <Label htmlFor="price">{t("pricePerLiter")}</Label>
            <Input
              id="price"
              inputMode="numeric"
             
              value={price}
              aria-invalid={!!errors.price || undefined}
              aria-describedby="price-hint"
              onChange={(e) => {
                setPrice(e.target.value.replace(/[^\d.]/g, ""));
                setPriceSource("manual");
              }}
            />
            <p id="price-hint" className="text-sm text-muted-foreground" aria-live="polite">
              {priceState.status === "ok" && priceSource === "api" &&
                t("priceFromApi", {
                  source: priceState.source,
                  updated: priceState.updatedAt ? t("priceUpdated", { date: priceState.updatedAt }) : "",
                })}
              {priceState.status === "error" &&
                t(priceState.code === "not_configured" ? "priceNotConfigured" : priceState.code === "no_data" ? "priceNoData" : "priceNetwork")}
              {priceState.status === "ok" && priceSource === "manual" && price !== "" && t("priceManual")}
            </p>
            {fieldErr("price")}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="amount">{t("amount")}</Label>
          <Input
            id="amount"
            inputMode="numeric"
           
            value={amount}
            aria-invalid={!!errors.amount || undefined}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          />
          {fieldErr("amount")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="odometer">{t("odometer")}</Label>
          <Input
            id="odometer"
            inputMode="decimal"
           
            value={odometer}
            aria-invalid={!!errors.odometer || undefined}
            onChange={(e) => setOdometer(e.target.value.replace(/[^\d.]/g, ""))}
          />
          {fieldErr("odometer")}
        </div>

        {calc && (
          <div className="rounded-xl border bg-muted/40 p-3" aria-live="polite">
            <p className="mb-2 text-sm font-medium">{t("preview")}</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <Metric label={t("liters")} value={`${fmtNum(calc.liters, lang)} L`} />
              <Metric label={t("distance")} value={calc.distance ? `${fmtNum(calc.distance, lang, 1)} km` : t("notEnoughData")} />
              <Metric label={t("litersPer100")} value={calc.litersPer100km !== null ? fmtNum(calc.litersPer100km, lang) : t("notEnoughData")} />
              <Metric label={t("costPerKm")} value={calc.costPerKm !== null ? fmtMoney(calc.costPerKm, lang) : t("notEnoughData")} />
            </dl>
            {calc.distance === null && (
              <Alert className="mt-3">
                <AlertDescription>{t("firstRecordHint")}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
        {editing && <span className="sr-only">{fmtDate(editing.date, lang)}</span>}
      </div>

      <DrawerFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onDone}>
          {t("cancel")}
        </Button>
      </DrawerFooter>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
