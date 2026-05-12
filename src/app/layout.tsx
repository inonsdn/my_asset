import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import DataProvider from "@/components/layout/DataProvider";
import SyncErrorBanner from "@/components/layout/SyncErrorBanner";
import { CurrencyProvider } from "@/lib/currency";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinanceOS — Personal Finance Dashboard",
  description: "Track income, expenses, investments, and plan your retirement",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-slate-900 text-slate-100 flex antialiased">
        <CurrencyProvider>
          <AuthProvider>
            <DataProvider>
              <Sidebar />
              <main className="flex-1 min-w-0 overflow-auto">{children}</main>
              <SyncErrorBanner />
            </DataProvider>
          </AuthProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
