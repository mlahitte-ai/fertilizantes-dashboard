import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tablero de Fertilizantes",
  description: "Precios de fertilizantes y granos — Argentina y mercado mundial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
