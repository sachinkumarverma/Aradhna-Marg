import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../responses/apiResponse';
import { AiJobService } from '../services/AiJobService';

class AdminAiController {
  private service: AiJobService;

  constructor() {
    this.service = new AiJobService();
  }

  public list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await this.service.getJobs({ page, limit, status });
      sendSuccess(res, 'AI jobs retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStats();
      sendSuccess(res, 'AI stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  };

  public queueJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await this.service.queueJob(req.body);
      sendSuccess(res, 'AI job queued successfully', job, 201);
    } catch (error) {
      next(error);
    }
  };

  public retryJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await this.service.retryJob(req.params.id as string);
      sendSuccess(res, 'AI job retry initiated', job);
    } catch (error) {
      next(error);
    }
  };

  public cancelJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await this.service.cancelJob(req.params.id as string);
      sendSuccess(res, 'AI job cancelled', job);
    } catch (error) {
      next(error);
    }
  };

  public deleteJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteJob(req.params.id as string);
      sendSuccess(res, 'AI job deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const adminAiController = new AdminAiController();
