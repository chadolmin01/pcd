import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { Providers } from '@/src/context/Providers';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: 'PRD Generator - Draft',
  description: 'AI 페르소나와 함께 아이디어를 검증하고 PRD를 생성하세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
