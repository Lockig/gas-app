"use client";

import { Fuel, MapPin, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n, type Lang } from "@/lib/i18n";
import { RecordTab } from "./record-tab";
import { AccountTab } from "./account-tab";
import { StationsTab } from "./stations-tab";

const LANGS: Record<Lang, string> = { vi: "Tiếng Việt", en: "English" };

export function AppShell() {
  const { t, lang, setLang } = useI18n();
  const tabs = [
    { value: "stations", label: t("tabStations"), icon: MapPin },
    { value: "record", label: t("tabRecord"), icon: Fuel },
    { value: "account", label: t("tabAccount"), icon: UserRound },
  ];

  return (
    <Tabs defaultValue="record" className="mx-auto min-h-dvh w-full max-w-3xl gap-0">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <h1 className="py-3 text-lg font-bold">⛽ {t("appName")}</h1>
        <Select value={lang} items={LANGS} onValueChange={(v) => setLang(v as Lang)}>
          <SelectTrigger aria-label={t("language")} className="w-36 data-[size=default]:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LANGS) as Lang[]).map((l) => (
              <SelectItem key={l} value={l}>
                {LANGS[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <main className="flex-1 px-4 pt-4 pb-28">
        <TabsContent value="record">
          <RecordTab />
        </TabsContent>
        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
        <TabsContent value="stations">
          <StationsTab />
        </TabsContent>
      </main>

      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <TabsList className="mx-auto grid h-16 w-full max-w-3xl grid-cols-3 rounded-none bg-transparent p-1">
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-full min-h-11 flex-col gap-0.5 text-xs data-active:text-primary"
            >
              <Icon className="size-5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </nav>
    </Tabs>
  );
}
