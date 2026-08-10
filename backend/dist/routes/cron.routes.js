"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manager_1 = require("@/cron/manager");
const router = (0, express_1.Router)();
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
        manager_1.cronManager.runJob(jobName).catch(err => {
            console.error(`Background job ${jobName} failed:`, err);
        });
        res.json({ success: true, message: `Job ${jobName} triggered successfully` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
