import { toolRegistry } from '../registry/ToolRegistry';
import { getContentItemTool } from './content/GetContentItemTool';
import { searchContentTool } from './content/SearchContentTool';
import { getSeoAuditTool } from './seo/GetSeoAuditTool';
import { getSeoContentBatchTool } from './seo/GetSeoContentBatchTool';
import { proposeSeoMetadataTool } from './seo/ProposeSeoMetadataTool';
import { proposeBhajanMeaningTool } from './bhajan/ProposeBhajanMeaningTool';
import { applyBhajanMeaningTool } from './bhajan/ApplyBhajanMeaningTool';
import { getSystemHealthTool } from './ops/GetSystemHealthTool';
import { retryFailedJobTool } from './ops/RetryFailedJobTool';

export function registerDefaultTools(): void {
  toolRegistry.register(getContentItemTool);
  toolRegistry.register(searchContentTool);
  toolRegistry.register(getSeoAuditTool);
  toolRegistry.register(getSeoContentBatchTool);
  toolRegistry.register(proposeSeoMetadataTool);
  toolRegistry.register(proposeBhajanMeaningTool);
  toolRegistry.register(applyBhajanMeaningTool);
  toolRegistry.register(getSystemHealthTool);
  toolRegistry.register(retryFailedJobTool);
}

// Automatically register defaults upon module load
registerDefaultTools();

export {
  getContentItemTool,
  searchContentTool,
  getSeoAuditTool,
  getSeoContentBatchTool,
  proposeSeoMetadataTool,
  proposeBhajanMeaningTool,
  applyBhajanMeaningTool,
  getSystemHealthTool,
  retryFailedJobTool
};
