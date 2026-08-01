/**
 * Message Notification Service
 * Sends professional email notification when a new message is received.
 * Uses Resend API (same as existing email service).
 */
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'otp.staffinn@gmail.com';
const PLATFORM_URL = 'https://staffinn.com';

/**
 * Send new message email notification to receiver
 */
async function sendMessageNotification(receiver, sender, messagePreview) {
  if (!receiver.email) return;

  const receiverName = receiver.fullName || receiver.companyName || receiver.instituteName || 'User';
  const senderName = sender.fullName || sender.companyName || sender.instituteName || 'Someone';
  const preview = (messagePreview || '').substring(0, 200);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#4863f7; padding:28px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.3px;">Staffinn</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 20px;">
              <h2 style="margin:0 0 8px; font-size:20px; font-weight:700; color:#1a1a2e; text-align:center;">
                1 new message for you
              </h2>
              <p style="margin:0 0 28px; font-size:15px; color:#64748b; text-align:center; line-height:1.5;">
                Hi ${receiverName},<br>${senderName} sent you a message on Staffinn.
              </p>
              <!-- Message Preview -->
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px 24px; margin-bottom:28px;">
                <p style="margin:0 0 6px; font-size:13px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.4px;">Message</p>
                <p style="margin:0; font-size:15px; color:#1a1a2e; line-height:1.6;">${preview}${preview.length >= 200 ? '...' : ''}</p>
              </div>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${PLATFORM_URL}/messages" style="display:inline-block; background:#4863f7; color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:8px; font-size:15px; font-weight:700; letter-spacing:0.2px;">
                      Go to your Inbox
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px; border-top:1px solid #e2e8f0;">
              <p style="margin:0; font-size:12px; color:#94a3b8; text-align:center; line-height:1.5;">
                You received this email because someone messaged you on Staffinn.<br>
                <a href="${PLATFORM_URL}" style="color:#4863f7; text-decoration:none;">staffinn.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: `Staffinn <noreply@staffinn.com>`,
      to: receiver.email,
      subject: `You've got a new message from ${senderName}`,
      html
    });
    console.log(`📧 Message notification sent to ${receiver.email}`);
  } catch (err) {
    console.error('📧 Message notification email failed:', err.message);
    // Don't throw - email failure should not block message sending
  }
}

module.exports = { sendMessageNotification };
