import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GarageBand Arranger',
  description: 'Generate music projects from natural language descriptions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
