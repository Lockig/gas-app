"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { vi, enUS } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateFromIso, fmtDate, isoFromDate, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function DatePicker({
  id,
  value,
  onChange,
  max,
  invalid,
  className,
  placeholder,
  ...rest
}: {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  max?: Date;
  invalid?: boolean;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            aria-label={rest["aria-label"]}
            type="button"
            variant="outline"
            aria-invalid={invalid || undefined}
            className={cn("h-11 w-full justify-start gap-2 bg-transparent text-base font-normal hover:border-primary/50", !value && "text-muted-foreground", className)}
          />
        }
      >
        <CalendarIcon className="text-primary" />
        {value ? fmtDate(value, lang) : (placeholder ?? t("pickDate"))}
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden rounded-2xl border-primary/20 p-0 shadow-xl shadow-black/40" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={new Date(2015, 0)}
          endMonth={max ?? new Date()}
          locale={lang === "vi" ? vi : enUS}
          selected={value ? dateFromIso(value) : undefined}
          defaultMonth={value ? dateFromIso(value) : undefined}
          disabled={max ? { after: max } : undefined}
          className="p-3 [--cell-size:--spacing(10)]"
          onSelect={(d) => {
            if (d) {
              onChange(isoFromDate(d));
              setOpen(false);
            }
          }}
        />
        <div className="border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full text-primary"
            onClick={() => {
              onChange(isoFromDate(new Date()));
              setOpen(false);
            }}
          >
            {t("today")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
