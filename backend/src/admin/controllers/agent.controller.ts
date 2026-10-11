import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { agentExecutionService } from '@/agents/services/AgentExecutionService';
import { agentProposalService } from '@/agents/services/AgentProposalService';
import { toolRegistry } from '@/agents/registry/ToolRegistry';

class AgentController {
  public listTools = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tools = toolRegistry.getAll().map((t) => ({
        name: t.name,
        description: t.description,
        permission: t.permission,
        requiresApproval: t.requiresApproval
      }));
      sendSuccess(res, 'Registered agent tools retrieved successfully', tools);
    } catch (error) {
      next(error);
    }
  };

  public listRuns = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const agentName = req.query.agentName as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await agentExecutionService.listRuns({ page, limit, agentName, status });
      sendSuccess(res, 'Agent runs retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public getRunDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await agentExecutionService.getRunById(req.params.id as string);
      sendSuccess(res, 'Agent run details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public cancelRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await agentExecutionService.cancelRun(req.params.id as string);
      sendSuccess(res, 'Agent run cancelled successfully', run);
    } catch (error) {
      next(error);
    }
  };

  public listProposals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const entityType = req.query.entityType as string | undefined;

      const result = await agentProposalService.getProposals({ page, limit, status, entityType });
      sendSuccess(res, 'Agent proposals retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public getProposalDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proposal = await agentProposalService.getProposalById(req.params.id as string);
      sendSuccess(res, 'Agent proposal retrieved successfully', proposal);
    } catch (error) {
      next(error);
    }
  };

  public approveProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewedBy = (req as any).user?.username || 'admin';
      const proposal = await agentProposalService.approveProposal(req.params.id as string, reviewedBy);
      sendSuccess(res, 'Agent proposal approved and applied successfully', proposal);
    } catch (error) {
      next(error);
    }
  };

  public rejectProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewedBy = (req as any).user?.username || 'admin';
      const rejectionReason = req.body.rejectionReason as string | undefined;
      const proposal = await agentProposalService.rejectProposal(req.params.id as string, reviewedBy, rejectionReason);
      sendSuccess(res, 'Agent proposal rejected successfully', proposal);
    } catch (error) {
      next(error);
    }
  };
}

export const agentController = new AgentController();
