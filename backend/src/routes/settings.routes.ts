import { Router } from 'express';
import { settingsController } from '../controllers/SettingsController';

const router = Router();

// ── Full read ────────────────────────────────────────────────────────────────
router.get('/', settingsController.getSettings);

// ── Legacy full-update (backward compat) ─────────────────────────────────────
router.put('/', settingsController.updateSettings);
router.patch('/', settingsController.updateSettings);

// ── Per-section endpoints ────────────────────────────────────────────────────
// Each route validates and saves ONLY the fields for that section.
router.put('/general', settingsController.updateGeneral);
router.put('/contact', settingsController.updateContact);
router.put('/social', settingsController.updateSocial);
router.put('/youtube', settingsController.updateYoutube);
router.put('/seo', settingsController.updateSeo);
router.put('/analytics', settingsController.updateAnalytics);
router.put('/advertisement', settingsController.updateAdvertisement);
router.put('/system', settingsController.updateSystem);

export default router;
