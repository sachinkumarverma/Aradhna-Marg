import { Router } from 'express';
import { adminBhajanController } from './BhajanController';

const router = Router();

router.get('/', adminBhajanController.list);
router.post('/bulk', adminBhajanController.bulkAction);
router.post('/', adminBhajanController.create);
router.get('/:id', adminBhajanController.getById);
router.put('/:id', adminBhajanController.update);
router.delete('/:id', adminBhajanController.delete);

export default router;
