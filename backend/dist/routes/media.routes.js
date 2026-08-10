"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const MediaController_1 = require("@controllers/MediaController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
// Folders
router.post('/folders', MediaController_1.mediaController.createFolder);
router.get('/folders', MediaController_1.mediaController.getFolders);
router.put('/folders/:id/rename', MediaController_1.mediaController.renameFolder);
router.delete('/folders/:id', MediaController_1.mediaController.deleteFolder);
// Files
router.post('/files', upload.single('file'), MediaController_1.mediaController.uploadFile);
router.get('/files', MediaController_1.mediaController.getFiles);
router.put('/files/bulk-move', MediaController_1.mediaController.bulkMoveFiles);
router.delete('/files/bulk-delete', MediaController_1.mediaController.bulkDeleteFiles);
router.put('/files/:id/rename', MediaController_1.mediaController.renameFile);
router.delete('/files/:id', MediaController_1.mediaController.deleteFile);
exports.default = router;
