import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BACKEND =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  'http://localhost:9000';

type RegBody = {
  city?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
  shopName?: string;
  sellerType?: 'individual' | 'business';
  idNumber?: string;
  companyName?: string;
  regNumber?: string;
  payoutMethod?: 'momo' | 'om' | 'bank';
  payoutName?: string;
  payoutAccount?: string;
  bankName?: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const METHOD_LABEL = {
  momo: 'MTN Mobile Money',
  om: 'Orange Money',
  bank: 'Bank transfer',
} as const;

export async function POST(request: NextRequest) {
  let reg: RegBody;
  try {
    reg = (await request.json()) as RegBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    !reg.email ||
    !/^\S+@\S+\.\S+$/.test(reg.email) ||
    !reg.password ||
    reg.password.length < 8 ||
    !reg.firstName?.trim() ||
    !reg.lastName?.trim() ||
    !reg.shopName?.trim() ||
    !reg.payoutMethod ||
    !METHOD_LABEL[reg.payoutMethod]
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid registration details.' },
      { status: 400 }
    );
  }

  // 1. create the auth identity (email + password) - "member" is the actor
  // type that /vendor/* routes authenticate
  const authRes = await fetch(`${BACKEND}/auth/member/emailpass/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: reg.email, password: reg.password }),
  });
  if (!authRes.ok) {
    const j = await authRes.json().catch(() => ({}));
    const msg: string = (j as { message?: string }).message || '';
    const exists =
      authRes.status === 400 || msg.toLowerCase().includes('already exists');
    return NextResponse.json(
      {
        error: exists
          ? 'An account with this email already exists. Try signing in instead.'
          : msg || 'Could not create your account.',
      },
      { status: exists ? 409 : authRes.status }
    );
  }
  const { token } = (await authRes.json()) as { token: string };

  // 2. create the seller + member (unauthenticated route allowed for registration)
  const fullPhone = reg.phone ? `+237${reg.phone}` : undefined;
  const sellerRes = await fetch(`${BACKEND}/vendor/sellers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: reg.shopName,
      handle: slugify(reg.shopName),
      email: reg.email,
      phone: fullPhone,
      member_email: reg.email,
      first_name: reg.firstName,
      last_name: reg.lastName,
      currency_code: 'xaf',
      address: {
        first_name: reg.firstName,
        last_name: reg.lastName,
        city: reg.city,
        country_code: 'cm',
        phone: fullPhone,
      },
      ...(reg.sellerType === 'business'
        ? {
            professional_details: {
              corporate_name: reg.companyName,
              registration_number: reg.regNumber,
            },
          }
        : {}),
      payment_details: {
        country_code: 'cm',
        holder_name: reg.payoutName,
        bank_name: reg.bankName || METHOD_LABEL[reg.payoutMethod],
        account_number: reg.payoutAccount,
      },
      metadata: {
        seller_type: reg.sellerType,
        id_number: reg.idNumber,
        city: reg.city,
        whatsapp: fullPhone,
      },
    }),
  });
  if (!sellerRes.ok) {
    const j = await sellerRes.json().catch(() => ({}));
    return NextResponse.json(
      {
        error:
          (j as { message?: string }).message ||
          'Your account was created but shop setup failed. Sign in and finish setup from your dashboard.',
      },
      { status: sellerRes.status }
    );
  }

  const result = await sellerRes.json();
  return NextResponse.json(result, { status: 201 });
}
