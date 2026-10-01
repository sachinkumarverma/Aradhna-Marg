import { Request, Response, NextFunction } from 'express';
import { db } from '@common/database/DatabaseClient';
import { sendSuccess } from '@/responses/apiResponse';
import { AppError } from '@/errors/appError';
import { emailService } from '@services/EmailService';
import { logger } from '@utils/logger';

export class ContactController {
  /**
   * Submit a contact message or suggestion
   */
  public submitContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, subject, category, message } = req.body;

      if (!email || !email.trim() || !email.includes('@')) {
        throw new AppError('कृपया एक मान्य ईमेल पता प्रदान करें / Please provide a valid email address', 400);
      }

      if (!message || !message.trim()) {
        throw new AppError('संदेश / सुझाव रिक्त नहीं हो सकता / Message cannot be empty', 400);
      }

      const senderName = (name || '').trim() || 'Devotee / श्रद्धालु';
      const cleanEmail = email.trim().toLowerCase();
      const cleanSubject = (subject || '').trim() || (category || '').trim() || 'सुझाव एवं संदेश';
      const cleanCategory = (category || '').trim() || 'सामान्य';
      const cleanMessage = message.trim();
      const cleanPhone = (phone || '').trim();

      // 1. Try to record in database (fail-safe)
      try {
        await db.query(
          `CREATE TABLE IF NOT EXISTS contact_submissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            subject VARCHAR(255),
            category VARCHAR(100),
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )`
        );

        await db.query(
          `INSERT INTO contact_submissions (name, email, phone, subject, category, message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [senderName, cleanEmail, cleanPhone, cleanSubject, cleanCategory, cleanMessage]
        );
      } catch (dbErr: any) {
        logger.warn('Could not persist contact submission to DB, proceeding with emails:', dbErr.message);
      }

      // 2. Send email notification to Admin and Confirmation to User asynchronously
      const payload = {
        name: senderName,
        email: cleanEmail,
        phone: cleanPhone,
        subject: cleanSubject,
        category: cleanCategory,
        message: cleanMessage
      };

      // Dispatch emails in parallel without blocking response if network slow
      Promise.allSettled([
        emailService.sendContactNotificationToAdmin(payload),
        emailService.sendContactAcknowledgmentToUser(payload)
      ]).then((results) => {
        logger.info(`Contact email delivery completed: ${JSON.stringify(results)}`);
      });

      return sendSuccess(res, 'आपका संदेश सफलतापूर्वक प्राप्त हो गया है। हार्दिक धन्यवाद!', {
        received: true,
        email: cleanEmail,
        name: senderName
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Subscribe to newsletter / daily updates
   */
  public subscribeNewsletter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body;

      if (!email || !email.trim() || !email.includes('@')) {
        throw new AppError('कृपया एक वैध ईमेल पता दर्ज करें / Please enter a valid email', 400);
      }

      const cleanEmail = email.trim().toLowerCase();
      const subscriberName = (name || '').trim() || 'धर्म प्रेमी';

      // 1. Record in subscribers table
      try {
        await db.query(
          `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )`
        );

        await db.query(
          `INSERT INTO newsletter_subscribers (email, name)
           VALUES ($1, $2)
           ON CONFLICT (email) DO NOTHING`,
          [cleanEmail, subscriberName]
        );
      } catch (dbErr: any) {
        logger.warn('Newsletter DB insert error:', dbErr.message);
      }

      // 2. Send Welcome / Acknowledgment Email
      emailService
        .sendContactAcknowledgmentToUser({
          name: subscriberName,
          email: cleanEmail,
          subject: 'सनातन सत्संग एवं ज्ञान संदेश सदस्यता',
          category: 'Newsletter Subscription',
          message: 'आराधना मार्ग परिवार के दैनिक सत्संग, श्लोक व पर्व संदेशों की सदस्यता प्राप्त हुई।'
        })
        .catch((err) => logger.warn('Newsletter email error:', err.message));

      return sendSuccess(res, 'हार्दिक धन्यवाद! आप आराधना मार्ग परिवार से जुड़ गए हैं।', {
        subscribed: true,
        email: cleanEmail
      });
    } catch (error) {
      next(error);
    }
  };
}

export const contactController = new ContactController();
