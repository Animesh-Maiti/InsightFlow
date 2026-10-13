import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InsightFlow | Customer Feedback Intelligence',
  description: 'Turn customer feedback into prioritized product decisions with InsightFlow.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}