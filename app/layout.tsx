import './globals.css';
import { Inter, Playfair_Display, Secular_One } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const secularOne = Secular_One({ weight: '400', subsets: ['latin'], variable: '--font-secular-one' });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pass the server session to the client-side SessionProvider so there's no
  // flicker on first load.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${secularOne.variable}`}>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
