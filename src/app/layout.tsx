import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppFrame } from "@/components/layout/AppFrame";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pantry App - Office Supplies Management",
  description: "Secure pantry and office supplies management system",
  keywords: ["pantry", "office supplies", "inventory", "management"],
  authors: [{ name: "Pantry App Team" }],
  robots: "noindex, nofollow", // Remove in production
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppFrame>
            {children}
          </AppFrame>
        </Providers>
      </body>
    </html>
  );
}
