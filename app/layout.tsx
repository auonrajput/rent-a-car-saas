import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar'; // Yeh line add karni hai

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rent-a-Car SaaS Platform',
  description: 'Multi-Tenant Fleet Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
        <div className="flex flex-col min-h-screen">
          <Navbar /> {/* Yeh Navbar yahan render hoga */}
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}