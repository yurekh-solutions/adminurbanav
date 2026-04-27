import type { Metadata } from 'next';
import './globals.css';
import Sidebar, { Header } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'AINOS — UrbanAV Admin',
  description: 'AI-powered AV rental marketplace administration panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
