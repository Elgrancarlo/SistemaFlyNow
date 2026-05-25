import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flynow — Order System",
  description: "Dashboard de gestão de pedidos FLYNOW",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${geist.className} h-full text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
