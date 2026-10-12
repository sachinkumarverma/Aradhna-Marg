# ADR 004: Backblaze B2 S3-Compatible Object Storage for Purana PDFs

## Status
Accepted

## Context
Aradhna Marg hosts sacred Puranas comprising complete, authentic multi-hundred-page scripture PDF documents. Storing these large binary assets directly inside database tables or application server bundles is slow, degrades database performance, and inflates hosting costs.

## Decision
1. **Backblaze B2 as Primary Object Store for PDFs**:
   - Aradhna Marg uses Backblaze B2 Cloud Storage via its S3-compatible API.
   - Handled in `backend/src/services/storage/BackblazeStorageService.ts` using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
2. **Environment Configuration**:
   - Configured via backend environment variables:
     - `B2_REGION` (default: `'us-east-005'`)
     - `B2_ENDPOINT`
     - `B2_ACCESS_KEY_ID` (Secret)
     - `B2_SECRET_ACCESS_KEY` (Secret)
     - `B2_BUCKET_NAME`
3. **Upload Flow**:
   - Admin puran upload sends PDF via `POST /api/admin/puranas/upload-pdf` to `adminPuranController.uploadPdf`.
   - The file buffer is stored directly into B2 via `BackblazeStorageService.uploadPdf()`.
   - The resulting storage key is saved in `puranas.pdf_file`.
4. **Image Storage Distinction**:
   - Web images (article covers, thumbnails, deity artwork) are processed and compressed to WebP via `sharp` in `MediaService.ts` and stored in Supabase Storage (`SUPABASE_STORAGE_BUCKET`) or local fallback.

## Consequences
- **Positive**: High throughput, low cost for large PDF files, no heavy binary data in PostgreSQL.
- **Negative**: Requires B2 bucket configuration and credentials.
- **Rules for Future Agents**:
  - Never store binary file contents inside PostgreSQL columns (store URLs/storage keys only).
  - Never commit Backblaze credentials or secrets to documentation, code, or tests.
