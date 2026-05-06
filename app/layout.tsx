// app/layout.tsx
import './globals.css';
import { Inter, Playfair_Display, Secular_One } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const secularOne = Secular_One({ weight: '400', subsets: ['latin'], variable: '--font-secular-one' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${secularOne.variable}`}>{children}</body>
    </html>
  );
}