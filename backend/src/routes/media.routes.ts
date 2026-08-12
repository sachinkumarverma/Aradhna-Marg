import { Router } from 'express';
import multer from 'multer';
import { mediaController } from '@controllers/MediaController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Folders
router.post('/folders', mediaController.createFolder);
router.get('/folders', mediaController.getFolders);
router.put('/folders/:id/rename', mediaController.renameFolder);
router.delete('/folders/:id', mediaController.deleteFolder);

// Files
router.post('/files', upload.single('file'), mediaController.uploadFile);
router.get('/files', mediaController.getFiles);
router.put('/files/bulk-move', mediaController.bulkMoveFiles);
router.delete('/files/bulk-delete', mediaController.bulkDeleteFiles);
router.put('/files/:id/rename', mediaController.renameFile);
router.delete('/files/:id', mediaController.deleteFile);

export default router;
