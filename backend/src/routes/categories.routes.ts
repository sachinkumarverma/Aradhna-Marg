import { Router } from 'express';
import { categoryController } from '../controllers/CategoryController';

const router = Router();

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.put('/bulk-edit', categoryController.bulkEditCategories);
router.delete('/bulk-delete', categoryController.bulkDeleteCategories);
router.get('/:id', categoryController.getCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
