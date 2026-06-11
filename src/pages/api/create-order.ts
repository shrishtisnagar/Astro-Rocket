import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const appId = import.meta.env.CASHFREE_APP_ID;
  const secretKey = import.meta.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    return new Response(JSON.stringify({ error: 'Payment not configured' }), { status: 500 });
  }

  const isProd = import.meta.env.PUBLIC_CASHFREE_ENV === 'production';
  const baseUrl = isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

  let body: { name: string; email: string; phone: string; productTitle: string; price: number; slug: string; productUrl?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  const { name, email, phone, productTitle, price, slug, productUrl } = body;
  if (!name || !email || !phone || !price || !slug) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const origin = new URL(request.url).origin;

  try {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: price,
        order_currency: 'INR',
        order_note: productUrl || '',
        order_meta: {
          return_url: `${origin}/order-success?order_id=${orderId}&slug=${slug}`,
        },
        customer_details: {
          customer_id: email.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50),
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Order creation failed' }), { status: 500 });
    }

    return new Response(JSON.stringify({
      paymentSessionId: data.payment_session_id,
      orderId,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Payment service unavailable' }), { status: 500 });
  }
};
