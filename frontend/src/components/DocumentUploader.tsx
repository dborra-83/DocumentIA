/**
 * Document uploader component with drag-and-drop
 * Main component for file upload functionality
 */

import React, { useState, useRef } from 'react';
import { validateFile } from '../utils/fileValidation';

interface DocumentUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  accept?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onFileSelect,
  disabled = false,
  accept = '.pdf,.docx,.txt',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file
    const validation = await validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Pass file to parent
    onFileSelect(file);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'border-blue bg-blue-light' : 'border-gray-light bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue hover:bg-blue-light'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl">📄</div>
          <div>
            <p className="text-lg font-medium text-gray-dark mb-1">
              {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
            </p>
            <p className="text-sm text-gray">or click to browse</p>
          </div>
          <div className="text-xs text-gray">
            <p>Supported formats: PDF, DOCX, TXT</p>
            <p>Maximum size: 10MB</p>
            <p>Maximum PDF pages: 100</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-light border border-red rounded-lg">
          <p className="text-sm text-red font-medium">❌ {error}</p>
        </div>
      )}
    </div>
  );
};
