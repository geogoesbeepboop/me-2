import XRail from "./x-rail";

/**
 * (x) — exploration group. No site chrome, no film grain, no template
 * cut: every landing under here owns the entire viewport and brings
 * its own typography, color, and motion. Only the review rail rides
 * along.
 */
export default function XLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <XRail />
    </>
  );
}
