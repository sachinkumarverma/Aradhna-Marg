import { Router } from 'express';
import { deityController } from './DeityController';

const router = Router();

router.get('/', deityController.getDeities.bind(deityController));
router.post('/', deityController.createDeity.bind(deityController));
router.post('/bulk', deityController.bulkAction.bind(deityController));
router.get('/:id', deityController.getDeity.bind(deityController));
router.put('/:id', deityController.updateDeity.bind(deityController));
router.delete('/:id', deityController.deleteDeity.bind(deityController));

export default router;
