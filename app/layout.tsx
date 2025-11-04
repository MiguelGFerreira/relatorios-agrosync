import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import { Toaster } from "sonner";
import AuthProvider from "./components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Relatórios Agrosync",
  description: "Relatórios do sistema de gerenciamento do armazém",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} antialiased`}
      >
        <AuthProvider>
          <div className="flex h-full">
            <Sidebar />
            <main className="flex-1 min-h-screen p-6 sm:p-8 lg:p-10 overflow-y-auto">
              {children}
            </main>
            <Toaster richColors position="top-right" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
