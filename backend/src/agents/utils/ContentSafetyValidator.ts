/**
 * Content Safety & Quality Validator
 *
 * Provides robust, HTML-aware content measurement, substance retention evaluation,
 * and safety guardrails to protect long-form devotional content against:
 * 1. Catastrophic content reduction (e.g. ~21k chars -> ~125 chars)
 * 2. Accidental summarization into brief generic paragraphs
 * 3. Stripping of structural elements (headings, sections, paragraphs)
 * 4. Fabrication of generic devotional boilerplate
 *
 * Constitutional Precedence: AGENTS.md, ADR 006, ADR 007
 */

export interface ContentMetrics {
  rawLength: number;
  plainTextLength: number;
  wordCount: number;
  headingCount: number;
  paragraphCount: number;
}

export interface ContentValidationResult {
  isValid: boolean;
  reason?: string;
  originalMetrics?: ContentMetrics;
  proposedMetrics?: ContentMetrics;
  retentionRatio?: number;
}

export class ContentSafetyValidator {
  /**
   * Minimum retention ratio of meaningful plain-text characters required for long-form content.
   * A value of 0.70 means proposed content must retain at least 70% of the original substantive length.
   * Legitimate copy-editing/grammar polish typically retains 90-98% of length.
   * Catastrophic reductions (e.g. 21,000 -> 125 chars = 0.58%) are permanently blocked.
   */
  public static readonly MIN_LONG_FORM_RETENTION_RATIO = 0.7;

  /**
   * Threshold above which content is treated as long-form depth requiring strict retention.
   */
  public static readonly LONG_FORM_TEXT_THRESHOLD_CHARS = 400;

  /**
   * Known generic devotional boilerplate phrases that signify fallback fabrication or total loss of topic.
   */
  private static readonly GENERIC_BOILERPLATE_PATTERNS = [
    /यह पावन सामग्री साधक को आत्म-चिंतन और प्रभु के दिव्य प्रेम की ओर प्रेरित करती है/i,
    /यह पावन आलेख\/विवरण .* की महिमा और आध्यात्मिक सार को श्रद्धापूर्वक प्रस्तुत करता है/i,
    /This holy text guides the seeker towards spiritual awakening and inner devotion/i,
    /Authentic devotional treatise exploring the glory of/i
  ];

  /**
   * Strips HTML tags and decodes common HTML entities to measure substantive rendered text.
   */
  public static extractPlainText(htmlOrText?: string): string {
    if (!htmlOrText) return '';

    return (
      htmlOrText
        // Replace breaks and paragraphs with spaces
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<\/div>/gi, ' ')
        // Strip all remaining HTML tags
        .replace(/<[^>]+>/g, ' ')
        // Decode HTML entities
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&mdash;/gi, '—')
        .replace(/&ndash;/gi, '–')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * Measures content dimensions distinguishing raw HTML from substantive plain text, words, and structure.
   */
  public static measureContent(content?: string): ContentMetrics {
    if (!content) {
      return {
        rawLength: 0,
        plainTextLength: 0,
        wordCount: 0,
        headingCount: 0,
        paragraphCount: 0
      };
    }

    const plainText = this.extractPlainText(content);
    const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];

    // Count headings (<h1-6>)
    const headingMatches = content.match(/<h[1-6][^>]*>/gi) || [];

    // Count paragraphs (<p>) or double line breaks
    const pTagMatches = content.match(/<p[^>]*>/gi) || [];
    const doubleNewlineMatches = content.split(/\n\s*\n/).filter(Boolean);
    const paragraphCount = Math.max(pTagMatches.length, doubleNewlineMatches.length, plainText ? 1 : 0);

    return {
      rawLength: content.length,
      plainTextLength: plainText.length,
      wordCount: words.length,
      headingCount: headingMatches.length,
      paragraphCount
    };
  }

  /**
   * Determines if a field represents long-form substantive text.
   */
  public static isLongFormField(entityType: string, field: string): boolean {
    const normType = (entityType || '').toLowerCase();
    const normField = (field || '').toLowerCase();

    if (
      (normType === 'article' || normType === 'festival') &&
      (normField === 'content' || normField === 'content_en')
    ) {
      return true;
    }
    return false;
  }

  /**
   * Validates a proposed content improvement against the original content to prevent catastrophic loss of substance.
   */
  public static validateContentImprovement(options: {
    entityType: string;
    targetField: string;
    originalContent?: string;
    proposedContent?: string;
  }): ContentValidationResult {
    const { entityType, targetField, originalContent = '', proposedContent = '' } = options;

    const originalMetrics = this.measureContent(originalContent);
    const proposedMetrics = this.measureContent(proposedContent);

    // 1. Basic non-empty check
    if (proposedMetrics.plainTextLength < 10) {
      return {
        isValid: false,
        reason: `Proposed content is empty or trivially short (${proposedMetrics.plainTextLength} characters).`,
        originalMetrics,
        proposedMetrics
      };
    }

    // 2. Generic devotional boilerplate detection
    for (const pattern of this.GENERIC_BOILERPLATE_PATTERNS) {
      if (pattern.test(proposedContent.trim())) {
        if (originalMetrics.plainTextLength > this.LONG_FORM_TEXT_THRESHOLD_CHARS) {
          return {
            isValid: false,
            reason: `Proposed content was flagged as generic placeholder boilerplate without informational substance.`,
            originalMetrics,
            proposedMetrics
          };
        }
      }
    }

    // 3. Long-Form Content Safety Boundary
    if (this.isLongFormField(entityType, targetField)) {
      // If the original has substantive length (>= 400 plain text chars)
      if (originalMetrics.plainTextLength >= this.LONG_FORM_TEXT_THRESHOLD_CHARS) {
        const retentionRatio = proposedMetrics.plainTextLength / originalMetrics.plainTextLength;

        // 3a. Catastrophic length reduction check (Must retain at least 70% of plain text)
        if (retentionRatio < this.MIN_LONG_FORM_RETENTION_RATIO) {
          const reductionPercent = ((1 - retentionRatio) * 100).toFixed(1);
          return {
            isValid: false,
            reason: `Long-form content safety violation: Proposed content is ${reductionPercent}% shorter than original. Substantive content retention ratio (${(retentionRatio * 100).toFixed(1)}%) is below required ${this.MIN_LONG_FORM_RETENTION_RATIO * 100}% (Original: ${originalMetrics.plainTextLength} plain text chars, Proposed: ${proposedMetrics.plainTextLength} chars).`,
            originalMetrics,
            proposedMetrics,
            retentionRatio
          };
        }

        // 3b. Word count retention check
        if (originalMetrics.wordCount >= 80 && proposedMetrics.wordCount < originalMetrics.wordCount * 0.65) {
          return {
            isValid: false,
            reason: `Long-form content safety violation: Word count reduced significantly from ${originalMetrics.wordCount} words to ${proposedMetrics.wordCount} words.`,
            originalMetrics,
            proposedMetrics,
            retentionRatio
          };
        }

        // 3c. Structural Heading Preservation check
        // If original had 2 or more structural headings, proposed content must not strip all headings
        if (originalMetrics.headingCount >= 2 && proposedMetrics.headingCount === 0) {
          return {
            isValid: false,
            reason: `Long-form content safety violation: Proposed content stripped all ${originalMetrics.headingCount} structural headings (<h2>/<h3>). Heading structure must be preserved.`,
            originalMetrics,
            proposedMetrics,
            retentionRatio
          };
        }

        // 3d. Multi-paragraph collapse check
        if (
          originalMetrics.paragraphCount >= 4 &&
          proposedMetrics.paragraphCount <= 1 &&
          proposedMetrics.plainTextLength < originalMetrics.plainTextLength * 0.85
        ) {
          return {
            isValid: false,
            reason: `Long-form content safety violation: Multiple substantive paragraphs (${originalMetrics.paragraphCount}) were flattened into a single block.`,
            originalMetrics,
            proposedMetrics,
            retentionRatio
          };
        }
      } else {
        // Original was short or empty — ensure proposed content has meaningful depth
        if (proposedMetrics.plainTextLength < 50) {
          return {
            isValid: false,
            reason: `Proposed long-form content is too brief (${proposedMetrics.plainTextLength} characters). Minimum 50 characters required.`,
            originalMetrics,
            proposedMetrics
          };
        }
      }
    } else {
      // 4. Short-Form Fields (excerpt, short_description, description)
      const normField = targetField.toLowerCase();
      if (normField.includes('excerpt')) {
        if (proposedMetrics.plainTextLength > 1500) {
          return {
            isValid: false,
            reason: `Proposed excerpt exceeds maximum recommended summary length (${proposedMetrics.plainTextLength} characters).`,
            originalMetrics,
            proposedMetrics
          };
        }
      }
    }

    return {
      isValid: true,
      originalMetrics,
      proposedMetrics,
      retentionRatio:
        originalMetrics.plainTextLength > 0 ? proposedMetrics.plainTextLength / originalMetrics.plainTextLength : 1
    };
  }
}
