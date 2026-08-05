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

    await cronManager.runJob(jobName);
    
    res.json({ success: true, message: `Job ${jobName} executed successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
