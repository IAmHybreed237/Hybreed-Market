import { redirect } from 'next/navigation';

import { Footer, Header } from '@/components/organisms';
import { ConditionalFooter } from '@/components/cells/ConditionalFooter/ConditionalFooter';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { TopUpSheetProvider } from '@/components/cells/TopUpSheet/TopUpSheet';
import { TalkJsProvider } from '@/components/providers';
import { retrieveCustomer } from '@/lib/data/customer';
import { checkRegion } from '@/lib/helpers/check-region';

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID;
  const { locale } = await params;

  const user = await retrieveCustomer();
  const regionCheck = await checkRegion(locale);

  if (!regionCheck) {
    return redirect('/');
  }

  if (!APP_ID || !user || !user.id || !user.email)
    return (
      <>
        <Header locale={locale} />
        <TopUpSheetProvider>{children}</TopUpSheetProvider>
        <ConditionalFooter><Footer /></ConditionalFooter>
        <a
          href="https://wa.me/"
          aria-label="Chat with us"
          className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg hover:bg-[#1D4ED8] transition-colors"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
          </svg>
        </a>
        <MobileBottomNav />
        <div aria-hidden className="h-[76px] md:hidden" />
      </>
    );

  const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <TalkJsProvider
      appId={APP_ID}
      userId={user.id}
      userName={userName}
      userEmail={user.email}
    >
      <Header locale={locale} />
      <TopUpSheetProvider>{children}</TopUpSheetProvider>
      <ConditionalFooter><Footer /></ConditionalFooter>
      <a
        href="https://wa.me/"
        aria-label="Chat with us"
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg hover:bg-[#1D4ED8] transition-colors"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>
      </a>
      <MobileBottomNav />
      <div aria-hidden className="h-[76px] md:hidden" />
    </TalkJsProvider>
  );
}
