import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, planName } = body;

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // Agar Stripe key nahi hai ya placeholder hai, toh Mock Mode chala do (Bina error ke test karne ke liye)
    if (!stripeKey || stripeKey.includes('sk_test_...')) {
      const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?success=true`;
      return NextResponse.json({ url: successUrl });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-02-28.acacia' as any,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name: `${planName} Subscription`,
            },
            unit_amount: 5000 * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?canceled=true`,
      metadata: {
        tenantId: tenantId || '',
        planName: planName || 'Pro',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}