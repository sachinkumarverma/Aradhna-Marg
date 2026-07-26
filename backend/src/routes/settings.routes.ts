import { Router } from 'express';
import { settingsController } from '../controllers/SettingsController';

const router = Router();

// GET /api/settings
router.get('/', settingsController.getSettings);

// PUT /api/settings
router.put('/', settingsController.updateSettings);

// PATCH /api/settings (Handled the same way as PUT using Partial DTO)
router.patch('/', settingsController.updateSettings);

export default router;
