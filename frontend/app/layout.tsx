import type { Metadata } from "next";
import { App } from "@/app/App";
import { Layout } from "@/app/components/Layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightSphere — AI-Powered Retail ERP",
  description: "Smart Retail & AI Forecasting System — Real-time inventory, demand prediction, and business intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
       <body className="font-sans antialiased bg-slate-50">
        <App>
          <Layout>
            {children}
          </Layout>
        </App>
      </body>
    </html>
  );
}
