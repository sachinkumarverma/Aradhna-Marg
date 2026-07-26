import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Use JWT_SECRET as the base for the encryption key, padded/hashed to 32 bytes
const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'fallback_secret', 'salt', 32);
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return text;
  if (!text.includes(':')) return text; // If not encrypted, return as is (for backwards compatibility)

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (err) {
    console.error('Error decrypting value:', err);
    return ''; // Return empty string or throw error if decryption fails
  }
}
