/**
 * Email Service — Resend
 *
 * Sends transactional emails via the Resend API.
 * No Supabase email. No magic links.
 */

import { logger } from '@/lib/logger';

// ============================================================================
// CONFIG
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = process.env.VERIFICATION_EMAIL_FROM ?? 'security@yourdomain.com';
const FROM_NAME = process.env.VERIFICATION_EMAIL_NAME ?? 'Syllabus Sync';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Check if Resend is configured.
 */
export function isEmailServiceConfigured(): boolean {
  return RESEND_API_KEY.length > 0 && RESEND_API_KEY !== 'your-resend-api-key-here';
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function verificationEmailHtml(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:#a6192e;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Syllabus Sync</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;font-weight:600;">Verify your email address</h2>
          <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
            Click the button below to verify your email address. This link expires in <strong>20 minutes</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-block;padding:12px 32px;background:#a6192e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                Verify Email
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.5;">
            If you didn't request this, you can safely ignore this email.<br>
            Do not share this link with anyone.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
          <p style="margin:0;color:#a1a1aa;font-size:11px;">
            &copy; ${new Date().getFullYear()} Syllabus Sync &mdash; Macquarie University
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// SEND FUNCTION
// ============================================================================

interface SendVerificationEmailParams {
  to: string;
  token: string;
}

/**
 * Send a verification email via Resend.
 *
 * SECURITY: The raw token is included in the URL sent to the user.
 * It is NOT logged anywhere.
 */
export async function sendVerificationEmail({
  to,
  token,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!isEmailServiceConfigured()) {
    logger.warn('Email service not configured — skipping verification email');
    return { success: false, error: 'Email service not configured' };
  }

  const verifyUrl = `${APP_URL}/verify?token=${token}`;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_ADDRESS}>`,
        to: [to],
        subject: 'Verify your email — Syllabus Sync',
        html: verificationEmailHtml(verifyUrl),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error('Resend API error', { status: res.status, body });
      return { success: false, error: 'Failed to send email' };
    }

    // SECURITY: Do NOT log the token or verifyUrl
    logger.info('Verification email sent', { to });
    return { success: true };
  } catch (error) {
    logger.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
