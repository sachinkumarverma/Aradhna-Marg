import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { sendSuccess } from '@/responses/apiResponse';
import { paymentService, PaymentService } from '@services/PaymentService';
import { AppError } from '@/errors/appError';

export class PaymentController {
  constructor(private readonly service: PaymentService = paymentService) {}

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
      const { amount, donorName, donorEmail, donorPhone, note, isAnonymous } = req.body;

      const order = await this.service.createOrder({
        amount,
        donorName,
        donorEmail,
        donorPhone,
        note,
        isAnonymous
      });

      return sendSuccess(res, 'Order created successfully', order);
    } catch (error) {
      next(error);
    }
  };

  public verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        donorName,
        donorEmail,
        donorPhone,
        amount,
        note
      } = req.body;

      const result = await this.service.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        donorName,
        donorEmail,
        donorPhone,
        amount: amount !== undefined ? Number(amount) : undefined,
        note
      });

      return sendSuccess(res, result.message, {
        verified: result.verified,
        orderId: result.orderId,
        paymentId: result.paymentId,
        payment: result.payment,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  public handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) {
        throw new AppError('Missing x-razorpay-signature header', 400);
      }

      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        throw new AppError('Raw request body unavailable for signature verification', 400);
      }
      const result = await this.service.handleWebhook(req.body, signature, rawBody);

      return sendSuccess(res, 'Webhook processed successfully', result);
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();
