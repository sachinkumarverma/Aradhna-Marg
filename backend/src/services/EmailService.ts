import nodemailer, { Transporter } from 'nodemailer';
import axios from 'axios';
import { config } from '@/config';
import { logger } from '@utils/logger';

export interface ContactSubmissionPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category?: string;
  message: string;
}

export interface DonationReceiptPayload {
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  amount: number;
  paymentId: string;
  orderId: string;
  date?: Date;
  note?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      if (config.SMTP_USER && config.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: config.SMTP_HOST || 'smtp-relay.brevo.com',
          port: parseInt(config.SMTP_PORT || '587', 10),
          secure: parseInt(config.SMTP_PORT || '587', 10) === 465,
          auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        logger.info('📧 Nodemailer Brevo SMTP Transporter initialized successfully');
      } else {
        logger.warn('⚠️ SMTP credentials missing; email service will attempt Brevo API fallback.');
      }
    } catch (err: any) {
      logger.error('Failed to initialize nodemailer transporter:', err.message);
    }
  }

  /**
   * Generic Send Email Method (with automatic Brevo API fallback)
   */
  public async sendMail(options: {
    to: string;
    toName?: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    fromEmail?: string;
    fromName?: string;
  }): Promise<boolean> {
    // 0. Suppress live emails during test runs or when NODE_ENV === 'test'
    if (process.env.NODE_ENV === 'test') {
      logger.info(`🧪 [TEST MODE] Suppressed live email to: ${options.to} | Subject: "${options.subject}"`);
      return true;
    }

    const fromAddress = options.fromEmail || config.EMAIL_FROM_ADDRESS || 'support@aradhnamarg.com';
    const fromName = options.fromName || 'Aradhna Marg';
    const fromSender = {
      name: fromName,
      email: fromAddress
    };

    // 1. Try Nodemailer SMTP first
    if (this.transporter && config.SMTP_USER && config.SMTP_PASS) {
      try {
        await this.transporter.sendMail({
          from: `"${fromSender.name}" <${fromSender.email}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
          replyTo: options.replyTo || fromAddress
        });
        logger.info(`✅ Email successfully sent via SMTP to: ${options.to} from: ${fromAddress}`);
        return true;
      } catch (smtpError: any) {
        logger.warn(`⚠️ SMTP send failed (${smtpError.message}). Attempting Brevo REST API fallback...`);
      }
    }

    // 2. Fallback to Brevo Transactional REST API
    if (config.BREVO_API_KEY) {
      try {
        const payload = {
          sender: fromSender,
          to: [
            {
              email: options.to,
              name: options.toName || options.to
            }
          ],
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text || options.html.replace(/<[^>]*>?/gm, ''),
          replyTo: options.replyTo ? { email: options.replyTo } : fromSender
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
          headers: {
            'api-key': config.BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          timeout: 15000
        });

        logger.info(
          `✅ Email successfully sent via Brevo API to: ${options.to} (MessageId: ${response.data?.messageId})`
        );
        return true;
      } catch (apiError: any) {
        logger.error('❌ Brevo API Email Sending Error:', apiError?.response?.data || apiError.message);
      }
    }

    logger.error(`❌ Unable to send email to ${options.to}. Check SMTP or Brevo API settings.`);
    return false;
  }

  /**
   * 1. Send Contact / Suggestion Notification to Admin
   */
  public async sendContactNotificationToAdmin(data: ContactSubmissionPayload): Promise<boolean> {
    const adminEmail = config.ADMIN_EMAIL || config.EMAIL_SUPPORT_ADDRESS || 'support@aradhnamarg.com';
    const subject = `[Aradhna Marg] New Message from ${data.name} (${data.category || data.subject || 'General Inquiry'})`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Message - Aradhna Marg</title>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #f9f7f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #fed7aa; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1C0F08 0%, #3D1E0B 100%); background-color: #1C0F08; padding: 26px 20px;">
              <div style="font-size: 28px; color: #FF9933; margin-bottom: 4px; font-weight: bold;">ॐ</div>
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 1px; font-weight: 800;">ARADHNA MARG</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">New Contact Inquiry & Suggestion Received</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 24px;">
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; background-color: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold;">
                  📌 ${data.category || data.subject || 'General Inquiry'}
                </span>
              </div>

              <!-- Details Table -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fbfbfb; border: 1px solid #f1f5f9; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; width: 35%;">Sender Name</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600; width: 65%;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Email Address</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600;">
                    <a href="mailto:${data.email}" style="color: #ea580c; text-decoration: none;">${data.email}</a>
                  </td>
                </tr>
                ${
                  data.phone
                    ? `
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Phone Number</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600;">${data.phone}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 12px 16px; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Subject</td>
                  <td style="padding: 12px 16px; color: #0f172a; font-size: 14px; font-weight: 600;">${data.subject || 'General Suggestion'}</td>
                </tr>
              </table>

              <!-- Message Box -->
              <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 8px;">
                Message Content:
              </div>
              <div style="background-color: #fffaf5; border-left: 4px solid #FF9933; border: 1px solid #fed7aa; border-left-width: 4px; padding: 16px 18px; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #334155;">
                ${data.message.replace(/\n/g, '<br/>')}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #0e0703; color: #94a3b8; padding: 18px; font-size: 12px;">
              This inquiry was submitted automatically via the Contact form on <strong style="color: #fde68a;">aradhnamarg.com</strong>.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: adminEmail,
      subject,
      html,
      replyTo: data.email,
      fromEmail: config.EMAIL_NOREPLY_ADDRESS || 'noreply@aradhnamarg.com',
      fromName: 'Aradhna Marg Contact Form'
    });
  }

  /**
   * 2. Send Acknowledgment & Thank You to the User
   */
  public async sendContactAcknowledgmentToUser(data: ContactSubmissionPayload): Promise<boolean> {
    const subject = `Thank You for Reaching Out | Aradhna Marg`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Thank You - Aradhna Marg</title>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #fed7aa; box-shadow: 0 6px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1A0D07 0%, #3B1B09 100%); background-color: #1A0D07; padding: 32px 20px;">
              <div style="font-size: 38px; color: #FF9933; margin-bottom: 6px; font-weight: bold;">ॐ</div>
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 1.5px; font-weight: 800;">ARADHNA MARG</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">Sanatan Dharma • Sacred Knowledge • Digital Sanctuary</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0 0 16px 0;">
                Hello ${data.name}, 🙏
              </h2>
              <p style="font-size: 14px; line-height: 1.7; color: #475569; margin: 0 0 14px 0;">
                Thank you for contacting <strong>Aradhna Marg</strong>. We have successfully received your inquiry and appreciate you sharing your thoughts and feedback with us.
              </p>
              <p style="font-size: 14px; line-height: 1.7; color: #475569; margin: 0 0 20px 0;">
                Our team is reviewing your message. We are continuously dedicated to making sacred Sanatan scriptures, bhajans, stotras, and digital resources authentic and accessible to everyone.
              </p>

              <!-- Highlight Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #ea580c; font-weight: bold; margin-bottom: 4px;">Subject / Category:</div>
                    <div style="font-size: 14px; font-weight: 700; color: #7c2d12;">${data.subject || data.category || 'Feedback & Suggestions'}</div>
                    <div style="font-size: 13px; color: #9a3412; font-style: italic; margin-top: 6px; line-height: 1.5;">
                      "${data.message.length > 140 ? data.message.substring(0, 140) + '...' : data.message}"
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background: linear-gradient(to right, #FF9933, #EA580C); background-color: #EA580C;">
                    <a href="https://aradhnamarg.com" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 9999px;">
                      Explore Aradhna Marg ➜
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #0e0703; color: #94a3b8; padding: 22px 18px; font-size: 12px; line-height: 1.6;">
              <div style="color: #e2e8f0; font-weight: bold; margin-bottom: 4px;">Authentic Digital Collection of Vedas, 18 Maha Puranas & Sacred Bhajans</div>
              <div style="margin-top: 6px; color: #64748b;">© ${new Date().getFullYear()} Aradhna Marg. All Rights Reserved.</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: data.email,
      toName: data.name,
      subject,
      html,
      fromEmail: config.EMAIL_NOREPLY_ADDRESS || 'noreply@aradhnamarg.com',
      fromName: 'Aradhna Marg',
      replyTo: config.EMAIL_SUPPORT_ADDRESS || 'support@aradhnamarg.com'
    });
  }

  /**
   * 3. Send Donation / Contribution Invoice & Receipt to the Contributor
   */
  public async sendDonationReceipt(data: DonationReceiptPayload): Promise<boolean> {
    const formattedDate = (data.date || new Date()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const receiptId = `AM-${data.paymentId.replace('pay_', '').toUpperCase().slice(-8)}`;
    const subject = `Contribution Receipt # ${receiptId} | Aradhna Marg`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Contribution Receipt - Aradhna Marg</title>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #fed7aa; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1A0D07 0%, #351608 50%, #1A0D07 100%); background-color: #1A0D07; padding: 34px 20px;">
              <div style="font-size: 40px; color: #FF9933; margin-bottom: 4px; font-weight: 900;">ॐ</div>
              <h1 style="margin: 0; font-size: 26px; color: #ffffff; letter-spacing: 1.5px; font-weight: 900;">ARADHNA MARG</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">Sanatan Dharma • Sacred Knowledge • Digital Sanctuary</p>
              
              <div style="margin-top: 14px;">
                <span style="display: inline-block; background-color: rgba(255, 153, 51, 0.15); border: 1px solid #FF9933; color: #FF9933; padding: 5px 16px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                  Official Contribution Receipt
                </span>
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 28px 24px;">
              
              <!-- Gratitude Banner -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(to right, #fff7ed, #fef3c7); background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 18px 20px;">
                    <h3 style="margin: 0 0 6px 0; color: #c2410c; font-size: 18px; font-weight: 800;">Thank You for Your Sacred Contribution! 🙏</h3>
                    <p style="margin: 0; color: #7c2d12; font-size: 13px; line-height: 1.5;">
                      The Aradhna Marg community is deeply grateful for your generous support and dedication to Vedic wisdom.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Invoice Card Table -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 24px; border-collapse: separate;">
                
                <!-- Table Header Row -->
                <tr>
                  <td colspan="2" style="background-color: #f8fafc; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
                    Receipt & Payment Details
                  </td>
                </tr>

                <!-- Row: Receipt No -->
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 500; width: 45%;">
                    Receipt Number:
                  </td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #ea580c; font-size: 14px; font-weight: 700; font-family: 'Courier New', Courier, monospace; width: 55%;">
                    ${receiptId}
                  </td>
                </tr>

                <!-- Row: Donor Name -->
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 500;">
                    Contributor Name:
                  </td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 700;">
                    ${data.donorName || 'Devotee / Contributor'}
                  </td>
                </tr>

                <!-- Row: Email -->
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 500;">
                    Email Address:
                  </td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">
                    <a href="mailto:${data.donorEmail}" style="color: #ea580c; text-decoration: none;">${data.donorEmail}</a>
                  </td>
                </tr>

                <!-- Row: Phone (Optional) -->
                ${
                  data.donorPhone
                    ? `
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 500;">
                    Phone Number:
                  </td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${data.donorPhone}
                  </td>
                </tr>`
                    : ''
                }

                <!-- Row: Date & Time -->
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 500;">
                    Date & Time:
                  </td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${formattedDate}
                  </td>
                </tr>

                <!-- Row: Payment ID -->
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 500;">
                    Transaction ID:
                  </td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 12px; font-family: 'Courier New', Courier, monospace; font-weight: 600;">
                    ${data.paymentId}
                  </td>
                </tr>

                <!-- Row: Purpose -->
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #fed7aa; color: #64748b; font-size: 13px; font-weight: 500;">
                    Purpose:
                  </td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #fed7aa; color: #0f172a; font-size: 13px; font-weight: 600;">
                    Sanatan Dharma Digital Preservation & Seva
                  </td>
                </tr>

                <!-- Row: TOTAL AMOUNT PAID -->
                <tr style="background-color: #fffaf0;">
                  <td style="padding: 18px 18px; color: #1e293b; font-size: 15px; font-weight: 800; vertical-align: middle;">
                    Total Contribution:
                  </td>
                  <td align="right" style="padding: 18px 18px; color: #ea580c; font-size: 24px; font-weight: 900; vertical-align: middle; white-space: nowrap;">
                    ₹${data.amount}
                  </td>
                </tr>
              </table>

              <!-- Purpose & Impact Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; border-left: 4px solid #FF9933; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; line-height: 1.6; color: #442211;">
                    <strong style="color: #9a3412;">Dedication to Sanatan Dharma:</strong><br/>
                    Your contribution directly supports the preservation and digitization of the 18 Maha Puranas, authentic Sanskrit shlokas, stotras, devotional bhajans, and free digital accessibility for future generations.
                  </td>
                </tr>
              </table>

              <!-- Visit Portal Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background: linear-gradient(to right, #FF9933, #EA580C); background-color: #EA580C;">
                    <a href="https://aradhnamarg.com" target="_blank" style="display: inline-block; padding: 12px 34px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 9999px;">
                      Visit Aradhna Marg ➜
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #0e0703; color: #94a3b8; padding: 22px 18px; font-size: 12px; line-height: 1.6;">
              <div style="color: #ffffff; font-weight: bold; font-size: 13px; margin-bottom: 4px;">Aradhna Marg • Digital Sanctuary</div>
              <div style="margin-bottom: 4px;">This is an electronically generated receipt issued by Aradhna Marg.</div>
              <div>Contact: <a href="mailto:support@aradhnamarg.com" style="color: #fde68a; text-decoration: none;">support@aradhnamarg.com</a></div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: data.donorEmail,
      toName: data.donorName,
      subject,
      html,
      fromEmail: config.EMAIL_INFO_ADDRESS || 'info@aradhnamarg.com',
      fromName: 'Aradhna Marg Seva',
      replyTo: config.EMAIL_SUPPORT_ADDRESS || 'support@aradhnamarg.com'
    });
  }

  /**
   * 4. Send Donation Alert to Admin
   */
  public async sendDonationAlertToAdmin(data: DonationReceiptPayload): Promise<boolean> {
    const adminEmail = config.ADMIN_EMAIL || 'support@aradhnamarg.com';
    const subject = `💰 [New Contribution] ₹${data.amount} received from ${data.donorName || 'Devotee'}`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      </head>
      <body style="margin: 0; padding: 15px; font-family: sans-serif; background-color: #f8fafc;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #fed7aa; border-radius: 14px; overflow: hidden;">
          <tr>
            <td style="background-color: #1a0d07; padding: 18px 20px; text-align: center;">
              <h2 style="color: #FF9933; margin: 0; font-size: 20px;">New Contribution Received! 🎉</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Donor Name:</td>
                  <td align="right" style="padding: 8px 0; color: #0f172a; font-weight: bold; font-size: 14px;">${data.donorName || 'Anonymous'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Amount:</td>
                  <td align="right" style="padding: 8px 0; color: #16a34a; font-weight: 900; font-size: 20px;">₹${data.amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email:</td>
                  <td align="right" style="padding: 8px 0; color: #ea580c; font-weight: 600; font-size: 13px;">${data.donorEmail}</td>
                </tr>
                ${
                  data.donorPhone
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Phone:</td>
                  <td align="right" style="padding: 8px 0; color: #0f172a; font-size: 13px;">${data.donorPhone}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Payment ID:</td>
                  <td align="right" style="padding: 8px 0; color: #475569; font-family: monospace; font-size: 12px;">${data.paymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Order ID:</td>
                  <td align="right" style="padding: 8px 0; color: #475569; font-family: monospace; font-size: 12px;">${data.orderId}</td>
                </tr>
                ${
                  data.note
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Donor Note:</td>
                  <td align="right" style="padding: 8px 0; color: #0f172a; font-size: 13px; font-style: italic;">"${data.note}"</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Date & Time:</td>
                  <td align="right" style="padding: 8px 0; color: #0f172a; font-size: 13px;">${new Date().toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: adminEmail,
      subject,
      html,
      fromEmail: config.EMAIL_INFO_ADDRESS || 'info@aradhnamarg.com',
      fromName: 'Aradhna Marg Seva Alert'
    });
  }

  /**
   * 5. Send Welcome & Onboarding Email to New User
   */
  public async sendWelcomeEmail(data: { name: string; email: string; verificationUrl?: string }): Promise<boolean> {
    const subject = `Welcome to Aradhna Marg! | Sacred Devotional Sanctuary`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to Aradhna Marg</title>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #fed7aa; box-shadow: 0 6px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1A0D07 0%, #3B1B09 100%); background-color: #1A0D07; padding: 36px 20px;">
              <div style="font-size: 42px; color: #FF9933; margin-bottom: 8px; font-weight: bold;">ॐ</div>
              <h1 style="margin: 0; font-size: 26px; color: #ffffff; letter-spacing: 1.5px; font-weight: 800;">ARADHNA MARG</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">Sanatan Dharma • Sacred Knowledge • Devotional Sanctuary</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 34px 26px;">
              <h2 style="font-size: 20px; font-weight: bold; color: #1e293b; margin: 0 0 16px 0;">
                Hello ${data.name}, 🙏
              </h2>
              <p style="font-size: 14.5px; line-height: 1.7; color: #475569; margin: 0 0 16px 0;">
                A warm and heartfelt welcome to <strong>Aradhna Marg</strong>! Your account has been registered successfully.
              </p>
              <p style="font-size: 14px; line-height: 1.7; color: #475569; margin: 0 0 22px 0;">
                You can now save your favourite sacred bhajans to your personal <strong>Wishlist</strong>, explore authentic chapters of the 18 Maha Puranas, read scriptural articles, and immerse yourself in devotion whenever you wish.
              </p>

              <!-- Features Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 14px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; text-transform: uppercase; color: #ea580c; font-weight: bold; margin-bottom: 8px;">Your Account Features:</div>
                    <ul style="margin: 0; padding-left: 20px; color: #7c2d12; font-size: 13.5px; line-height: 1.8;">
                      <li><strong>Personal Wishlist:</strong> Bookmark your favorite bhajans, aartis, and stotras in one click.</li>
                      <li><strong>Dedicated Support:</strong> Seamless submission and priority assistance for suggestions and queries.</li>
                      <li><strong>Authentic Heritage:</strong> Pure, verified scriptural texts curated with reverent care.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background: linear-gradient(to right, #FF9933, #EA580C); background-color: #EA580C;">
                    <a href="${data.verificationUrl || 'https://aradhnamarg.com'}" target="_blank" style="display: inline-block; padding: 13px 36px; font-size: 14.5px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 9999px;">
                      Explore Aradhna Marg ➜
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #0e0703; color: #94a3b8; padding: 22px 18px; font-size: 12px; line-height: 1.6;">
              <div style="color: #e2e8f0; font-weight: bold; margin-bottom: 4px;">Authentic Digital Collection of Vedas, 18 Maha Puranas & Sacred Bhajans</div>
              <div style="margin-top: 6px; color: #64748b;">© ${new Date().getFullYear()} Aradhna Marg. All Rights Reserved.</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: data.email,
      toName: data.name,
      subject,
      html,
      fromEmail: config.EMAIL_INFO_ADDRESS || 'info@aradhnamarg.com',
      fromName: 'Aradhna Marg',
      replyTo: config.EMAIL_SUPPORT_ADDRESS || 'support@aradhnamarg.com'
    });
  }

  /**
   * 5b. Send Devotional Email Verification Link (Valid for 24 Hours)
   */
  public async sendVerificationEmail(data: { name: string; email: string; verificationUrl: string }): Promise<boolean> {
    const subject = `Verify Your Email Address | Aradhna Marg (आराधना मार्ग)`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Email - Aradhna Marg</title>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #fed7aa; box-shadow: 0 6px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1A0D07 0%, #3B1B09 100%); background-color: #1A0D07; padding: 36px 20px;">
              <div style="font-size: 42px; color: #FF9933; margin-bottom: 8px; font-weight: bold;">ॐ</div>
              <h1 style="margin: 0; font-size: 26px; color: #ffffff; letter-spacing: 1.5px; font-weight: 800;">ARADHNA MARG</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">Sanatan Dharma • Sacred Knowledge • Devotional Sanctuary</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 34px 26px;">
              <h2 style="font-size: 20px; font-weight: bold; color: #1e293b; margin: 0 0 16px 0;">
                Hello ${data.name}, 🙏
              </h2>
              <p style="font-size: 14.5px; line-height: 1.7; color: #475569; margin: 0 0 16px 0;">
                Thank you for joining <strong>Aradhna Marg</strong>! To activate your account and verify your identity, please confirm your email address below.
              </p>

              <!-- Notice Callout -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="color: #c2410c; font-weight: bold; font-size: 13.5px; margin-bottom: 4px;">
                      ✉️ Account Activation Required:
                    </div>
                    <div style="color: #9a3412; font-size: 13px; line-height: 1.5;">
                      Your email must be verified before you can sign in to save your favorite sacred bhajans, read scriptures, and sync your personalized Wishlist.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background: linear-gradient(to right, #FF9933, #EA580C); background-color: #EA580C;">
                    <a href="${data.verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 38px; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 9999px; letter-spacing: 0.5px;">
                      Verify Email Address ➜
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12.5px; line-height: 1.6; color: #94a3b8; margin: 16px 0 0 0; text-align: center;">
                If the button above does not work, copy and paste this link into your browser:<br />
                <a href="${data.verificationUrl}" target="_blank" style="color: #ea580c; word-break: break-all;">${data.verificationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #0e0703; color: #94a3b8; padding: 22px 18px; font-size: 12px; line-height: 1.6;">
              <div style="color: #e2e8f0; font-weight: bold; margin-bottom: 4px;">Authentic Digital Collection of Vedas, 18 Maha Puranas & Sacred Bhajans</div>
              <div style="margin-top: 6px; color: #64748b;">© ${new Date().getFullYear()} Aradhna Marg. All Rights Reserved.</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: data.email,
      toName: data.name,
      subject,
      html,
      fromEmail: config.EMAIL_INFO_ADDRESS || 'info@aradhnamarg.com',
      fromName: 'Aradhna Marg',
      replyTo: config.EMAIL_SUPPORT_ADDRESS || 'support@aradhnamarg.com'
    });
  }

  /**
   * 6. Send Password Reset Link (Strict 15-Minute Timeline)
   */
  public async sendPasswordResetEmail(data: {
    name: string;
    email: string;
    resetUrl: string;
    expiresMinutes?: number;
  }): Promise<boolean> {
    const minutes = data.expiresMinutes || 15;
    const subject = `Reset Your Password (Valid for ${minutes} Minutes) | Aradhna Marg`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Password - Aradhna Marg</title>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #fed7aa; box-shadow: 0 6px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1A0D07 0%, #3B1B09 100%); background-color: #1A0D07; padding: 34px 20px;">
              <div style="font-size: 38px; color: #FF9933; margin-bottom: 6px; font-weight: bold;">ॐ</div>
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 1.5px; font-weight: 800;">ARADHNA MARG</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">Account Security & Password Recovery</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 34px 26px;">
              <h2 style="font-size: 19px; font-weight: bold; color: #1e293b; margin: 0 0 16px 0;">
                Hello ${data.name}, 🙏
              </h2>
              <p style="font-size: 14.5px; line-height: 1.7; color: #475569; margin: 0 0 16px 0;">
                We received a request to reset the password for your Aradhna Marg account.
              </p>

              <!-- Expiry Alert Callout -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="color: #991b1b; font-weight: bold; font-size: 13.5px; margin-bottom: 4px;">
                      ⏱️ Security Notice (Time Sensitive):
                    </div>
                    <div style="color: #b91c1c; font-size: 13px; line-height: 1.5;">
                      This password reset link is valid for <strong>${minutes} minutes only</strong>. For security purposes, it will expire automatically after this duration.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 26px auto 26px auto;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background: linear-gradient(to right, #FF9933, #EA580C); background-color: #EA580C;">
                    <a href="${data.resetUrl}" target="_blank" style="display: inline-block; padding: 14px 38px; font-size: 14.5px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 9999px;">
                      Reset Password ➜
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12.5px; line-height: 1.6; color: #64748b; margin: 20px 0 0 0;">
                If the button above does not work, please copy and paste this link into your browser:<br />
                <a href="${data.resetUrl}" style="color: #ea580c; word-break: break-all; font-size: 11.5px;">${data.resetUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; margin: 0;">
                🔒 If you did not request this password reset, you can safely ignore this email. Your account remains completely protected.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #0e0703; color: #94a3b8; padding: 20px 18px; font-size: 12px;">
              <div style="color: #64748b;">© ${new Date().getFullYear()} Aradhna Marg. All Rights Reserved.</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: data.email,
      toName: data.name,
      subject,
      html,
      fromEmail: config.EMAIL_INFO_ADDRESS || 'info@aradhnamarg.com',
      fromName: 'Aradhna Marg Security',
      replyTo: config.EMAIL_SUPPORT_ADDRESS || 'support@aradhnamarg.com'
    });
  }

  /**
   * 7. Send Password Changed Security Notification
   */
  public async sendPasswordChangedEmail(data: { name: string; email: string }): Promise<boolean> {
    const subject = `Security Alert: Your Password Was Changed | Aradhna Marg`;

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Changed - Aradhna Marg</title>
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #fed7aa; box-shadow: 0 6px 24px rgba(0,0,0,0.06);">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1A0D07 0%, #3B1B09 100%); background-color: #1A0D07; padding: 30px 20px;">
              <div style="font-size: 34px; color: #FF9933; margin-bottom: 6px; font-weight: bold;">ॐ</div>
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 1.5px; font-weight: 800;">ARADHNA MARG</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">Account Security Notification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 24px;">
              <h2 style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0 0 14px 0;">
                Hello ${data.name}, 🙏
              </h2>
              <p style="font-size: 14px; line-height: 1.7; color: #475569; margin: 0 0 16px 0;">
                This is a confirmation that the password for your Aradhna Marg account was successfully changed on <strong>${new Date().toLocaleString(
                  'en-IN',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }
                )}</strong>.
              </p>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; color: #166534; font-size: 13.5px;">
                ✅ Your account is protected with your new password.
              </div>
              <p style="font-size: 13px; line-height: 1.6; color: #b91c1c; margin: 0;">
                ⚠️ If you did not make this change, please contact our support team immediately at <a href="mailto:support@aradhnamarg.com" style="color: #b91c1c; font-weight: bold;">support@aradhnamarg.com</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #0e0703; color: #94a3b8; padding: 18px; font-size: 12px;">
              © ${new Date().getFullYear()} Aradhna Marg. All Rights Reserved.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: data.email,
      toName: data.name,
      subject,
      html,
      fromEmail: config.EMAIL_INFO_ADDRESS || 'info@aradhnamarg.com',
      fromName: 'Aradhna Marg Security',
      replyTo: config.EMAIL_SUPPORT_ADDRESS || 'support@aradhnamarg.com'
    });
  }
}

export const emailService = new EmailService();
