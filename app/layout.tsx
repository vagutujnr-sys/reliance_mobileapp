import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Reliance Mobility",
    template: "%s · Reliance Mobility",
  },
  description: "Driving Possibilities. Delivering Trust.",
  applicationName: "Reliance Mobility",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Reliance" },
  icons: { icon: "/brand/main-logo.png", apple: "/brand/main-logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#111113",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
