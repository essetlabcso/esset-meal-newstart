import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { CSSProperties } from "react";
import { ESSET_BRAND, ESSET_UI } from "@/lib/brand/tokens";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ESSET MEAL — Built for impact, verified by data",
  description: "Connect your Theory of Change to real field data. Built for CSO MEAL leads who need clarity to make decisions, not just reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandVars = {
    "--background": ESSET_BRAND.bg,
    "--foreground": ESSET_BRAND.ink,
    "--esset-teal-900": ESSET_BRAND.teal900,
    "--esset-teal-800": ESSET_BRAND.teal800,
    "--esset-surface": ESSET_BRAND.surface,
    "--esset-ink": ESSET_BRAND.ink,
    "--esset-muted": ESSET_BRAND.muted,
    "--esset-border": ESSET_BRAND.border,
    "--esset-bg": ESSET_BRAND.bg,
    "--esset-cta": ESSET_BRAND.cta,
    "--esset-cta-hover": ESSET_BRAND.ctaHover,
    "--esset-focus": ESSET_BRAND.focusLight,
    "--esset-focus-dark": ESSET_BRAND.focusDark,
    "--esset-container-max": ESSET_UI.containerMax,
    "--esset-form-max": ESSET_UI.formMax,
    "--esset-radius-card": ESSET_UI.cardRadius,
    "--esset-radius-control": ESSET_UI.controlRadius,
  } as CSSProperties;

  return (
    <html lang="en">
      <body
        style={brandVars}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
