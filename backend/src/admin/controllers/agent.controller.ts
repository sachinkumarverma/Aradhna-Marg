import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/responses/apiResponse';
import { agentExecutionService } from '@/agents/services/AgentExecutionService';
import { agentProposalService } from '@/agents/services/AgentProposalService';
import { toolRegistry } from '@/agents/registry/ToolRegistry';
import { agentRegistry, registerDefaultAgents } from '@/agents';
import { agentRunner } from '@/agents/services/AgentRunner';
import { seoAuditAgent } from '@/agents/seo/SeoAuditAgent';
import { seoImprovementAgent } from '@/agents/seo/SeoImprovementAgent';
import { bhajanMeaningAgent } from '@/agents/bhajan/BhajanMeaningAgent';
import { contentImprovementAgent } from '@/agents/content/ContentImprovementAgent';
import { agentSchedulerService } from '@/agents/services/AgentSchedulerService';

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
      const agentName = req.query.agentName as string | undefined;
      const targetField = req.query.targetField as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await agentProposalService.getProposals({
        page,
        limit,
        status,
        entityType,
        agentName,
        targetField,
        search
      });
      sendSuccess(res, 'Agent proposals retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  public getProposalStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await agentProposalService.getStats();
      sendSuccess(res, 'Agent proposal statistics retrieved successfully', stats);
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
      sendSuccess(res, 'Agent proposal approved successfully', proposal);
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

  public executeProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const executedBy = (req as any).user?.username || 'admin';
      const proposal = await agentProposalService.executeProposal(req.params.id as string, executedBy);
      sendSuccess(res, 'Agent proposal executed and applied successfully', proposal);
    } catch (error) {
      next(error);
    }
  };

  public generateBhajanMeaningProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const triggeredBy = (req as any).user?.username || 'admin';
      const { bhajanId, proposedMeaning, reasoning } = req.body;
      if (!bhajanId) {
        return res.status(400).json({ success: false, message: 'bhajanId is required' });
      }

      const run = await agentExecutionService.startRun({
        agentName: 'BhajanMeaningAgent',
        triggerType: 'MANUAL',
        triggeredBy,
        state: { bhajanId }
      });

      const result = await bhajanMeaningAgent.execute(run.id, { bhajanId, proposedMeaning, reasoning });

      sendSuccess(res, 'Bhajan meaning proposal generated and staged for review', result);
    } catch (error) {
      next(error);
    }
  };

  public generateSeoProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const triggeredBy = (req as any).user?.username || 'admin';
      const { entityType, entityId, targetField, proposedTitle, proposedDescription, reasoning, auditIssue } = req.body;

      if (!entityType || !entityId) {
        return res.status(400).json({ success: false, message: 'entityType and entityId are required' });
      }

      const run = await agentExecutionService.startRun({
        agentName: 'SeoImprovementAgent',
        triggerType: 'MANUAL',
        triggeredBy,
        state: { entityType, entityId, targetField, auditIssue }
      });

      const result = await seoImprovementAgent.execute(run.id, {
        entityType,
        entityId,
        targetField,
        proposedTitle,
        proposedDescription,
        reasoning,
        auditIssue
      });

      sendSuccess(res, 'SEO improvement proposal generated and staged for review', result);
    } catch (error) {
      next(error);
    }
  };

  public runSeoAudit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const triggeredBy = (req as any).user?.username || 'admin';
      const scope = req.body?.scope as string[] | undefined;
      const batchSize = req.body?.batchSize ? parseInt(req.body.batchSize, 10) : undefined;
      const maxItemsPerType = req.body?.maxItemsPerType ? parseInt(req.body.maxItemsPerType, 10) : undefined;

      const run = await agentExecutionService.startRun({
        agentName: 'SeoAuditAgent',
        triggerType: 'MANUAL',
        triggeredBy,
        state: { scope: scope || 'ALL_WEBSITE_CONTENT' }
      });

      const auditResult = await seoAuditAgent.execute(run.id, { scope, batchSize, maxItemsPerType });

      sendSuccess(res, 'SEO Audit Agent completed successfully', {
        runId: run.id,
        summary: auditResult.summary,
        findingsCount: auditResult.findings.length,
        findings: auditResult.findings
      });
    } catch (error) {
      next(error);
    }
  };

  public getLatestSeoAudit = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const runs = await agentExecutionService.listRuns({
        page: 1,
        limit: 1,
        agentName: 'SeoAuditAgent',
        status: 'COMPLETED'
      });
      sendSuccess(res, 'Latest SEO audit run retrieved', runs.data[0] || null);
    } catch (error) {
      next(error);
    }
  };

  public generateContentImprovementProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const triggeredBy = (req as any).user?.username || 'admin';
      const { entityType, entityId, targetField, proposedContent, reasoning } = req.body;

      if (!entityType || !entityId || !targetField) {
        return res.status(400).json({ success: false, message: 'entityType, entityId, and targetField are required' });
      }

      const run = await agentExecutionService.startRun({
        agentName: 'ContentImprovementAgent',
        triggerType: 'MANUAL',
        triggeredBy,
        state: { entityType, entityId, targetField }
      });

      const result = await contentImprovementAgent.execute(run.id, {
        entityType,
        entityId,
        targetField,
        proposedContent,
        reasoning
      });

      sendSuccess(res, 'Content improvement proposal generated and staged for review', result);
    } catch (error) {
      next(error);
    }
  };

  public listAgents = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if (agentRegistry.getAll().length === 0) {
        registerDefaultAgents();
      }
      const definitions = agentRegistry.getAllDefinitions();
      sendSuccess(res, 'Registered autonomous agents retrieved successfully', definitions);
    } catch (error) {
      next(error);
    }
  };

  public getAgentDefinition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const def = agentRegistry.getDefinition(id);
      if (!def) {
        return res.status(404).json({ success: false, message: `Agent '${id}' not found` });
      }
      sendSuccess(res, 'Agent definition retrieved successfully', def);
    } catch (error) {
      next(error);
    }
  };

  public startAgentRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agentId = (req.params.id || req.body.agentId) as string;
      const triggeredBy = (req as any).user?.username || 'admin';
      const inputParams = req.body?.inputParams || req.body?.options || {};

      const result = await agentRunner.run(agentId, {
        actor: { type: 'ADMIN', id: triggeredBy },
        triggerType: 'MANUAL',
        inputParams
      });

      sendSuccess(res, `Autonomous agent '${agentId}' completed execution`, result);
    } catch (error) {
      next(error);
    }
  };

  public listSchedules = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const schedules = await agentSchedulerService.getSchedules();
      sendSuccess(res, 'Agent schedules retrieved successfully', schedules);
    } catch (error) {
      next(error);
    }
  };

  public updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agentId = req.params.id as string;
      const { enabled, scheduleInterval, cronExpression } = req.body;
      const updated = await agentSchedulerService.updateSchedule(agentId, {
        enabled,
        scheduleInterval,
        cronExpression
      });
      sendSuccess(res, `Schedule for agent '${agentId}' updated successfully`, updated);
    } catch (error) {
      next(error);
    }
  };

  public runScheduledAgentNow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agentId = req.params.id as string;
      const triggeredBy = (req as any).user?.username || 'admin';
      const result = await agentSchedulerService.executeManualRun(agentId, triggeredBy);
      sendSuccess(res, `Agent '${agentId}' executed successfully via manual trigger`, result);
    } catch (error) {
      next(error);
    }
  };
}

export const agentController = new AgentController();
