import ContentShell from "@/components/city/ContentShell";

/**
 * The editorial archive (projects, writing, about, method) wears the
 * shared city chrome — the same bar, atmosphere and footer as the
 * homepage city — so the whole site reads as one product. The reading
 * canvas underneath stays exactly the editorial archive it always was.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ContentShell>{children}</ContentShell>;
}
