import './globals.css';
import Navbar from '@/components/shared/Navbar';

export const metadata = {
  title: 'Knorvex — Peer Skill Exchange Platform',
  description: 'Learn what you want. Teach what you know. Earn SkillCoins and rank up on Knorvex — the peer-to-peer barter learning community for Indian students and professionals.',
  keywords: 'skill exchange, peer learning, barter, SkillCoins, learn, teach, India',
  openGraph: {
    title: 'Knorvex — Peer Skill Exchange',
    description: 'Learn from peers. Teach your skills. Earn SkillCoins.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
        {/* Always apply dark theme */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('dark');` }} />
      </head>
      <body>
        <Navbar />
        <main className="pt-[72px] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
