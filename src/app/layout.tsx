import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://webomok.com'),
  title: '웹오목 (WebOmok) - 설치 없는 무료 2인용 온라인 오목 & 똑똑한 AI 대국',
  description:
    '설치와 가입 없이 웹 브라우저에서 바로 즐기는 무료 온라인 오목 게임. 국제 공인 렌주룰(3-3/4-4/장목 금수 감지) 및 일반룰, 3단계 인공지능(AI) 대전, 친구 초대 링크 실시간 대국을 지원합니다. 학교와 직장에서도 차단 없이 즐기세요.',
  keywords: [
    '오목',
    '온라인 오목',
    '웹오목',
    '무료 오목',
    '2인용 오목',
    '오목 AI',
    '렌주룰',
    '오목 삼삼',
    '오목 게임',
    '무설치 오목',
    'Gomoku',
    'Renju',
  ],
  authors: [{ name: 'WebOmok Team' }],
  creator: 'WebOmok',
  publisher: 'WebOmok',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://webomok.com',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://webomok.com',
    siteName: 'WebOmok (웹오목)',
    title: '웹오목 (WebOmok) - 설치 없는 무료 2인용 온라인 오목 & AI 대국',
    description:
      '설치와 가입 없이 브라우저에서 바로 즐기는 무료 온라인 오목. 국제 공인 렌주룰, 똑똑한 AI, 친구 초대 2인 대전 완벽 지원.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '웹오목 - 온라인 2인용 오목 게임',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '웹오목 (WebOmok) - 무설치 무료 2인용 온라인 오목',
    description: '설치 없는 무료 온라인 오목. 똑똑한 AI 대국과 실시간 2인 대전.',
    images: ['/og-image.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://webomok.com/#webapp',
      url: 'https://webomok.com',
      name: '웹오목 (WebOmok)',
      applicationCategory: 'GameApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      description:
        '설치나 회원가입 없이 브라우저에서 바로 즐기는 무료 2인용 온라인 오목 게임. 국제 공인 렌주룰(3-3, 4-4, 장목 금수 판정) 및 자유룰, 똑똑한 인공지능(AI) 대전, 친구 초대 대국을 지원합니다.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
      },
      inLanguage: 'ko-KR',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://webomok.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: '렌주룰에서 흑돌의 3-3(삼삼)과 4-4(사사) 금수는 무엇인가요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "렌주룰은 선공인 흑돌의 일방적 승리를 방지하기 위해 흑돌에게 착수 제약을 둡니다. 흑돌이 한 수로 두 개의 '열린 3'을 동시에 만드는 3-3, 두 개의 4를 동시에 만드는 4-4, 그리고 6개 이상을 연결하는 장목(Overline)은 모두 금수(착수 불가 반칙)입니다. 반면 후공인 백돌은 아무런 착수 제약이 없으며 장목도 승리로 인정됩니다.",
          },
        },
        {
          '@type': 'Question',
          name: '학교나 직장 공용 PC에서도 설치나 로그인 없이 플레이할 수 있나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '네. 웹오목(WebOmok)은 실행 파일(.exe) 다운로드나 액티브X 설치, 회원가입이 전혀 필요 없는 순수 100% 웹 브라우저 기반 게임입니다. 크롬, 사파리, 엣지, 웨일 등 모던 브라우저만 있으면 학교나 회사 방화벽 환경에서도 쾌적하게 즐길 수 있습니다.',
          },
        },
        {
          '@type': 'Question',
          name: '친구와 온라인으로 멀티플레이 대전을 하려면 어떻게 하나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "게임 상단의 '친구 초대 링크' 버튼을 클릭하면 고유한 대국 초대 링크가 생성됩니다. 이 링크를 카카오톡, 디스코드, 문자 등으로 친구에게 전달하면 친구가 접속하여 즉시 실시간 오목 대결을 펼칠 수 있습니다. 또한 한 기기에서 번갈아 두는 '1기기 2인 대전(Pass & Play)'도 지원합니다.",
          },
        },
        {
          '@type': 'Question',
          name: '모바일 스마트폰에서도 정상 작동하나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '아이폰(iOS) 사파리, 안드로이드 크롬, 네이버 앱 등 모든 모바일 기기의 브라우저를 완벽하게 지원합니다. 반응형 캔버스를 통해 화면 크기에 맞게 자동으로 바둑판이 조절되며 정밀 터치 조작이 가능합니다.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
