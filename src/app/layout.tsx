import type { Metadata } from "next";
import { Fredoka, Montserrat } from "next/font/google";
import "../styles/tokens.css";
import "../styles/motion.css";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  // Rango extendido para las plantillas SPA (WB-plantillas-fundaciones, S0a):
  // 300 para párrafos largos y 800 para los titulares Montserrat de
  // SERVICIOS/PORTFOLIO/TIENDA. Los pesos 400-700 ya en uso no se tocan.
  weight: ["300", "400", "500", "600", "700", "800"],
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
