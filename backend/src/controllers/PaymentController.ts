import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { config } from '@/config';
import { sendSuccess, sendError } from '@/responses/apiResponse';
import { AppError, InternalServerError } from '@/errors/appError';
import { logger } from '@utils/logger';

export class PaymentController {
  public getConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, 'Payment config retrieved', {
        keyId: config.RAZORPAY_KEY_ID || ''
      });
    } catch (error) {
      next(error);
    }
  };

  public createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, donorName, donorEmail, donorPhone, note } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 1) {
        throw new AppError('कृपया एक वैध राशि दर्ज करें (कम से कम ₹1) / Please enter a valid amount (minimum ₹1)', 400);
      }

      if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
        throw new InternalServerError('Razorpay gateway is not configured properly.');
      }

      const amountInPaise = Math.round(numAmount * 100);
      const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const auth = Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64');

      const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount: amountInPaise,
          currency: 'INR',
          receipt,
          notes: {
            donorName: donorName || 'Devotee / श्रद्धालु',
            donorEmail: donorEmail || '',
            donorPhone: donorPhone || '',
            note: note || '',
            purpose: 'Aradhna Marg Sanatan Devotional Support'
          }
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const order = response.data;

      return sendSuccess(res, 'Order created successfully', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: config.RAZORPAY_KEY_ID,
        receipt: order.receipt
      });
    } catch (error: any) {
      logger.error('Razorpay Create Order Error:', error?.response?.data || error.message);
      if (error?.response?.data?.error?.description) {
        return sendError(res, error.response.data.error.description, undefined, 400);
      }
      next(error);
    }
  };

  public verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donorName, amount } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError('Payment signature or IDs missing.', 400);
      }

      if (!config.RAZORPAY_KEY_SECRET) {
        throw new InternalServerError('Razorpay secret is not configured.');
      }

      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        logger.warn('Payment Signature Verification Failed for Order:', razorpay_order_id);
        throw new AppError('भुगतान सत्यापन विफल रहा / Payment verification failed', 400);
      }

      logger.info(
        `✅ Donation Payment Successful: Order ${razorpay_order_id}, Payment ${razorpay_payment_id}, Amount ₹${amount} by ${donorName || 'Anonymous'}`
      );

      return sendSuccess(res, 'दान एवं सहयोग हेतु आपका कोटि-कोटि धन्यवाद! आपका सहयोग पावन धर्म सेवा में समर्पित है।', {
        verified: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        message: 'दान एवं सहयोग हेतु आपका कोटि-कोटि धन्यवाद! आपका सहयोग पावन धर्म सेवा में समर्पित है।'
      });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();
