import { Request, Response, NextFunction } from 'express';
import { uploadBase64Image } from '@/utils/supabaseStorage';

// Helper function to recursively find and upload base64 images
async function processObject(obj: any): Promise<void> {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (typeof value === 'string' && value.startsWith('data:image/')) {
      // It's a base64 image string, let's upload it
      obj[key] = await uploadBase64Image(value);
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects or arrays
      await processObject(value);
    }
  }
}

export const base64UploadMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
    try {
      await processObject(req.body);
    } catch (error) {
      console.error('Error processing base64 uploads in middleware:', error);
      // We continue even if there's an error, fallback is handled in uploadBase64Image
    }
  }
  next();
};
