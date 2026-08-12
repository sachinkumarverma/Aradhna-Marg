import React, { type ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';

interface SEOProviderProps {
  children: ReactNode;
}

export const SEOProvider: React.FC<SEOProviderProps> = ({ children }) => {
  return <HelmetProvider>{children}</HelmetProvider>;
};
