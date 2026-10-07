import React from 'react';
import { SEOHead, type SEOHeadProps } from './SEOHead';

export type MetaManagerProps = SEOHeadProps;

export const MetaManager: React.FC<MetaManagerProps> = (props) => {
  return <SEOHead {...props} />;
};

export { SEOHead };
