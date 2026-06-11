import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import "./globals.css";

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
      <body className="flex min-h-full flex-col bg-void text-bone">
        <div className="film-grain" aria-hidden />
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
