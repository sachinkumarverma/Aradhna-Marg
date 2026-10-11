import { toolRegistry } from '../registry/ToolRegistry';
import { getContentItemTool } from './content/GetContentItemTool';
import { searchContentTool } from './content/SearchContentTool';
import { getSeoAuditTool } from './seo/GetSeoAuditTool';
import { getSeoContentBatchTool } from './seo/GetSeoContentBatchTool';
import { proposeSeoMetadataTool } from './seo/ProposeSeoMetadataTool';
import { applyBhajanSeoMetadataTool } from './seo/ApplyBhajanSeoMetadataTool';
import { applyArticleSeoMetadataTool } from './seo/ApplyArticleSeoMetadataTool';
import { applyFestivalSeoMetadataTool } from './seo/ApplyFestivalSeoMetadataTool';
import { applyPuranSeoMetadataTool } from './seo/ApplyPuranSeoMetadataTool';
import { applyCategorySeoMetadataTool } from './seo/ApplyCategorySeoMetadataTool';
import { proposeBhajanMeaningTool } from './bhajan/ProposeBhajanMeaningTool';
import { applyBhajanMeaningTool } from './bhajan/ApplyBhajanMeaningTool';
import { getSystemHealthTool } from './ops/GetSystemHealthTool';
import { retryFailedJobTool } from './ops/RetryFailedJobTool';

// Phase 4C: Content Quality & Improvement Tools
import { proposeArticleContentImprovementTool } from './content/ProposeArticleContentImprovementTool';
import { proposeFestivalContentImprovementTool } from './content/ProposeFestivalContentImprovementTool';
import { proposePuranDescriptionImprovementTool } from './content/ProposePuranDescriptionImprovementTool';
import { proposeBhajanDescriptionImprovementTool } from './content/ProposeBhajanDescriptionImprovementTool';
import { applyArticleContentFieldTool } from './content/ApplyArticleContentFieldTool';
import { applyFestivalContentFieldTool } from './content/ApplyFestivalContentFieldTool';
import { applyPuranDescriptionTool } from './content/ApplyPuranDescriptionTool';
import { applyBhajanDescriptionTool } from './content/ApplyBhajanDescriptionTool';

export function registerDefaultTools(): void {
  toolRegistry.register(getContentItemTool);
  toolRegistry.register(searchContentTool);
  toolRegistry.register(getSeoAuditTool);
  toolRegistry.register(getSeoContentBatchTool);
  toolRegistry.register(proposeSeoMetadataTool);
  toolRegistry.register(applyBhajanSeoMetadataTool);
  toolRegistry.register(applyArticleSeoMetadataTool);
  toolRegistry.register(applyFestivalSeoMetadataTool);
  toolRegistry.register(applyPuranSeoMetadataTool);
  toolRegistry.register(applyCategorySeoMetadataTool);
  toolRegistry.register(proposeBhajanMeaningTool);
  toolRegistry.register(applyBhajanMeaningTool);
  toolRegistry.register(getSystemHealthTool);
  toolRegistry.register(retryFailedJobTool);

  // Phase 4C Tools
  toolRegistry.register(proposeArticleContentImprovementTool);
  toolRegistry.register(proposeFestivalContentImprovementTool);
  toolRegistry.register(proposePuranDescriptionImprovementTool);
  toolRegistry.register(proposeBhajanDescriptionImprovementTool);
  toolRegistry.register(applyArticleContentFieldTool);
  toolRegistry.register(applyFestivalContentFieldTool);
  toolRegistry.register(applyPuranDescriptionTool);
  toolRegistry.register(applyBhajanDescriptionTool);
}

// Automatically register defaults upon module load
registerDefaultTools();

export {
  getContentItemTool,
  searchContentTool,
  getSeoAuditTool,
  getSeoContentBatchTool,
  proposeSeoMetadataTool,
  applyBhajanSeoMetadataTool,
  applyArticleSeoMetadataTool,
  applyFestivalSeoMetadataTool,
  applyPuranSeoMetadataTool,
  applyCategorySeoMetadataTool,
  proposeBhajanMeaningTool,
  applyBhajanMeaningTool,
  getSystemHealthTool,
  retryFailedJobTool,
  // Phase 4C Exports
  proposeArticleContentImprovementTool,
  proposeFestivalContentImprovementTool,
  proposePuranDescriptionImprovementTool,
  proposeBhajanDescriptionImprovementTool,
  applyArticleContentFieldTool,
  applyFestivalContentFieldTool,
  applyPuranDescriptionTool,
  applyBhajanDescriptionTool
};
