import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yalla Restaurant | Digital Menu",
  description: "Premium digital ordering system for Yalla",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // We force the "dark" class here so our premium theme always applies
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}