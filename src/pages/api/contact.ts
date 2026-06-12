export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import siteConfig from '@/config/site.config';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.email('Please enter a valid email address'),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  honeypot: z.string().max(0), // Anti-spam: must be empty
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const data = {
      name: formData.get('name')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      subject: formData.get('subject')?.toString() || '',
      message: formData.get('message')?.toString() || '',
      honeypot: formData.get('honeypot')?.toString() || '',
    };

    // Validate
    const result = contactSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const error of result.error.issues) {
        const field = error.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(error.message);
      }

      return new Response(
        JSON.stringify({ success: false, errors: fieldErrors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Honeypot check (bot detection)
    if (result.data.honeypot) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send email via Resend REST API
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ success: false, errors: { form: ['Email service is not configured'] } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const toEmail = siteConfig.email;
    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || toEmail;
    const siteLabel = siteConfig.name;

    const subject = result.data.subject
      ? `[${siteLabel}] ${result.data.subject}`
      : `[${siteLabel}] New contact from ${result.data.name}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Contact Form <${fromEmail}>`,
        to: [toEmail],
        reply_to: result.data.email,
        subject,
        html: `
          <p><strong>Name:</strong> ${result.data.name}</p>
          <p><strong>Email:</strong> ${result.data.email}</p>
          <p><strong>Message:</strong></p>
          <p>${result.data.message.replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})) as { message?: string };
      console.error('Resend error:', errorData);
      return new Response(
        JSON.stringify({ success: false, errors: { form: [errorData.message || 'Failed to send email'] } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Contact form error:', error);

    return new Response(
      JSON.stringify({ success: false, errors: { form: ['An unexpected error occurred'] } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
