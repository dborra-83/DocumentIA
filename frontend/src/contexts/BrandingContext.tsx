/**
 * Branding Context - Manages white-label configuration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BrandingConfig {
  appName: string;
  appTagline: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

interface BrandingContextType {
  config: BrandingConfig;
  updateConfig: (newConfig: Partial<BrandingConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: BrandingConfig = {
  appName: 'DocumentIA',
  appTagline: 'AI-Powered Document Analysis',
  logoUrl: null,
  primaryColor: '#008FD0', // bright-blue
  secondaryColor: '#0A1732', // navy-blue
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<BrandingConfig>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('brandingConfig');
    if (saved) {
      try {
        return { ...defaultConfig, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse branding config:', e);
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('brandingConfig', JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig: Partial<BrandingConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('brandingConfig');
  };

  return (
    <BrandingContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
