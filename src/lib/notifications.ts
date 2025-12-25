import { Resend } from 'resend';
import Twilio from 'twilio';
import { prisma } from './prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_NOTIFICATIONS_PER_HOUR = 5;

interface NotificationPayload {
  userId: string;
  bookTitle: string;
  bookAuthor: string | null;
  friendName: string;
  eventUrl: string | null;
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentCount = await prisma.notificationLog.count({
    where: {
      userId,
      sentAt: {
        gte: oneHourAgo,
      },
    },
  });

  return recentCount < MAX_NOTIFICATIONS_PER_HOUR;
}

async function logNotification(userId: string, type: 'email' | 'sms', subject: string | null, body: string) {
  await prisma.notificationLog.create({
    data: {
      userId,
      type,
      subject,
      body,
    },
  });
}

export async function sendEmailNotification(payload: NotificationPayload, userEmail: string): Promise<boolean> {
  if (!resend) {
    console.log('Resend not configured, skipping email notification');
    return false;
  }

  const withinLimit = await checkRateLimit(payload.userId);
  if (!withinLimit) {
    console.log(`Rate limit exceeded for user ${payload.userId}, skipping email`);
    return false;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const authorText = payload.bookAuthor ? ` by ${payload.bookAuthor}` : '';

  const subject = `${payload.friendName} loved "${payload.bookTitle}"!`;
  const body = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #382110; font-size: 24px; margin-bottom: 16px;">
        📚 New 5-Star Book Alert
      </h1>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Your friend <strong>${payload.friendName}</strong> just gave 5 stars to:
      </p>
      <div style="background: #f5f0e6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h2 style="color: #382110; margin: 0 0 8px 0; font-size: 20px;">
          ${payload.bookTitle}
        </h2>
        ${payload.bookAuthor ? `<p style="color: #666; margin: 0;">by ${payload.bookAuthor}</p>` : ''}
      </div>
      <p style="margin-top: 24px;">
        <a href="${appUrl}/feed" style="background: #382110; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View in GreatReads
        </a>
      </p>
      ${payload.eventUrl ? `<p style="margin-top: 16px; font-size: 14px; color: #666;"><a href="${payload.eventUrl}" style="color: #382110;">View on Goodreads →</a></p>` : ''}
      <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;" />
      <p style="font-size: 12px; color: #999;">
        You received this because you have email notifications enabled in GreatReads.
        <br /><a href="${appUrl}/settings" style="color: #666;">Manage notification settings</a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'GreatReads <noreply@greatreads.app>',
      to: userEmail,
      subject,
      html: body,
    });

    await logNotification(payload.userId, 'email', subject, body);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendSMSNotification(payload: NotificationPayload, userPhone: string): Promise<boolean> {
  if (!twilioClient) {
    console.log('Twilio not configured, skipping SMS notification');
    return false;
  }

  const withinLimit = await checkRateLimit(payload.userId);
  if (!withinLimit) {
    console.log(`Rate limit exceeded for user ${payload.userId}, skipping SMS`);
    return false;
  }

  const authorText = payload.bookAuthor ? ` by ${payload.bookAuthor}` : '';
  const body = `📚 ${payload.friendName} gave 5 stars to "${payload.bookTitle}"${authorText}. Check it out on GreatReads!`;

  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userPhone,
    });

    await logNotification(payload.userId, 'sms', null, body);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

export async function sendTopTenRequestEmail(
  toEmail: string,
  toName: string | null,
  fromUserName: string,
  message: string | null,
  token: string
): Promise<boolean> {
  if (!resend) {
    console.log('Resend not configured, skipping email');
    return false;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const requestUrl = `${appUrl}/request/${token}`;

  const subject = `${fromUserName} wants to know your Top 10 favorite books!`;
  const body = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #382110; font-size: 24px; margin-bottom: 16px;">
        📚 Top 10 Books Request
      </h1>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        ${toName ? `Hi ${toName},` : 'Hi there,'}
      </p>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        <strong>${fromUserName}</strong> would love to know your Top 10 favorite books of all time!
      </p>
      ${message ? `
        <div style="background: #f5f0e6; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #382110;">
          <p style="color: #333; margin: 0; font-style: italic;">"${message}"</p>
          <p style="color: #666; margin: 8px 0 0; font-size: 14px;">— ${fromUserName}</p>
        </div>
      ` : ''}
      <p style="margin-top: 24px;">
        <a href="${requestUrl}" style="background: #382110; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Share Your Top 10
        </a>
      </p>
      <p style="margin-top: 16px; font-size: 14px; color: #666;">
        No account required – just click the button to share your favorite reads.
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;" />
      <p style="font-size: 12px; color: #999;">
        This request was sent via GreatReads.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'GreatReads <noreply@greatreads.app>',
      to: toEmail,
      subject,
      html: body,
    });
    return true;
  } catch (error) {
    console.error('Failed to send Top 10 request email:', error);
    return false;
  }
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<boolean> {
  if (!resend) {
    console.log('Resend not configured, skipping magic link email');
    return false;
  }

  const subject = 'Sign in to GreatReads';
  const body = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #382110; font-size: 24px; margin-bottom: 16px;">
        📚 Sign in to GreatReads
      </h1>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Click the button below to sign in to your GreatReads account.
      </p>
      <p style="margin-top: 24px;">
        <a href="${url}" style="background: #382110; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Sign in to GreatReads
        </a>
      </p>
      <p style="margin-top: 24px; font-size: 14px; color: #666;">
        If you didn't request this email, you can safely ignore it.
      </p>
      <p style="margin-top: 8px; font-size: 12px; color: #999;">
        This link will expire in 24 hours.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'GreatReads <noreply@greatreads.app>',
      to: email,
      subject,
      html: body,
    });
    return true;
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    return false;
  }
}
