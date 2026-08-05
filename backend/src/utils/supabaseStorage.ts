import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadBase64Image(base64Str: string): Promise<string> {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str; // Not a base64 image, return as is
  }

  try {
    // Extract mime type and base64 data
    const matches = base64Str.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = mimeType.split('/')[1] || 'webp';
    const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'aradhna-images';
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return base64Str; // Fallback to storing base64 if upload fails
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadBase64Image:', error);
    return base64Str; // Fallback
  }
}
