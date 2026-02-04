/**
 * Upload progress component
 * Shows upload progress with percentage and visual bar
 */

import React from 'react';

interface UploadProgressProps {
  percentage: number;
  fileName: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  percentage,
  fileName,
  status,
  error,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue';
      case 'complete':
        return 'bg-green';
      case 'error':
        return 'bg-red';
      default:
        return 'bg-gray';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Complete!';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return '⏳';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '';
    }
  };

  return (
    <div className="w-full p-4 border border-gray-light rounded-lg bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <p className="font-medium text-gray-dark">{fileName}</p>
            <p className="text-sm text-gray">{getStatusText()}</p>
          </div>
        </div>
        <span className="text-lg font-bold text-gray-dark">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-lighter rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-2 bg-red-light rounded text-sm text-red">
          {error}
        </div>
      )}
    </div>
  );
};
