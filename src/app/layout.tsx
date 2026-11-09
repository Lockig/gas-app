import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gas App – Quản lý chi phí xăng",
  description: "Ghi lại các lần đổ xăng, theo dõi chi phí và tìm cây xăng gần bạn.",
};

export const viewport: Viewport = {
  themeColor: "#0b1511",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <I18nProvider>
          {children}
          <Toaster position="top-center" theme="dark" />
        </I18nProvider>
      </body>
    </html>
  );
}
