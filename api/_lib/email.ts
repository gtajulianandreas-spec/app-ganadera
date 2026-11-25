import { getResendConfig, isProduction } from './env.js';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendTransactionalEmail(payload: EmailPayload): Promise<{ sent: boolean }> {
  const { apiKey, from } = getResendConfig();

  if (!apiKey) {
    if (!isProduction()) {
      console.info(`[DEV EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
    } else {
      console.warn('[PROD EMAIL] RESEND_API_KEY not configured; email delivery skipped.');
    }
    return { sent: false };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      console.error(`[EMAIL ERROR] Provider returned status ${response.status}`);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error('[EMAIL NETWORK ERROR]', err);
    return { sent: false };
  }
}
