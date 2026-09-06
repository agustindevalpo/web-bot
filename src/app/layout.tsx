import type { Metadata } from "next";
import { Fredoka, Montserrat } from "next/font/google";
import "../styles/tokens.css";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tu sitio web en 1 día, con tu dominio — Devalpo",
  description:
    "Sitio web profesional para tu negocio, publicado en tu propio dominio en 1 día hábil. Pago único, sin mensualidades.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fredoka.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
