import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Pasajes Fluviales - Alto Impacto Travel",
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
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
