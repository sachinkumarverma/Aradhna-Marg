import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '@utils/logger';

const execFileAsync = promisify(execFile);

export interface LyricSection {
  heading: string | null;
  lines: string[];
}

export class BhajanPdfService {
  private logoBase64: string = '';
  // In-memory cache: slug -> { buffer, hash }
  private pdfCache: Map<string, { buffer: Buffer; versionKey: string }> = new Map();

  constructor() {
    this.loadLogo();
  }

  private loadLogo() {
    try {
      const possibleLogoPaths = [
        path.join(process.cwd(), '../frontend/public/logo.png'),
        path.join(process.cwd(), 'public/logo.png'),
        path.join(__dirname, '../../../frontend/public/logo.png'),
        path.join(__dirname, '../../public/logo.png')
      ];

      for (const logoPath of possibleLogoPaths) {
        if (fs.existsSync(logoPath)) {
          this.logoBase64 = fs.readFileSync(logoPath).toString('base64');
          break;
        }
      }
    } catch (err: any) {
      logger.warn('Could not pre-load Aradhna Marg logo for PDF generator:', err.message);
    }
  }

  /**
   * Intelligently parses raw lyrics or rich HTML text into structured devotional sections.
   * Preserves exact words, punctuation, danda (॥), and formatting without mutation.
   */
  public parseLyrics(raw: string): LyricSection[] {
    if (!raw) return [];
    const cleanRaw = raw.trim();

    if (cleanRaw.includes('<')) {
      const normalized = cleanRaw
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<br\s*\/?>/gi, '\n');

      const blocks = normalized
        .split(/<\/?(?:h[1-6]|p|div)[^>]*>/gi)
        .map((b) => b.replace(/<[^>]*>/g, '').trim())
        .filter(Boolean);

      const sections: LyricSection[] = [];
      let currentSection: LyricSection = { heading: null, lines: [] };

      for (const block of blocks) {
        const isHeading =
          (block.startsWith('॥') && block.endsWith('॥') && block.length < 50) ||
          (block.startsWith('॥') && block.length < 35) ||
          /^॥\s*(?:मुखड़ा|अंतरा|प्रारंभिक|समापन|दोहा|चौपाई)/i.test(block);

        if (isHeading) {
          if (currentSection.lines.length > 0 || currentSection.heading) {
            sections.push(currentSection);
          }
          currentSection = { heading: block, lines: [] };
        } else {
          block.split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (trimmed) currentSection.lines.push(trimmed);
          });
        }
      }

      if (currentSection.lines.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      return sections;
    } else {
      const lines = cleanRaw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const sections: LyricSection[] = [];
      let currentSection: LyricSection = { heading: null, lines: [] };

      for (const line of lines) {
        const isHeading =
          (line.startsWith('॥') && line.endsWith('॥') && line.length < 50) ||
          (line.startsWith('॥') && line.length < 35) ||
          /^॥\s*(?:मुखड़ा|अंतरा|प्रारंभिक|समापन|दोहा|चौपाई)/i.test(line);

        if (isHeading) {
          if (currentSection.lines.length > 0 || currentSection.heading) {
            sections.push(currentSection);
          }
          currentSection = { heading: line, lines: [] };
        } else {
          currentSection.lines.push(line);
        }
      }

      if (currentSection.lines.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      return sections;
    }
  }

  /**
   * Resolves appropriate Hindi deity invocation only if deity is linked.
   * Does NOT invent a deity.
   */
  public getDeityInvocation(godName?: string | null): string | null {
    if (!godName || !godName.trim()) return null;
    const clean = godName.trim();
    const lower = clean.toLowerCase();

    if (lower.includes('krishna') || clean.includes('कृष्ण')) return '॥ श्री कृष्ण ॥';
    if (lower.includes('ram') || clean.includes('राम')) return '॥ श्री राम ॥';
    if (lower.includes('shiv') || clean.includes('शिव') || lower.includes('bholenath')) return '॥ श्री शिव ॥';
    if (lower.includes('hanuman') || clean.includes('हनुमान') || lower.includes('bajrangbali'))
      return '॥ श्री हनुमान ॥';
    if (lower.includes('ganesh') || clean.includes('गणेश') || lower.includes('vinayak')) return '॥ श्री गणेश ॥';
    if (lower.includes('durga') || clean.includes('दुर्गा') || lower.includes('ambe')) return '॥ माँ दुर्गा ॥';
    if (lower.includes('lakshmi') || clean.includes('लक्ष्मी')) return '॥ माँ लक्ष्मी ॥';
    if (lower.includes('saraswati') || clean.includes('सरस्वती')) return '॥ माँ सरस्वती ॥';
    if (lower.includes('vishnu') || clean.includes('विष्णु') || lower.includes('narayan')) return '॥ श्री हरि विष्णु ॥';
    if (lower.includes('sai') || clean.includes('साईं')) return '॥ साईं राम ॥';
    if (lower.includes('surya') || clean.includes('सूर्य')) return '॥ भगवान सूर्य ॥';
    if (lower.includes('shani') || clean.includes('शनि')) return '॥ श्री शनिदेव ॥';

    if (clean.startsWith('॥') && clean.endsWith('॥')) return clean;
    return `॥ ${clean} ॥`;
  }

  /**
   * Generates the devotional, production-grade PDF buffer for a Bhajan.
   */
  public async generateLyricsPdf(bhajan: {
    id: string;
    title: string;
    hindi_title?: string | null;
    english_title?: string | null;
    title_en?: string | null;
    slug: string;
    lyrics?: string | null;
    clean_lyrics?: string | null;
    god_name?: string | null;
    updated_at?: string | null;
  }): Promise<Buffer> {
    const rawLyrics = bhajan.lyrics || bhajan.clean_lyrics || '';
    if (!rawLyrics.trim()) {
      throw new Error('No lyrics available to generate PDF booklet');
    }

    const versionKey = `${bhajan.id}_${bhajan.updated_at || ''}_${rawLyrics.length}`;
    const cached = this.pdfCache.get(bhajan.slug);
    if (cached && cached.versionKey === versionKey) {
      return cached.buffer;
    }

    const sections = this.parseLyrics(rawLyrics);
    const deityInvocation = this.getDeityInvocation(bhajan.god_name);
    const hindiTitle = bhajan.hindi_title || bhajan.title;
    const transliteratedTitle = bhajan.title_en || bhajan.english_title || '';

    const htmlContent = this.buildHtmlDocument({
      hindiTitle,
      transliteratedTitle,
      deityInvocation,
      sections
    });

    const tempId = crypto.randomBytes(8).toString('hex');
    const tempHtmlPath = path.join(os.tmpdir(), `aradhna_bhajan_${tempId}.html`);
    const tempPdfPath = path.join(os.tmpdir(), `aradhna_bhajan_${tempId}.pdf`);

    try {
      fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

      // Use system Google Chrome headless Skia engine for flawless HarfBuzz Devanagari text shaping
      const chromePath = '/usr/bin/google-chrome';
      await execFileAsync(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=6000',
        '--print-to-pdf-no-header',
        `--print-to-pdf=${tempPdfPath}`,
        tempHtmlPath
      ]);

      if (!fs.existsSync(tempPdfPath)) {
        throw new Error('Chrome did not produce a PDF output file');
      }

      const pdfBuffer = fs.readFileSync(tempPdfPath);

      // Cache for safe subsequent downloads
      this.pdfCache.set(bhajan.slug, { buffer: pdfBuffer, versionKey });

      return pdfBuffer;
    } finally {
      try {
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
      } catch {
        // Ignore temporary file unlink cleanup errors
      }
    }
  }

  private buildHtmlDocument(data: {
    hindiTitle: string;
    transliteratedTitle?: string;
    deityInvocation: string | null;
    sections: LyricSection[];
  }): string {
    type RenderItem = { type: 'heading'; text: string } | { type: 'line'; text: string } | { type: 'divider' };

    // Flatten all sections into a continuous sequence of items
    const items: RenderItem[] = [];
    data.sections.forEach((sec, sIdx) => {
      if (sIdx > 0) {
        items.push({ type: 'divider' });
      }
      if (sec.heading) {
        items.push({ type: 'heading', text: sec.heading });
      }
      sec.lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) {
          items.push({ type: 'line', text: trimmed });
        }
      });
    });

    // Paginate continuously without boxes or artificial breaks
    // Large font size (22px): ~20 line units budget per page
    const MAX_UNITS_PER_PAGE = 21.0;
    const lyricsPages: RenderItem[][] = [];
    let currentPage: RenderItem[] = [];
    let currentUnits = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let cost = 1.0;
      if (item.type === 'heading') cost = 1.8;
      if (item.type === 'divider') cost = 1.2;

      // Never start a new page with a divider line
      if (currentPage.length === 0 && item.type === 'divider') {
        continue;
      }

      // Avoid orphan heading at the bottom of a page (require heading + at least 2 lines)
      const isOrphanHeading = item.type === 'heading' && currentUnits + cost + 2.0 > MAX_UNITS_PER_PAGE;

      if ((currentUnits + cost > MAX_UNITS_PER_PAGE && currentPage.length >= 4) || isOrphanHeading) {
        if (currentPage[currentPage.length - 1]?.type === 'divider') {
          currentPage.pop();
        }
        if (currentPage.length > 0) {
          lyricsPages.push(currentPage);
        }
        currentPage = [];
        currentUnits = 0;

        if (item.type === 'divider') {
          continue;
        }
      }

      currentPage.push(item);
      currentUnits += cost;
    }

    if (currentPage.length > 0) {
      if (currentPage[currentPage.length - 1]?.type === 'divider') {
        currentPage.pop();
      }
      lyricsPages.push(currentPage);
    }
    if (lyricsPages.length === 0) {
      lyricsPages.push([]);
    }

    return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>${data.hindiTitle} - Aradhna Marg</title>
  <meta name="author" content="Aradhna Marg">
  <meta name="subject" content="Bhajan Lyrics">
  <meta name="creator" content="Aradhna Marg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@400;500;600;700;800&family=Rozha+One&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #FFFDF9;
      color: #2D150B;
      font-family: 'Anek Devanagari', 'Noto Sans Devanagari', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    
    .sheet {
      width: 210mm;
      height: 297mm;
      position: relative;
      page-break-after: always;
      padding: 14mm 14mm 12mm 14mm;
      display: flex;
      flex-direction: column;
      background: #FFFDF9;
      overflow: hidden;
    }
    .sheet:last-child {
      page-break-after: auto;
    }
    
    /* Double Gold & Saffron Ornamental Border */
    .border-outer {
      position: absolute;
      top: 10mm;
      left: 10mm;
      right: 10mm;
      bottom: 10mm;
      border: 1.5px solid #D97706;
      border-radius: 12px;
      pointer-events: none;
    }
    .border-inner {
      position: absolute;
      top: 11.5mm;
      left: 11.5mm;
      right: 11.5mm;
      bottom: 11.5mm;
      border: 0.75px solid #FDE68A;
      border-radius: 9px;
      pointer-events: none;
    }
    
    /* Corner Ornaments */
    .corner-tl, .corner-tr, .corner-bl, .corner-br {
      position: absolute;
      width: 14px;
      height: 14px;
      border-color: #B45309;
      border-style: solid;
      pointer-events: none;
    }
    .corner-tl { top: 12.5mm; left: 12.5mm; border-width: 2px 0 0 2px; }
    .corner-tr { top: 12.5mm; right: 12.5mm; border-width: 2px 2px 0 0; }
    .corner-bl { bottom: 12.5mm; left: 12.5mm; border-width: 0 0 2px 2px; }
    .corner-br { bottom: 12.5mm; right: 12.5mm; border-width: 0 2px 2px 0; }

    /* Subtle Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 58px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #9A3412;
      opacity: 0.032;
      white-space: nowrap;
      pointer-events: none;
      font-family: 'Anek Devanagari', sans-serif;
      z-index: 1;
    }
    
    .content-wrap {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* COVER PAGE STYLES */
    .cover-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      text-align: center;
      padding: 18mm 10mm 10mm 10mm;
    }
    .cover-top {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .emblem-img {
      width: 82px;
      height: 82px;
      object-fit: contain;
      margin-bottom: 12px;
      filter: drop-shadow(0 4px 10px rgba(217, 119, 6, 0.25));
    }
    .brand-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #7C2D12;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #D97706;
      text-transform: uppercase;
    }
    .divider-cover {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 18px 0;
      color: #D97706;
      font-size: 13px;
      opacity: 0.85;
    }
    .divider-cover::before, .divider-cover::after {
      content: '';
      display: block;
      width: 50px;
      height: 1px;
      background: linear-gradient(to right, transparent, #D97706, transparent);
    }
    
    .cover-mid {
      margin: auto 0;
      max-width: 160mm;
    }
    .cover-bhajan-title {
      font-family: 'Rozha One', 'Anek Devanagari', serif;
      font-size: 32px;
      line-height: 1.35;
      color: #431407;
      margin-bottom: 12px;
    }
    .cover-bhajan-en {
      font-size: 14px;
      font-weight: 600;
      color: #7C2D12;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
    }
    .cover-tag {
      display: inline-block;
      background: #FFF7ED;
      border: 1px solid #FED7AA;
      color: #C2410C;
      font-size: 14px;
      font-weight: 700;
      padding: 6px 20px;
      border-radius: 9999px;
      margin-bottom: 18px;
    }
    .cover-subtitle {
      font-size: 14px;
      color: #78350F;
      font-style: italic;
      line-height: 1.6;
    }
    
    .cover-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding-top: 15px;
      border-top: 1px solid #FED7AA;
      width: 100%;
      max-width: 120mm;
    }
    .cover-footer-text {
      font-size: 12px;
      font-weight: 700;
      color: #7C2D12;
      letter-spacing: 1px;
    }
    .cover-footer-url {
      font-size: 10px;
      color: #9A3412;
      letter-spacing: 0.5px;
    }

    /* LYRICS PAGE STYLES */
    .page-header {
      text-align: center;
      margin-bottom: 16px;
      position: relative;
      border-bottom: 1px solid #FED7AA;
      padding-bottom: 10px;
    }
    .deity-invoc {
      display: inline-block;
      font-family: 'Rozha One', serif;
      font-size: 18px;
      color: #9A3412;
      letter-spacing: 1.5px;
      background: #FFF7ED;
      padding: 3px 20px;
      border-radius: 9999px;
      border: 1px solid #FED7AA;
      margin-bottom: 6px;
    }
    .page-title {
      font-family: 'Rozha One', 'Anek Devanagari', serif;
      font-size: 26px;
      color: #431407;
      line-height: 1.35;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .page-subtitle-en {
      font-size: 14px;
      font-weight: 600;
      color: #9A3412;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .page-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #D97706;
      font-size: 13px;
      margin: 4px 0 0 0;
    }
    .page-divider::before, .page-divider::after {
      content: '';
      display: inline-block;
      width: 50px;
      height: 1px;
      background: #FED7AA;
    }

    /* Continuous Lyrics Flow - No boxes, large devotional typography */
    .lyrics-flow {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      margin-bottom: 4mm;
    }
    .section-title {
      font-family: 'Rozha One', 'Anek Devanagari', serif;
      font-size: 25px;
      color: #C2410C;
      font-weight: 700;
      text-align: center;
      margin-top: 18px;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .lyrics-flow > .section-title:first-child {
      margin-top: 4px;
    }
    .lyric-line {
      font-size: 22px;
      line-height: 1.8;
      color: #2D150B;
      font-weight: 500;
      text-align: center;
      margin: 0;
      padding: 1px 0;
      width: 100%;
    }
    .antra-divider {
      width: 80%;
      max-width: 480px;
      height: 2px;
      margin: 22px auto 16px auto;
      background: linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.45) 20%, #F59E0B 50%, rgba(245, 158, 11, 0.45) 80%, transparent 100%);
      border-radius: 9999px;
    }

    /* Page Footer */
    .page-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #FED7AA;
      padding-top: 8px;
      font-size: 10px;
      color: #9A3412;
      font-weight: 600;
    }
    .page-footer-left {
      letter-spacing: 0.5px;
    }
    .page-num {
      font-family: 'Courier New', monospace;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: COVER PAGE -->
  <div class="sheet">
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="corner-tl"></div>
    <div class="corner-tr"></div>
    <div class="corner-bl"></div>
    <div class="corner-br"></div>
    <div class="watermark">ARADHNA MARG</div>
    
    <div class="content-wrap">
      <div class="cover-body">
        <div class="cover-top">
          ${
            this.logoBase64
              ? `<img src="data:image/png;base64,${this.logoBase64}" class="emblem-img" alt="Aradhna Marg">`
              : `<div style="font-size: 42px; color: #EA580C; margin-bottom: 8px;">ॐ</div>`
          }
          <div class="brand-name">ARADHNA MARG</div>
          <div class="brand-sub">SANATAN DHARMA</div>
          <div class="divider-cover">✦</div>
        </div>

        <div class="cover-mid">
          <h1 class="cover-bhajan-title">${data.hindiTitle}</h1>
          ${data.transliteratedTitle ? `<div class="cover-bhajan-en">${data.transliteratedTitle}</div>` : ''}
          <div class="cover-tag">(भजन) लिरिक्स</div>
          <div class="cover-subtitle">"दिव्य भजनों और आरतियों का पावन संग्रह"</div>
        </div>

        <div class="cover-bottom">
          <div class="cover-footer-text">आराधना मार्ग • सनातन ज्ञान एवं भक्ति संकलन</div>
          <div class="cover-footer-url">www.aradhnamarg.com</div>
        </div>
      </div>
      
      <div class="page-footer" style="border: none; padding-top: 0;">
        <div></div>
        <div class="page-num">Page 1</div>
      </div>
    </div>
  </div>

  <!-- LYRICS PAGES -->
  ${lyricsPages
    .map((pageItems, pIdx) => {
      const pageNum = pIdx + 2;
      return `
  <div class="sheet">
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="corner-tl"></div>
    <div class="corner-tr"></div>
    <div class="corner-bl"></div>
    <div class="corner-br"></div>
    <div class="watermark">ARADHNA MARG</div>

    <div class="content-wrap">
      <div class="page-header">
        ${data.deityInvocation ? `<div class="deity-invoc">${data.deityInvocation}</div>` : ''}
        <h2 class="page-title">${data.hindiTitle} (भजन) लिरिक्स</h2>
        ${data.transliteratedTitle ? `<div class="page-subtitle-en">${data.transliteratedTitle}</div>` : ''}
        <div class="page-divider">✦</div>
      </div>

      <div class="lyrics-flow">
        ${pageItems
          .map((item) => {
            if (item.type === 'heading') {
              return `<div class="section-title">${item.text}</div>`;
            }
            if (item.type === 'divider') {
              return `<div class="antra-divider"></div>`;
            }
            return `<p class="lyric-line">${item.text}</p>`;
          })
          .join('')}
      </div>

      <div class="page-footer">
        <div class="page-footer-left">आराधना मार्ग • aradhnamarg.com</div>
        <div class="page-num">Page ${pageNum}</div>
      </div>
    </div>
  </div>`;
    })
    .join('')}

</body>
</html>`;
  }
}

export const bhajanPdfService = new BhajanPdfService();
