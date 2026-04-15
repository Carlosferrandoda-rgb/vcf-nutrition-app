import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VCF Nutrición',
  description: 'Panel nutricional para monitorización de jugadores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
