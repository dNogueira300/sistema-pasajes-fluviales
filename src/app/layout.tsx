import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/providers/session-provider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alto Impacto Travel",
  description:
    "Sistema web para gestión de ventas de pasajes fluviales en Iquitos, Loreto, Perú",
  keywords: "pasajes fluviales, iquitos, loreto, transporte, amazonas",
  authors: [{ name: "Equipo TDS_G01" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProviderWrapper>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155" },
              success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
