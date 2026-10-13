import { Router } from 'express';
import multer from 'multer';
import { dashboardController } from '@admin/controllers/dashboard.controller';
import { adminArticleController } from '@admin/controllers/article.controller';
import { adminPuranController } from '@admin/controllers/puran.controller';
import { adminFestivalController } from '@admin/controllers/festival.controller';
import { bhajanRoutes } from '@features/bhajans';
import { tagRoutes } from '@features/tags';
import { youtubeRoutes } from '@features/youtube';
import { adminAuthorController } from '@admin/controllers/author.controller';
import { deityRoutes } from '@features/deities';
import { adminAiController } from '@admin/controllers/ai.controller';
import { agentController } from '@admin/controllers/agent.controller';
import { translationRoutes } from '@features/translations';
import { requireAdmin } from '@middlewares/auth';
import { authController } from '@admin/controllers/auth.controller';
import mediaRoutes from '@/routes/media.routes';

const router = Router();

// Public auth routes — no JWT required
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);

// ALL routes below this line are protected by JWT
router.use(requireAdmin);
router.get('/auth/me', authController.me);

// Dashboard
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/activity', dashboardController.getRecentActivity);

// Bhajans Management
router.use('/bhajans', bhajanRoutes);

// YouTube Management
router.use('/youtube', youtubeRoutes);

// Articles Management
router.get('/articles', adminArticleController.list);
router.post('/articles/bulk', adminArticleController.bulkAction);
router.post('/articles', adminArticleController.create);
router.get('/articles/:id', adminArticleController.getById);
router.put('/articles/:id', adminArticleController.update);
router.delete('/articles/:id', adminArticleController.delete);

// Puranas Management
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 300 * 1024 * 1024 } }); // 100MB limit
router.get('/puranas', adminPuranController.list);
router.post('/puranas/bulk', adminPuranController.bulkAction);
router.post('/puranas/upload-pdf', upload.single('file'), adminPuranController.uploadPdf);
router.post('/puranas', adminPuranController.create);
router.get('/puranas/:id', adminPuranController.getById);
router.put('/puranas/:id', adminPuranController.update);
router.delete('/puranas/:id', adminPuranController.delete);

// Festivals Management
router.get('/festivals', adminFestivalController.list);
router.post('/festivals/bulk', adminFestivalController.bulkAction);
router.post('/festivals', adminFestivalController.create);
router.get('/festivals/:id', adminFestivalController.getById);
router.put('/festivals/:id', adminFestivalController.update);
router.delete('/festivals/:id', adminFestivalController.delete);

// Tags Management
router.use('/tags', tagRoutes);

// Authors Management
router.get('/authors', adminAuthorController.list);
router.post('/authors/bulk', adminAuthorController.bulkAction);
router.post('/authors', adminAuthorController.create);
router.get('/authors/:id', adminAuthorController.getById);
router.put('/authors/:id', adminAuthorController.update);
router.delete('/authors/:id', adminAuthorController.delete);

// Deities Management
router.use('/deities', deityRoutes);

// Translations Management
router.use('/translations', translationRoutes);

// Media Management
router.use('/media', mediaRoutes);

// Future endpoints:
// router.use('/seo', seoController);

// AI Processing Pipeline
router.get('/ai/jobs', adminAiController.list);
router.get('/ai/stats', adminAiController.getStats);
router.get('/ai/bulk-counts', adminAiController.getBulkCounts);
router.post('/ai/queue', adminAiController.queueJob);
router.post('/ai/jobs/:id/retry', adminAiController.retryJob);
router.post('/ai/jobs/:id/cancel', adminAiController.cancelJob);
router.delete('/ai/jobs/:id', adminAiController.deleteJob);

// Agentic AI Gateway & Proposals Pipeline
router.get('/agents/definitions', agentController.listAgents);
router.get('/agents/definitions/:id', agentController.getAgentDefinition);
router.post('/agents/:id/run', agentController.startAgentRun);
router.get('/agents/schedules', agentController.listSchedules);
router.put('/agents/schedules/:id', agentController.updateSchedule);
router.post('/agents/schedules/:id/run', agentController.runScheduledAgentNow);
router.get('/agents/tools', agentController.listTools);
router.get('/agents/runs', agentController.listRuns);
router.get('/agents/runs/:id', agentController.getRunDetails);
router.post('/agents/runs/:id/cancel', agentController.cancelRun);
router.get('/agents/proposals', agentController.listProposals);
router.get('/agents/proposals/stats', agentController.getProposalStats);
router.get('/agents/proposals/:id', agentController.getProposalDetails);
router.post('/agents/proposals/:id/approve', agentController.approveProposal);
router.post('/agents/proposals/:id/reject', agentController.rejectProposal);
router.post('/agents/proposals/:id/execute', agentController.executeProposal);
router.post('/agents/bhajan-meaning/propose', agentController.generateBhajanMeaningProposal);
router.post('/agents/seo/propose', agentController.generateSeoProposal);
router.post('/agents/content/propose', agentController.generateContentImprovementProposal);
router.post('/agents/seo-audit/run', agentController.runSeoAudit);
router.get('/agents/seo-audit/latest', agentController.getLatestSeoAudit);

// Payments & Donations Management
import { adminPaymentController } from '@admin/controllers/payment.controller';

// Donations Routes
router.get('/donations/overview', adminPaymentController.getOverview);
router.get('/donations/payments', adminPaymentController.list);
router.get('/donations/payments/:id', adminPaymentController.getById);
router.get('/donations/supporters', adminPaymentController.getSupporters);
router.get('/donations/supporters/:id', adminPaymentController.getSupporterDetails);
router.get('/donations/reports', adminPaymentController.getReports);
router.get('/donations/export', adminPaymentController.exportCsv);
router.get('/donations/reconciliation/latest', adminPaymentController.getLatestReconciliation);
router.post('/donations/reconciliation/run', adminPaymentController.runReconciliation);
router.get('/donations/audit-logs', adminPaymentController.getAuditLogs);
router.get('/donations/notifications', adminPaymentController.getNotifications);
router.post('/donations/payments/:id/refund', adminPaymentController.refund);

// Backward-compatible /payments aliases
router.get('/payments', adminPaymentController.list);
router.get('/payments/stats', adminPaymentController.getStats);
router.get('/payments/supporters', adminPaymentController.getSupporters);
router.get('/payments/:id', adminPaymentController.getById);
router.post('/payments/:id/refund', adminPaymentController.refund);

export default router;
