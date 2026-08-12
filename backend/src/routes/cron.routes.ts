import { Router } from 'express';
import { cronManager } from '@/cron/manager';

const router = Router();

// Protect this route with a secret key
router.get('/trigger/:jobName', async (req, res, next) => {
  try {
    const { jobName } = req.params;
    const { secret } = req.query;

    if (secret !== process.env.CRON_SECRET) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Run asynchronously to prevent HTTP timeouts and "output too large" errors from Gateway Timeouts
    cronManager.runJob(jobName).catch((err) => {
      console.error(`Background job ${jobName} failed:`, err);
    });

    res.json({ success: true, message: `Job ${jobName} triggered successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
