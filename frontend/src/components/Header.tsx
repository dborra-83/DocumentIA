/**
 * Header component with navigation and user menu
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../contexts/BrandingContext';
import { useLanguage } from '../contexts/LanguageContext';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { config } = useBranding();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-navy-blue text-white shadow-lg border-b border-navy-dark/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.appName} className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-bright-blue to-turquoise rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            <span className="text-xl font-bold">
              {config.appName}
            </span>
          </Link>

          {/* Navigation */}
          {isAuthenticated && (
            <nav className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  isActive('/dashboard')
                    ? 'bg-bright-blue text-white shadow-md'
                    : 'text-gray-300 hover:bg-navy-dark hover:text-white'
                }`}
              >
                {t('header.dashboard')}
              </Link>
              <Link
                to="/analyze"
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  isActive('/analyze')
                    ? 'bg-bright-blue text-white shadow-md'
                    : 'text-gray-300 hover:bg-navy-dark hover:text-white'
                }`}
              >
                {t('header.analyze')}
              </Link>
              <Link
                to="/history"
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  isActive('/history')
                    ? 'bg-bright-blue text-white shadow-md'
                    : 'text-gray-300 hover:bg-navy-dark hover:text-white'
                }`}
              >
                {t('header.history')}
              </Link>
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  isActive('/admin')
                    ? 'bg-bright-blue text-white shadow-md'
                    : 'text-gray-300 hover:bg-navy-dark hover:text-white'
                }`}
              >
                {t('header.admin')}
              </Link>
            </nav>
          )}

          {/* User menu */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet to-pink rounded-full flex items-center justify-center text-sm font-semibold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-300 hidden md:block">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-navy-dark hover:bg-coral text-white rounded-lg transition-all text-sm font-medium"
              >
                {t('header.logout')}
              </button>
            </div>
          )}

          {/* Login/Register for non-authenticated users */}
          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-300 hover:bg-navy-dark hover:text-white rounded-lg transition-all"
              >
                {t('login.title')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-bright-blue hover:bg-turquoise text-white rounded-lg transition-all font-medium"
              >
                {t('register.title')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
