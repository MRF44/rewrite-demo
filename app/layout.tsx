import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", base).toString();

  return {
    metadataBase: base,
    title: "Rewrite — Change one decision",
    description:
      "An evidence-led product decision workspace, demonstrated through RevSync’s move from tax-obligation behavior to planning-only software.",
    openGraph: {
      title: "Rewrite — Change one decision. See everything it changes.",
      description:
        "Trace a product rewrite through features, data migration, files, and flows.",
      type: "website",
      images: [{ url: socialImage, width: 1707, height: 909, alt: "Rewrite product decision timeline" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Rewrite — Change one decision",
      description: "See every feature, flow, and record a product decision changes.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
