import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const orderId = new URL(request.url).searchParams.get('order_id');
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'Missing order_id' }), { status: 400 });
  }

  const appId = import.meta.env.CASHFREE_APP_ID;
  const secretKey = import.meta.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    return new Response(JSON.stringify({ error: 'Payment not configured' }), { status: 500 });
  }

  const isProd = import.meta.env.PUBLIC_CASHFREE_ENV === 'production';
  const baseUrl = isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

  try {
    const res = await fetch(`${baseUrl}/orders/${orderId}`, {
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
    });
    const data = await res.json();

    return new Response(JSON.stringify({
      paid: data.order_status === 'PAID',
      status: data.order_status,
      productUrl: data.order_note || '',
      productTitle: data.order_tags?.productTitle || '',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch {
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 500 });
  }
};
