import { Router } from 'express';
import { tagController } from './TagController';

const router = Router();

router.get('/', tagController.getTags.bind(tagController));
router.post('/', tagController.createTag.bind(tagController));
router.post('/bulk', tagController.bulkAction.bind(tagController));
router.get('/:id', tagController.getTag.bind(tagController));
router.put('/:id', tagController.updateTag.bind(tagController));
router.delete('/:id', tagController.deleteTag.bind(tagController));

export default router;
