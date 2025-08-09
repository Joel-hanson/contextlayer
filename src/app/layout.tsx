import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContextLayer",
  description: "Transform any REST API into AI-accessible tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className='font-mono antialiased'
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
