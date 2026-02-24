/**
 * Email Service — Resend
 *
 * Sends transactional emails via Resend (API).
 *
 * Security notes:
 * - Never log raw verification tokens or full recipient addresses.
 * - Do not treat email delivery as “best effort” in production for critical flows.
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

// ============================================================================
// CONFIG
// ============================================================================

type EmailServiceConfig = {
  resendApiKey: string;
  fromAddress: string;
  fromName: string;
  appUrl: string;
};

function isPlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v.length === 0 ||
    v.includes('your-') ||
    v.includes('paste') ||
    v.includes('example.com') ||
    v === 'your-resend-api-key-here'
  );
}

function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit && !isPlaceholder(explicit)) return explicit.replace(/\/+$/, '');

  // Vercel provides deployment URLs without protocol.
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl && !isPlaceholder(vercelUrl)) return `https://${vercelUrl.replace(/\/+$/, '')}`;

  return 'http://localhost:3000';
}

function getEmailConfig(): EmailServiceConfig {
  const resendApiKey = (process.env.RESEND_API_KEY ?? '').trim();
  const fromAddress = (process.env.VERIFICATION_EMAIL_FROM ?? 'onboarding@resend.dev').trim();
  const fromName = (process.env.VERIFICATION_EMAIL_NAME ?? 'Syllabus Sync').trim();

  return {
    resendApiKey,
    fromAddress,
    fromName,
    appUrl: getAppUrl(),
  };
}

function isValidEmailAddress(value: string): boolean {
  // Deliberately simple and strict enough for our purposes.
  // We still rely on provider-side validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function maskEmailForLogs(email: string): string {
  const [localPart, domain] = email.toLowerCase().split('@');
  if (!localPart || !domain) return 'invalid-email';
  if (localPart.length <= 2) return `${localPart[0] ?? '*'}***@${domain}`;
  return `${localPart.slice(0, 2)}***@${domain}`;
}

let cachedClient: Resend | null = null;
let cachedKey = '';

function getResendClient(apiKey: string): Resend {
  if (!cachedClient || cachedKey !== apiKey) {
    cachedKey = apiKey;
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

/**
 * Check if Resend is configured well enough to send email.
 */
export function isEmailServiceConfigured(): boolean {
  const cfg = getEmailConfig();
  if (cfg.resendApiKey.length === 0 || isPlaceholder(cfg.resendApiKey)) return false;
  if (!isValidEmailAddress(cfg.fromAddress) || isPlaceholder(cfg.fromAddress)) return false;
  if (cfg.fromName.trim().length === 0) return false;
  if (cfg.appUrl.trim().length === 0) return false;
  return true;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function genericEmailHtml(content: string, subject: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#a6192e;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Syllabus Sync</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;font-weight:600;">${subject}</h2>
          <div style="margin:0;color:#52525b;font-size:14px;line-height:1.6;white-space:pre-wrap;">${content}</div>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
          <p style="margin:0;color:#a1a1aa;font-size:11px;">
            &copy; ${new Date().getFullYear()} Syllabus Sync
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function verificationEmailHtml(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#a6192e;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Syllabus Sync</h1>
        </td></tr>
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
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
          <p style="margin:0;color:#a1a1aa;font-size:11px;">
            &copy; ${new Date().getFullYear()} Syllabus Sync
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function passwordResetEmailHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#a6192e;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Syllabus Sync</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;font-weight:600;">Reset your password</h2>
          <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
            Click the button below to set a new password. This link expires in <strong>20 minutes</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${resetUrl}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-block;padding:12px 32px;background:#a6192e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                Reset Password
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.5;">
            If you didn't request this, you can safely ignore this email.<br>
            Do not share this link with anyone.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
          <p style="margin:0;color:#a1a1aa;font-size:11px;">
            &copy; ${new Date().getFullYear()} Syllabus Sync
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// SEND FUNCTIONS
// ============================================================================

type SendEmailParams = {
  to: string;
  subject: string;
  content: string;
};

type SendVerificationEmailParams = {
  to: string;
  token: string;
};

type SendPasswordResetEmailParams = {
  to: string;
  token: string;
};

/**
 * Send a generic email via Resend.
 */
export async function sendEmail({
  to,
  subject,
  content,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const cfg = getEmailConfig();

  if (!isEmailServiceConfigured()) {
    logger.warn('Email service not configured — skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  if (!isValidEmailAddress(to)) {
    logger.warn('Invalid email recipient — skipping email', {
      recipient_hint: maskEmailForLogs(to),
    });
    return { success: false, error: 'Invalid email recipient' };
  }

  try {
    const resend = getResendClient(cfg.resendApiKey);
    const { error } = await resend.emails.send({
      from: `${cfg.fromName} <${cfg.fromAddress}>`,
      to: [to],
      subject,
      html: genericEmailHtml(content, subject),
      text: content,
    });

    if (error) {
      logger.error('Resend send failed', { message: error.message });
      return { success: false, error: 'Failed to send email' };
    }

    logger.info('Email sent', {
      recipient_hint: maskEmailForLogs(to),
      subject,
    });
    return { success: true };
  } catch (error) {
    logger.error('Email send error', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send a verification email via Resend.
 *
 * SECURITY: The raw token is included in the URL sent to the user.
 * It must never be logged.
 */
export async function sendVerificationEmail({
  to,
  token,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }> {
  const cfg = getEmailConfig();

  if (!isEmailServiceConfigured()) {
    logger.warn('Email service not configured — skipping verification email');
    return { success: false, error: 'Email service not configured' };
  }

  if (!isValidEmailAddress(to)) {
    logger.warn('Invalid email recipient — skipping verification email', {
      recipient_hint: maskEmailForLogs(to),
    });
    return { success: false, error: 'Invalid email recipient' };
  }

  const verifyUrl = `${cfg.appUrl}/verify?token=${token}`;

  try {
    const resend = getResendClient(cfg.resendApiKey);
    const { error } = await resend.emails.send({
      from: `${cfg.fromName} <${cfg.fromAddress}>`,
      to: [to],
      subject: 'Verify your email — Syllabus Sync',
      html: verificationEmailHtml(verifyUrl),
      text: `Verify your email address: ${verifyUrl}\n\nThis link expires in 20 minutes.`,
    });

    if (error) {
      logger.error('Resend verification send failed', {
        message: error.message,
      });
      return { success: false, error: 'Failed to send verification email' };
    }

    logger.info('Verification email sent', {
      recipient_hint: maskEmailForLogs(to),
    });
    return { success: true };
  } catch (error) {
    logger.error('Verification email send error', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

/**
 * Send a password reset email via Resend.
 *
 * SECURITY: The raw token is included in the URL sent to the user.
 * It must never be logged.
 */
export async function sendPasswordResetEmail({ to, token }: SendPasswordResetEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const cfg = getEmailConfig();

  if (!isEmailServiceConfigured()) {
    logger.warn('Email service not configured — skipping password reset email');
    return { success: false, error: 'Email service not configured' };
  }

  if (!isValidEmailAddress(to)) {
    logger.warn('Invalid email recipient — skipping password reset email', {
      recipient_hint: maskEmailForLogs(to),
    });
    return { success: false, error: 'Invalid email recipient' };
  }

  const resetUrl = `${cfg.appUrl}/reset-password?token=${token}`;

  try {
    const resend = getResendClient(cfg.resendApiKey);
    const { error } = await resend.emails.send({
      from: `${cfg.fromName} <${cfg.fromAddress}>`,
      to: [to],
      subject: 'Reset your password — Syllabus Sync',
      html: passwordResetEmailHtml(resetUrl),
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 20 minutes.`,
    });

    if (error) {
      logger.error('Resend password reset send failed', {
        message: error.message,
      });
      return { success: false, error: 'Failed to send password reset email' };
    }

    logger.info('Password reset email sent', {
      recipient_hint: maskEmailForLogs(to),
    });
    return { success: true };
  } catch (error) {
    logger.error('Password reset email send error', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
}
