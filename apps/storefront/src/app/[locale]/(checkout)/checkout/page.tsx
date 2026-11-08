import { Suspense } from 'react';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { retrieveCart } from '@/lib/data/cart';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { listCartShippingMethods } from '@/lib/data/fulfillment';
import { listCartPaymentMethods } from '@/lib/data/payment';
import { CheckoutSignupGate } from '@/components/organisms/GuestSignup/CheckoutSignupGate'
import { MobileCheckoutClient } from './MobileCheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Checkout',
  robots: { index: false, follow: false }
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const region = await getRegion(locale);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center text-[#6B6B76]">
          Loading checkout…
        </div>
      }
    >
      <CheckoutPageContent locale={locale} regionId={region?.id} currencyCode={region?.currency_code?.toUpperCase() || 'XAF'} />
    </Suspense>
  );
}

async function CheckoutPageContent({
  locale,
  regionId,
  currencyCode,
}: {
  locale: string;
  regionId?: string;
  currencyCode: string;
}) {
  const cart = await retrieveCart();

  if (!cart || !(cart.items?.length ?? 0)) {
    redirect(`/${locale}/cart`);
  }

  const [shippingMethods, paymentMethods, customer] = await Promise.all([
    listCartShippingMethods(cart.id, false).catch(() => null),
    listCartPaymentMethods(cart.region?.id ?? regionId ?? '').catch(() => null),
    retrieveCustomer().catch(() => null),
  ]);

  if (!customer) {
    return <CheckoutSignupGate locale={locale} />
  }

  return (
    <MobileCheckoutClient
      cart={cart as any}
      customer={customer as any}
      shippingMethods={shippingMethods}
      paymentMethods={paymentMethods}
      currencyCode={currencyCode}
      locale={locale}
    />
  );
}
