/**
 * Layout component with header
 */

import React, { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-lighter">
      <Header />
      <main>{children}</main>
    </div>
  );
};
