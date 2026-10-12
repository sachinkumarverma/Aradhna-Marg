import React from 'react';
import { ProposalDetailDrawer, type ProposalDetailDrawerProps } from './ProposalDetailDrawer';

export type ProposalDetailModalProps = ProposalDetailDrawerProps;

/**
 * Backward compatibility alias for ProposalDetailDrawer.
 */
export const ProposalDetailModal: React.FC<ProposalDetailModalProps> = (props) => {
  return <ProposalDetailDrawer {...props} />;
};

export default ProposalDetailModal;
