import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';

import './globals.css';

const displayFont = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const monoFont = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Word Rung',
  description:
    'Word Rung is a daily three-ladder word puzzle. Build valid one-letter bridges, score near par, and climb the leaderboard.',
};

const themeInitScript = `(() => {
  try {
    const storedTheme = window.localStorage.getItem('word-rung-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      document.documentElement.dataset.theme = storedTheme;
    }
  } catch {
    // Ignore storage errors in privacy-restricted browsers.
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${monoFont.variable} bg-[--app-bg] text-[--app-fg] antialiased`}>
        <Script id="word-rung-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
