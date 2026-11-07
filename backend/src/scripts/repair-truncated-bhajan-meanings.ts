import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { db } from '../common/database/DatabaseClient';
import { getAiProvider, AiRateLimitError } from '../admin/services/ai/AiProvider';
import { AiPrompts } from '../admin/services/ai/AiPrompts';
import { cleanDevotionalMeaning, translateMeaningToEnglish } from '../admin/services/ai/AiWorker';
import { bhajanRepository } from '../features/bhajans/BhajanRepository';
import { logger } from '../utils/logger';

function isHindiMeaningTruncated(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < 50) return true;

  // Check if text does NOT end with Hindi/English sentence terminators
  // Accounting for possible trailing bold markers, quotes, or whitespace
  const endsWithTerminator = /[।!?.]["'”’)]*(\*\*)?$/.test(trimmed);
  if (!endsWithTerminator) return true;

  // Check for common truncated patterns like "**भ", "साधक को **", trailing hyphen/dash
  if (/(\*\*[\u0900-\u097F]{1,2}$|[-–—]\s*$)/.test(trimmed)) {
    return true;
  }

  return false;
}

function isEnglishMeaningTruncated(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < 50) return true;

  const endsWithTerminator = /[.!?]["'”’)]*(\*\*)?$/.test(trimmed);
  if (!endsWithTerminator) return true;

  if (/(\*\*[a-zA-Z]{1,2}$|[-–—]\s*$)/.test(trimmed)) {
    return true;
  }

  return false;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg = 'Operation timed out'): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))]);
}

async function repairTruncatedMeanings() {
  console.log(`=======================================================`);
  console.log(`🕉️  Aradhna Marg - Bhajan Meaning Truncation Repair`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`=======================================================\n`);

  const provider = getAiProvider();

  // 1. Fetch all bhajans with an existing meaning
  const res = await db.query(`
    SELECT id, title, lyrics, description, description_en, short_description, short_description_en
    FROM bhajans
    WHERE deleted_at IS NULL
    ORDER BY title ASC
  `);

  const allBhajans = res.rows;
  console.log(`📋 Total bhajans in database: ${allBhajans.length}`);

  // 2. Identify bhajans that need repair
  const toRepair = allBhajans.filter((b) => {
    return isHindiMeaningTruncated(b.description) || isEnglishMeaningTruncated(b.description_en);
  });

  console.log(`🔍 Found ${toRepair.length} bhajans with truncated or incomplete meanings.\n`);

  if (toRepair.length === 0) {
    console.log(`✅ All bhajan meanings are complete and healthy! Nothing to repair.`);
    process.exit(0);
  }

  let successCount = 0;
  let failCount = 0;
  let consecutiveFailures = 0;

  for (let i = 0; i < toRepair.length; i++) {
    const b = toRepair[i];
    const indexLabel = `[${i + 1}/${toRepair.length}]`;
    console.log(`${indexLabel} Repairing: "${b.title}" (ID: ${b.id})...`);

    try {
      // 1. If existing short_description is already complete and healthy, sync it directly
      const shortHiValid = !isHindiMeaningTruncated(b.short_description);
      const shortEnValid = !isEnglishMeaningTruncated(b.short_description_en);

      if (shortHiValid && shortEnValid) {
        await bhajanRepository.updateAiMeaning(b.id, b.short_description, b.short_description_en || undefined);
        console.log(`   ⚡ Synced directly from existing verified short_description! (0 tokens consumed)`);
        successCount++;
        consecutiveFailures = 0;
        continue;
      }

      // 2. If Hindi is ALREADY complete, only English is broken -> 0 Groq tokens! Only translate to English!
      const hiNeedsRepair = isHindiMeaningTruncated(b.description);
      const enNeedsRepair = isEnglishMeaningTruncated(b.description_en);

      if (!hiNeedsRepair && enNeedsRepair) {
        console.log(`   🌐 Hindi is already complete! Translating only English (0 Groq tokens consumed)...`);
        let englishMeaning = await translateMeaningToEnglish(b.description, provider);
        if (englishMeaning && !/[.!?]["'”’)]*(\*\*)?$/.test(englishMeaning.trim())) {
          englishMeaning = englishMeaning.endsWith('**')
            ? englishMeaning.slice(0, -2).trim() + '.**'
            : englishMeaning + '.';
        }
        await bhajanRepository.updateAiMeaning(b.id, b.description, englishMeaning || undefined);
        console.log(`   ✅ Success! English repaired: ${englishMeaning?.length || 0} chars`);
        successCount++;
        consecutiveFailures = 0;
        await sleep(500);
        continue;
      }

      await withTimeout(
        (async () => {
          // 2. Generate full Hindi meaning with 1500 tokens
          const promptPayload = AiPrompts.bhajanMeaning({
            title: b.title,
            lyrics: b.lyrics,
            description: b.description
          });

          const rawMeaning = await provider.generateCompletion(promptPayload);
          let cleanedHindi = cleanDevotionalMeaning(rawMeaning);

          if (!cleanedHindi || cleanedHindi.length < 50) {
            throw new Error('Generated Hindi meaning was empty or too short');
          }

          // Ensure Hindi concludes with proper sentence terminator
          if (!/[।!?.]["'”’)]*(\*\*)?$/.test(cleanedHindi.trim())) {
            if (cleanedHindi.endsWith('**')) {
              cleanedHindi = cleanedHindi.slice(0, -2).trim() + '।**';
            } else {
              cleanedHindi = cleanedHindi + '।';
            }
          }

          // 3. Translate meaning to English with generous token budget
          let englishMeaning = await translateMeaningToEnglish(cleanedHindi, provider);
          if (englishMeaning && !/[.!?]["'”’)]*(\*\*)?$/.test(englishMeaning.trim())) {
            if (englishMeaning.endsWith('**')) {
              englishMeaning = englishMeaning.slice(0, -2).trim() + '.**';
            } else {
              englishMeaning = englishMeaning + '.';
            }
          }

          // 4. Persist to database (updates both short_description and description)
          await bhajanRepository.updateAiMeaning(b.id, cleanedHindi, englishMeaning || undefined);

          console.log(
            `   ✅ Success! Hindi length: ${cleanedHindi.length} chars | English length: ${englishMeaning?.length || 0} chars`
          );
        })(),
        45000,
        `Processing timed out after 45s for "${b.title}"`
      );

      successCount++;
      consecutiveFailures = 0;
      // Pause to respect API rate limits
      await sleep(1500);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isRateLimit =
        err instanceof AiRateLimitError ||
        err?.name === 'AiRateLimitError' ||
        err?.status === 429 ||
        errMsg.includes('Rate limit reached') ||
        errMsg.includes('rate_limit_exceeded') ||
        errMsg.includes('TPD');

      if (isRateLimit) {
        console.error(`\n🛑 [RATE LIMIT DETECTED] ${errMsg}`);
        console.error(`🛑 Halting batch execution immediately to prevent server hanging and API quota exhaustion.`);
        break; // Stop immediately, do not keep iterating!
      }

      console.error(`   ❌ Failed for "${b.title}": ${errMsg}`);
      failCount++;
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        console.error(`\n🛑 3 consecutive failures encountered. Halting script to prevent continuous iteration.`);
        break;
      }
      await sleep(2000);
    }
  }

  console.log(`\n=======================================================`);
  console.log(`🎉 Repair Completed!`);
  console.log(`   Total Processed: ${toRepair.length}`);
  console.log(`   Successfully Repaired: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`=======================================================`);
}

repairTruncatedMeanings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during repair execution:', err);
    process.exit(1);
  });
