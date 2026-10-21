import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdminBTP — Gestion administrative et opérationnelle du BTP",
  description:
    "Plateforme SaaS de gestion de chantiers, documents, validations et automatisation pour le BTP à Mayotte et en France.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface-subtle text-graphite-900">
        {children}
      </body>
    </html>
  );
}
