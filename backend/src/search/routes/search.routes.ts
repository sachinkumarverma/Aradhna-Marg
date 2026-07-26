import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

const router = Router();

router.get('/', searchController.search);
router.get('/suggestions', searchController.getSuggestions);
router.get('/trending', searchController.getTrending);

export default router;
