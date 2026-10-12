# ADR 003: Direct Upload Workflow and Removal of Media Library UI

## Status
Accepted

## Context
Earlier versions of the Aradhna Marg administrative panel considered a centralized "Media Library" where images and files were uploaded to a shared asset gallery before being attached to content.

This centralized Media Library introduced several critical issues:
1. Significant cognitive overhead: administrators had to switch contexts to upload an image, copy a URL or select from a gallery, and attach it to an article or bhajan.
2. Orphaned assets: images remained in storage even when unused, accumulating storage costs and clutter.
3. Complex permissions and asset browsing performance bottlenecks.
4. Direct image editing/cropping was disconnected from content creation workflows.

## Decision
1. **Media Library Browsing UI Removed**:
   - The centralized Media Library browsing view was permanently removed from the admin navigation.
   - Future agents must **NOT** reintroduce a centralized Media Library or media asset browser page unless explicitly requested by the project owner.
2. **Contextual Direct Uploads**:
   - Content forms (Articles, Bhajans, Puranas, Deities, Festivals, Settings) embed direct upload components (e.g. `ImageUploadWithCrop`).
   - Image uploads send multipart data directly via `uploadFile()` (`frontend/src/api/upload.ts`) to `POST /api/admin/media/files`. The backend compresses images to WebP via `sharp` and stores them in Supabase Storage or local fallback.
   - Puran PDF files are uploaded directly via `uploadPuranPdf()` to `POST /api/admin/puranas/upload-pdf`, which streams the file to Backblaze B2 using `BackblazeStorageService`.
3. **Storage References**:
   - The returned asset URL or storage key is saved directly into the target record column (`cover_image`, `thumbnail_url`, `pdf_file`, etc.).

## Consequences
- **Positive**: Streamlined editor UX, inline image cropping tailored to content aspect ratios, no orphaned asset galleries to maintain.
- **Negative**: Reusing the same image across multiple disparate records requires re-uploading or pasting the existing CDN/storage URL.
- **Rules for Future Agents**:
  - Do not add "Media Gallery", "Asset Manager", or "Media Library" navigation tabs or pages.
  - Keep upload controls contextual and local to the specific entity form.
