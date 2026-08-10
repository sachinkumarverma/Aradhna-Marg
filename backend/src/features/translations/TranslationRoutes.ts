import { Router } from 'express';
import { translationController } from './TranslationController';
// Add validators later if needed, prompt says to do it incrementally

const router = Router();

router.post('/generate', translationController.generateTranslation);
router.post('/generate-live', translationController.generateLiveTranslation);
router.post('/upsert', translationController.upsertTranslation);
router.get('/:contentType/:contentId/:targetLanguage', translationController.getTranslation);
router.put('/:id', translationController.updateTranslation);

export { router as translationRoutes };
