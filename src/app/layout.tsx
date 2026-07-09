import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WarningBanner from "@/components/WarningBanner";
import { getSiteUrl } from "@/utils/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Veris Online",
  title: {
    default: "Veris Online | Videoconsulta médica",
    template: "%s | Veris Online",
  },
  description: "Portal de videoconsulta médica para agendar, confirmar y acceder a atención online con historial clínico digital.",
  keywords: [
    "videoconsulta",
    "telemedicina",
    "médico online",
    "consulta médica virtual",
    "historial clínico digital",
    "Veris Online",
    "Ecuador",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Veris Online | Videoconsulta médica",
    description: "Agenda videoconsultas, confirma tu atención y accede a tu historial clínico desde un portal web conectado.",
    url: "/",
    siteName: "Veris Online",
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veris Online | Videoconsulta médica",
    description: "Portal web para videoconsultas, agenda médica e historial clínico digital.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
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
