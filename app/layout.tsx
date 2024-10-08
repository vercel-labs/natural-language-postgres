import "./globals.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

export const metadata = {
  metadataBase: new URL("https://postgres-starter.vercel.app"),
  title: "Vercel Postgres Demo",
  description: "A simple Next.js app with Vercel Postgres as the database",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${GeistMono.className} ${GeistSans.className}`}>
        {children}
      </body>
    </html>
  );
}
