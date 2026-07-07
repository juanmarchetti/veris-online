import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WarningBanner from "@/components/WarningBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Veris Online — Videoconsulta Médica",
  description: "Agenda, paga y conéctate a tu videoconsulta médica con Veris Online. Atención médica desde la comodidad de tu hogar.",
  keywords: "videoconsulta, médico online, telemedicina, Veris, Ecuador",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: 'var(--on-surface)', fontFamily: '"Inter", Arial, Helvetica, sans-serif' }}>
        {/* Banner SRS RF-06.3: Advertencia de urgencias/emergencias — siempre visible */}
        <WarningBanner />
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
