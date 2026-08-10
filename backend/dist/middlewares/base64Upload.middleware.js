"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.base64UploadMiddleware = void 0;
const supabaseStorage_1 = require("@/utils/supabaseStorage");
// Helper function to recursively find and upload base64 images
async function processObject(obj) {
    if (!obj || typeof obj !== 'object')
        return;
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (typeof value === 'string' && value.startsWith('data:image/')) {
            // It's a base64 image string, let's upload it
            obj[key] = await (0, supabaseStorage_1.uploadBase64Image)(value);
        }
        else if (typeof value === 'object' && value !== null) {
            // Recursively process nested objects or arrays
            await processObject(value);
        }
    }
}
const base64UploadMiddleware = async (req, res, next) => {
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        try {
            await processObject(req.body);
        }
        catch (error) {
            console.error('Error processing base64 uploads in middleware:', error);
            // We continue even if there's an error, fallback is handled in uploadBase64Image
        }
    }
    next();
};
exports.base64UploadMiddleware = base64UploadMiddleware;
