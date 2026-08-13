import type { Metadata } from "next";
import { Fredoka, Montserrat } from "next/font/google";
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
  title: "WebBot — Devalpo",
  description: "Presencia digital activa para cada PyME chilena, generada por IA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fredoka.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
