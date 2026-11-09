"use client";

import { UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Giai đoạn này chưa triển khai tài khoản: chỉ có màn hình giữ chỗ.
export function AccountTab() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <UserRound className="size-10 text-muted-foreground" />
      <p className="text-lg font-semibold">{t("comingSoon")}</p>
      <p className="text-sm text-muted-foreground">{t("comingSoonDesc")}</p>
    </div>
  );
}
