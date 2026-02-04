/**
 * Debug page to check authentication state and clear session
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

export const DebugPage: React.FC = () => {
  const { user, tokens, isAuthenticated, isLoading, logout } = useAuth();
  const [message, setMessage] = React.useState<string | null>(null);

  const handleClearSession = async () => {
    try {
      await logout();
      // Also clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      setMessage('Session cleared! Please refresh the page.');
    } catch (error) {
      setMessage('Error clearing session: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    setMessage('Storage cleared! Please refresh the page.');
  };

  return (
    <div className="container p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-dark mb-6">Debug - Authentication State</h1>

      {message && (
        <div className="mb-6">
          <Alert variant="info">{message}</Alert>
        </div>
      )}

      <div className="space-y-6">
        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-light p-6">
          <h2 className="text-xl font-bold text-gray-dark mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Is Authenticated:</span>{' '}
              <span className={isAuthenticated ? 'text-green' : 'text-red'}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </span>
            </p>
            <p>
              <span className="font-medium">Is Loading:</span>{' '}
              <span>{isLoading ? '⏳ Yes' : '✅ No'}</span>
            </p>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-light p-6">
            <h2 className="text-xl font-bold text-gray-dark mb-4">User Information</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">ID:</span> {user.id}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Username:</span> {user.username}
              </p>
            </div>
          </div>
        )}

        {/* Tokens */}
        {tokens && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-light p-6">
            <h2 className="text-xl font-bold text-gray-dark mb-4">Tokens</h2>
            <div className="space-y-2">
              <div>
                <p className="font-medium">ID Token:</p>
                <p className="text-xs text-gray break-all">{tokens.idToken.substring(0, 100)}...</p>
              </div>
              <div>
                <p className="font-medium">Access Token:</p>
                <p className="text-xs text-gray break-all">{tokens.accessToken.substring(0, 100)}...</p>
              </div>
              <div>
                <p className="font-medium">Refresh Token:</p>
                <p className="text-xs text-gray break-all">{tokens.refreshToken.substring(0, 100)}...</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-light p-6">
          <h2 className="text-xl font-bold text-gray-dark mb-4">Actions</h2>
          <div className="space-y-3">
            <div>
              <Button variant="secondary" onClick={handleClearSession} fullWidth>
                Clear Session (Logout)
              </Button>
              <p className="text-sm text-gray mt-1">
                Logs out the current user and clears Cognito session
              </p>
            </div>
            <div>
              <Button variant="outline" onClick={handleClearStorage} fullWidth>
                Clear All Storage
              </Button>
              <p className="text-sm text-gray mt-1">
                Clears localStorage and sessionStorage (nuclear option)
              </p>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-light p-6">
          <h2 className="text-xl font-bold text-gray-dark mb-4">Storage Contents</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">LocalStorage Keys:</p>
              <div className="bg-gray-lighter p-3 rounded text-xs">
                {Object.keys(localStorage).length > 0 ? (
                  <ul className="space-y-1">
                    {Object.keys(localStorage).map((key) => (
                      <li key={key}>• {key}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray">Empty</p>
                )}
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">SessionStorage Keys:</p>
              <div className="bg-gray-lighter p-3 rounded text-xs">
                {Object.keys(sessionStorage).length > 0 ? (
                  <ul className="space-y-1">
                    {Object.keys(sessionStorage).map((key) => (
                      <li key={key}>• {key}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray">Empty</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
