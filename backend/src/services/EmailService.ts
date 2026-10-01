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
  }): Promise<boolean> {
    const fromAddress = config.EMAIL_FROM_ADDRESS || 'support@aradhnamarg.com';
    const fromSender = {
      name: 'Aradhna Marg (आराधना मार्ग)',
      email: fromAddress
    };

    // 1. Try Nodemailer SMTP first
    if (this.transporter && config.SMTP_USER && config.SMTP_PASS) {
      try {
        await this.transporter.sendMail({
          from: config.EMAIL_FROM || `"${fromSender.name}" <${fromSender.email}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
          replyTo: options.replyTo || fromAddress
        });
        logger.info(`✅ Email successfully sent via SMTP to: ${options.to}`);
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
    const adminEmail = config.ADMIN_EMAIL || 'sachinv1410@gmail.com';
    const subject = `[Aradhna Marg] नया संदेश / New Message from ${data.name} (${data.category || data.subject || 'General'})`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f7f3; margin: 0; padding: 20px; color: #2C1810; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #fed7aa; }
          .header { background: linear-gradient(135deg, #1C0F08 0%, #3D1E0B 100%); color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; color: #FF9933; letter-spacing: 1px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #fde68a; }
          .body { padding: 30px 24px; }
          .badge { display: inline-block; background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
          .field { margin-bottom: 16px; }
          .field-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
          .field-value { font-size: 15px; color: #0f172a; font-weight: 500; }
          .message-box { background: #f8fafc; border-left: 4px solid #FF9933; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 14px; line-height: 1.6; color: #334155; }
          .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>॥ आराधना मार्ग ॥</h1>
            <p>नया संपर्क एवं सुझाव संदेश प्राप्त हुआ</p>
          </div>
          <div class="body">
            <span class="badge">${data.category || data.subject || 'सुझाव एवं संपर्क'}</span>
            
            <div class="field">
              <div class="field-label">प्रेषक का नाम (Sender Name)</div>
              <div class="field-value">${data.name}</div>
            </div>

            <div class="field">
              <div class="field-label">ईमेल पता (Email Address)</div>
              <div class="field-value"><a href="mailto:${data.email}" style="color: #ea580c; text-decoration: none;">${data.email}</a></div>
            </div>

            ${
              data.phone
                ? `
            <div class="field">
              <div class="field-label">दूरभाष (Phone Number)</div>
              <div class="field-value">${data.phone}</div>
            </div>`
                : ''
            }

            <div class="field">
              <div class="field-label">विषय (Subject)</div>
              <div class="field-value">${data.subject || 'सामान्य सुझाव'}</div>
            </div>

            <div class="field">
              <div class="field-label">संदेश / सुझाव (Message Content)</div>
              <div class="message-box">
                ${data.message.replace(/\n/g, '<br/>')}
              </div>
            </div>
          </div>
          <div class="footer">
            यह संदेश Aradhna Marg वेबसाइट के संपर्क फॉर्म द्वारा भेजा गया है।
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: adminEmail,
      subject,
      html,
      replyTo: data.email
    });
  }

  /**
   * 2. Send Acknowledgment & Thank You to the User
   */
  public async sendContactAcknowledgmentToUser(data: ContactSubmissionPayload): Promise<boolean> {
    const subject = `हार्दिक धन्यवाद! आपका संदेश हमें प्राप्त हो गया है | Aradhna Marg`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #2C1810; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.06); border: 1px solid #fed7aa; }
          .header { background: linear-gradient(135deg, #1A0D07 0%, #3B1B09 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
          .om-logo { font-size: 36px; color: #FF9933; margin-bottom: 8px; font-weight: bold; }
          .header h1 { margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 1px; font-weight: 800; }
          .header p { margin: 8px 0 0 0; font-size: 13px; color: #fde68a; letter-spacing: 0.5px; }
          .body { padding: 32px 28px; }
          .greeting { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 16px; }
          .content-p { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 16px; }
          .highlight-card { background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .highlight-card h4 { margin: 0 0 8px 0; font-size: 13px; color: #ea580c; text-transform: uppercase; font-weight: bold; }
          .highlight-card p { margin: 0; font-size: 13px; color: #7c2d12; line-height: 1.5; }
          .btn-container { text-align: center; margin: 28px 0 10px 0; }
          .btn { display: inline-block; background: linear-gradient(to right, #FF9933, #EA580C); color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 9999px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25); }
          .footer { background: #0e0703; color: #94a3b8; padding: 24px; text-align: center; font-size: 12px; line-height: 1.6; }
          .footer a { color: #fde68a; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="om-logo">ॐ</div>
            <h1>ARADHNA MARG</h1>
            <p>सनातन धर्म • ज्ञान-मंदिर • डिजिटल सेवा</p>
          </div>
          <div class="body">
            <div class="greeting">नमस्ते ${data.name} जी,</div>
            <p class="content-p">
              आराधना मार्ग पर अपना अमूल्य विचार एवं सुझाव साझा करने के लिए आपका <strong>हार्दिक धन्यवाद</strong>।
            </p>
            <p class="content-p">
              आपका संदेश हमारी टीम को सफलतापूर्वक प्राप्त हो चुका है। हम सनातन धर्म ग्रंथों, भजनों, आरतियों एवं डिजिटल सेवाओं को और अधिक शुद्ध, प्रामाणिक व उपयोगी बनाने हेतु निरंतर प्रयासरत हैं। यदि आपके संदेश में कोई विशेष प्रश्न या सुधार प्रस्ताव है, तो हमारी टीम शीघ्र ही आपसे संपर्क करेगी।
            </p>

            <div class="highlight-card">
              <h4>आपके द्वारा प्रेषित विषय:</h4>
              <p><strong>${data.subject || data.category || 'सुझाव एवं संदेश'}</strong></p>
              <p style="margin-top: 6px; font-style: italic;">"${data.message.length > 120 ? data.message.substring(0, 120) + '...' : data.message}"</p>
            </div>

            <div class="btn-container">
              <a href="https://aradhnamarg.com" class="btn">आराधना मार्ग पर पधारें</a>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; color: #e2e8f0; font-weight: bold;">॥ धर्मो रक्षति रक्षितः ॥</p>
            <p style="margin: 0 0 8px 0;">वेदों, 18 महापुराणों, स्तोत्रों एवं भजनों का प्रामाणिक डिजिटल संकलन।</p>
            <p style="margin: 0;">© ${new Date().getFullYear()} Aradhna Marg. All Rights Reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: data.email,
      toName: data.name,
      subject,
      html
    });
  }

  /**
   * 3. Send Donation / Contribution Invoice & Receipt to the Contributor
   */
  public async sendDonationReceipt(data: DonationReceiptPayload): Promise<boolean> {
    const formattedDate = (data.date || new Date()).toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const receiptId = `AM-${data.paymentId.replace('pay_', '').toUpperCase().slice(-8)}`;
    const subject = `पावन धर्म सेवा सहयोग रसीद (Contribution Receipt) # ${receiptId} | Aradhna Marg`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #2C1810; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #fed7aa; }
          .header { background: linear-gradient(135deg, #1A0D07 0%, #351608 50%, #1A0D07 100%); color: #ffffff; padding: 36px 24px; text-align: center; position: relative; }
          .om-logo { font-size: 40px; color: #FF9933; margin-bottom: 6px; font-weight: 900; }
          .header h1 { margin: 0; font-size: 26px; color: #ffffff; letter-spacing: 1.5px; font-weight: 900; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #fde68a; letter-spacing: 0.5px; }
          .receipt-title-badge { display: inline-block; background: rgba(255, 153, 51, 0.2); border: 1px solid #FF9933; color: #FF9933; padding: 4px 16px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-top: 14px; text-transform: uppercase; letter-spacing: 1px; }
          .body { padding: 32px 28px; }
          .thank-you-box { background: linear-gradient(to right, #fff7ed, #fef3c7); border: 1px solid #fed7aa; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .thank-you-box h3 { margin: 0 0 6px 0; color: #c2410c; font-size: 18px; font-weight: 800; }
          .thank-you-box p { margin: 0; color: #7c2d12; font-size: 13px; line-height: 1.5; }
          
          /* Invoice Table */
          .invoice-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
          .invoice-header { background: #f8fafc; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
          .invoice-row { display: flex; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .invoice-row:last-child { border-bottom: none; }
          .invoice-label { color: #64748b; font-weight: 500; }
          .invoice-value { color: #0f172a; font-weight: 600; text-align: right; }
          .total-row { background: #fffaf0; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 2px dashed #fed7aa; }
          .total-label { font-size: 16px; font-weight: 800; color: #1e293b; }
          .total-value { font-size: 22px; font-weight: 900; color: #ea580c; }
          
          .blessing-box { background: #FAF7F2; border-left: 4px solid #FF9933; border-radius: 8px; padding: 16px 20px; margin: 20px 0; font-size: 13px; line-height: 1.6; color: #442211; }
          .btn-container { text-align: center; margin: 24px 0 10px 0; }
          .btn { display: inline-block; background: linear-gradient(to right, #FF9933, #EA580C); color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.28); }
          .footer { background: #0e0703; color: #94a3b8; padding: 26px; text-align: center; font-size: 12px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="om-logo">ॐ</div>
            <h1>ARADHNA MARG</h1>
            <p>सनातन धर्म • ज्ञान-मंदिर • डिजिटल सेवा</p>
            <div class="receipt-title-badge">पावन सहयोग रसीद / Contribution Receipt</div>
          </div>
          <div class="body">
            <div class="thank-you-box">
              <h3>कोटि-कोटि धन्यवाद! 🙏</h3>
              <p>आराधना मार्ग परिवार आपके इस पावन सहयोग व समर्पण हेतु हृदय से आभारी है।</p>
            </div>

            <div class="invoice-card">
              <div class="invoice-header">रसीद एवं भुगतान विवरण (Receipt Details)</div>
              
              <div class="invoice-row">
                <span class="invoice-label">रसीद संख्या (Receipt No.):</span>
                <span class="invoice-value" style="font-family: monospace; color: #ea580c;">${receiptId}</span>
              </div>

              <div class="invoice-row">
                <span class="invoice-label">सहयोगी नाम (Donor Name):</span>
                <span class="invoice-value">${data.donorName || 'Devotee / श्रद्धालु'}</span>
              </div>

              <div class="invoice-row">
                <span class="invoice-label">ईमेल (Email):</span>
                <span class="invoice-value">${data.donorEmail}</span>
              </div>

              ${
                data.donorPhone
                  ? `
              <div class="invoice-row">
                <span class="invoice-label">दूरभाष (Phone):</span>
                <span class="invoice-value">${data.donorPhone}</span>
              </div>`
                  : ''
              }

              <div class="invoice-row">
                <span class="invoice-label">दिनांक व समय (Date & Time):</span>
                <span class="invoice-value">${formattedDate}</span>
              </div>

              <div class="invoice-row">
                <span class="invoice-label">भुगतान संदर्भ (Transaction ID):</span>
                <span class="invoice-value" style="font-family: monospace; font-size: 12px;">${data.paymentId}</span>
              </div>

              <div class="invoice-row">
                <span class="invoice-label">सहयोग प्रयोजन (Purpose):</span>
                <span class="invoice-value">सनातन धर्म सेवा एवं डिजिटल संकलन</span>
              </div>

              <div class="total-row">
                <span class="total-label">समर्पित सहयोग राशि (Total Paid):</span>
                <span class="total-value">₹${data.amount}</span>
              </div>
            </div>

            <div class="blessing-box">
              <strong>॥ दाता एक राम भिखारी सारी दुनिया ॥</strong><br/>
              आपका यह सहयोग महापुराणों के डिजिटलीकरण, प्रामाणिक श्लोकों, दुर्लभ स्तोत्रों, भजनों तथा आगामी पीढ़ियों तक सनातन ज्ञान के निःशुल्क प्रसार में समर्पित रहेगा।
            </div>

            <div class="btn-container">
              <a href="https://aradhnamarg.com" class="btn">आराधना मार्ग पर जाएं</a>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 6px 0; color: #ffffff; font-weight: bold; font-size: 13px;">॥ धर्मो रक्षति रक्षितः ॥</p>
            <p style="margin: 0 0 6px 0;">यह इलेक्ट्रॉनिक रसीद Aradhna Marg द्वारा स्वतः उत्पन्न की गई है।</p>
            <p style="margin: 0;">संपर्क: <a href="mailto:support@aradhnamarg.com" style="color: #fde68a;">support@aradhnamarg.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: data.donorEmail,
      toName: data.donorName,
      subject,
      html
    });
  }

  /**
   * 4. Send Donation Alert to Admin
   */
  public async sendDonationAlertToAdmin(data: DonationReceiptPayload): Promise<boolean> {
    const adminEmail = config.ADMIN_EMAIL || 'sachinv1410@gmail.com';
    const subject = `💰 [नया सहयोग] ₹${data.amount} received from ${data.donorName || 'Devotee'}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #fed7aa; border-radius: 12px;">
        <h2 style="color: #ea580c; margin-top: 0;">नया धर्म सहयोग प्राप्त हुआ! 🎉</h2>
        <p><strong>दाता (Donor):</strong> ${data.donorName || 'Anonymous'}</p>
        <p><strong>राशि (Amount):</strong> <span style="font-size: 18px; color: #16a34a; font-weight: bold;">₹${data.amount}</span></p>
        <p><strong>ईमेल (Email):</strong> ${data.donorEmail}</p>
        <p><strong>फ़ोन (Phone):</strong> ${data.donorPhone || 'N/A'}</p>
        <p><strong>Payment ID:</strong> ${data.paymentId}</p>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>संदेश/Note:</strong> ${data.note || 'None'}</p>
        <p><strong>दिनांक:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `;

    return this.sendMail({
      to: adminEmail,
      subject,
      html
    });
  }
}

export const emailService = new EmailService();
