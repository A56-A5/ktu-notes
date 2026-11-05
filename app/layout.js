import './globals.css';
import { Caveat, Patrick_Hand, Source_Serif_4, Space_Mono } from 'next/font/google';
import { StoreProvider } from '../lib/store';
import { UIProvider } from '../components/ui';

const hand = Caveat({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-hand', display: 'swap' });
const label = Patrick_Hand({ subsets: ['latin'], weight: '400', variable: '--font-label', display: 'swap' });
const serif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-serif', display: 'swap' });
const mono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'KTU Notes',
  description:
    'A personal, scrapbook-style academic notebook for KTU B.Tech CSE 2024 Scheme Semester 5: recursive modules, rich notes, images and portable backups.',
};

export const viewport = {
  themeColor: '#f3ead7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${hand.variable} ${label.variable} ${serif.variable} ${mono.variable}`}>
      <body className="grain">
        <UIProvider><StoreProvider>{children}</StoreProvider></UIProvider>
      </body>
    </html>
  );
}