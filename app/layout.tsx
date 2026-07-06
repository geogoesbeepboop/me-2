import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
// the city's chrome + scene styles are now site-wide — one product
import "./city.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb",
});

export const metadata: Metadata = {
  title: {
    default: "George Andrade-Muñoz — AI engineer",
    template: "%s — George Andrade-Muñoz",
  },
  description:
    "George Andrade-Muñoz builds software people actually use — agents, web, mobile. Build fast, adapt faster; the how gets published.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-void text-bone">{children}</body>
    </html>
  );
}
