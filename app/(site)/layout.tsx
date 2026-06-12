import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

/**
 * Site chrome — header, footer, film grain, skip link. Lives in the
 * (site) route group so experimental landings under (x) can own the
 * whole viewport without inheriting any of it.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="film-grain" aria-hidden />
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
