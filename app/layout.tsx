import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import { headers } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LN Boys PG & Hostel",
  description:
    "Premium boys PG accommodation in Jaipur. Fully furnished rooms with 3 meals/day, 24x7 CCTV, high-speed Wi-Fi.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className={isAdmin ? "bg-gray-50 text-gray-900 min-h-screen" : "bg-[#0B0B3B] text-white"}>
        {!isAdmin && <Navbar />}
        <main>{children}</main>
        {!isAdmin && <Footer />}
        {!isAdmin && <WhatsAppFAB />}
      </body>
    </html>
  );
}
