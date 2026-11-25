import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Strategy Studio",
  description: "A secure workspace for brand strategy agencies.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
