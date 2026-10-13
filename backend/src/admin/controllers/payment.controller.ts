import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { paymentService, PaymentService } from '@services/PaymentService';
import { PaymentStatus } from '@models/Payment';

export class AdminPaymentController {
  constructor(private readonly service: PaymentService = paymentService) {}

  public getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const range = (req.query.range as string) || '30d';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = await this.service.getOverviewData(range, startDate, endDate);
      return sendSuccess(res, 'Donation overview metrics retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as PaymentStatus | undefined;
      const search = req.query.search as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const gateway = req.query.gateway as string | undefined;
      const paymentMethod = req.query.paymentMethod as string | undefined;
      const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
      const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;
      const isAnonymous = req.query.isAnonymous !== undefined ? req.query.isAnonymous === 'true' : undefined;
      const supporterEmail = req.query.supporterEmail as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const result = await this.service.listPayments({
        page,
        limit,
        status,
        search,
        startDate,
        endDate,
        gateway,
        paymentMethod,
        minAmount,
        maxAmount,
        isAnonymous,
        supporterEmail,
        sortBy,
        sortOrder
      });

      return sendSuccess(res, 'Payments retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStatistics();
      return sendSuccess(res, 'Payment statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  };

  public getSupporters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;

      const summary = await this.service.getSupportersList({ page, limit, search });
      return sendSuccess(res, 'Supporters retrieved successfully', summary);
    } catch (error) {
      next(error);
    }
  };

  public getSupporterDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const details = await this.service.getSupporterDetails(id);
      return sendSuccess(res, 'Supporter details retrieved successfully', details);
    } catch (error) {
      next(error);
    }
  };

  public getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const status = req.query.status as string | undefined;
      const paymentMethod = req.query.paymentMethod as string | undefined;

      const report = await this.service.getFinancialReport({
        startDate,
        endDate,
        status,
        paymentMethod
      });

      return sendSuccess(res, 'Donation financial report retrieved successfully', report);
    } catch (error) {
      next(error);
    }
  };

  public exportCsv = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as PaymentStatus | undefined;
      const search = req.query.search as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const gateway = req.query.gateway as string | undefined;
      const paymentMethod = req.query.paymentMethod as string | undefined;

      const csvData = await this.service.exportPaymentsCsv({
        status,
        search,
        startDate,
        endDate,
        gateway,
        paymentMethod
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=donations_export_${Date.now()}.csv`);
      return res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const payment = await this.service.getPaymentById(id);
      return sendSuccess(res, 'Payment details retrieved successfully', payment);
    } catch (error) {
      next(error);
    }
  };

  public refund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { refundAmount, reason, initiateGatewayRefund, gatewayRefundId } = req.body;
      const updated = await this.service.recordRefund(id, Number(refundAmount), reason, {
        initiateGatewayRefund: !!initiateGatewayRefund,
        gatewayRefundId
      });
      return sendSuccess(res, 'Refund recorded successfully', updated);
    } catch (error) {
      next(error);
    }
  };

  public getLatestReconciliation = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const latest = await this.service.getLatestReconciliation();
      return sendSuccess(res, 'Latest reconciliation retrieved successfully', latest);
    } catch (error) {
      next(error);
    }
  };

  public runReconciliation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, customGatewayRecords, liveFetch } = req.body;
      const result = await this.service.reconcileWithGateway({
        startDate,
        endDate,
        customGatewayRecords,
        liveFetch: liveFetch !== false,
        performedBy: (req as any).user?.username || 'admin'
      });
      return sendSuccess(res, 'Reconciliation performed successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const logs = await this.service.listAuditLogs(limit);
      return sendSuccess(res, 'Payment audit logs retrieved successfully', logs);
    } catch (error) {
      next(error);
    }
  };

  public getNotifications = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await this.service.getFinancialNotifications();
      return sendSuccess(res, 'Financial notifications retrieved successfully', notifications);
    } catch (error) {
      next(error);
    }
  };
}

export const adminPaymentController = new AdminPaymentController();
