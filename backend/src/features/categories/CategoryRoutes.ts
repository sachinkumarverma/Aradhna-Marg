import { Router } from 'express';
import { categoryController } from './CategoryController';

const router = Router();

router.post('/', categoryController.createCategory.bind(categoryController));
router.get('/', categoryController.getCategories.bind(categoryController));
router.put('/bulk-edit', categoryController.bulkEditCategories.bind(categoryController));
router.delete('/bulk-delete', categoryController.bulkDeleteCategories.bind(categoryController));
router.get('/:id', categoryController.getCategory.bind(categoryController));
router.put('/:id', categoryController.updateCategory.bind(categoryController));
router.delete('/:id', categoryController.deleteCategory.bind(categoryController));

export default router;
