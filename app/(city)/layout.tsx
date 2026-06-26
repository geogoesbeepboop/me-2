/**
 * (city) — the homepage owns the whole viewport: the drawn San Francisco
 * over the live fleet board. It brings its own city bar and footer (the
 * same shared chrome the editorial pages wear), so this layout only adds
 * the skip link.
 */
export default function CityLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      {children}
    </>
  );
}
