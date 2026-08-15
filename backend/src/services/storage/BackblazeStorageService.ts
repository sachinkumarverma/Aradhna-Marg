import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from 'dotenv';
config();

class BackblazeStorageService {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: process.env.B2_REGION || 'us-east-005',
      endpoint: process.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.B2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY || ''
      }
    });
  }

  public async uploadPdf(
    fileBuffer: Buffer,
    storageKey: string,
    mimeType: string = 'application/pdf'
  ): Promise<string> {
    const bucket = process.env.B2_BUCKET_NAME;
    if (!bucket) throw new Error('B2_BUCKET_NAME is not configured');

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: mimeType
    });

    await this.client.send(command);
    return storageKey;
  }

  public async deletePdf(storageKey: string): Promise<void> {
    const bucket = process.env.B2_BUCKET_NAME;
    if (!bucket) throw new Error('B2_BUCKET_NAME is not configured');

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKey
    });
    await this.client.send(command);
  }

  public async getSignedUrl(storageKey: string, expiresInSeconds: number = 3600): Promise<string> {
    const bucket = process.env.B2_BUCKET_NAME;
    if (!bucket) throw new Error('B2_BUCKET_NAME is not configured');

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

export const backblazeStorageService = new BackblazeStorageService();
