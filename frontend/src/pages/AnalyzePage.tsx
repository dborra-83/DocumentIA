/**
 * Analyze page - Document upload and analysis
 * Main page for uploading documents and starting analysis
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentUploader } from '../components/DocumentUploader';
import { VerticalSelector } from '../components/VerticalSelector';
import { UploadProgress } from '../components/UploadProgress';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { uploadDocument } from '../services/uploadService';
import { useLanguage } from '../contexts/LanguageContext';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export const AnalyzePage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [vertical, setVertical] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verticalError, setVerticalError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
  };

  const handleVerticalChange = (value: string) => {
    setVertical(value);
    setVerticalError(null);
  };

  const handleUpload = async () => {
    // Validate inputs
    if (!selectedFile) {
      setError(t('analyze.error'));
      return;
    }

    if (!vertical) {
      setVerticalError(t('analyze.selectVertical'));
      return;
    }

    try {
      setError(null);
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Upload document
      const docId = await uploadDocument(
        selectedFile,
        vertical,
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      setDocumentId(docId);
      setUploadStatus('processing');
      
      // Simulate processing time (in real app, you'd poll for status)
      setTimeout(() => {
        setUploadStatus('complete');
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('error');
      setError(err instanceof Error ? err.message : t('analyze.error'));
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setVertical('');
    setUploadStatus('idle');
    setUploadProgress(0);
    setDocumentId(null);
    setError(null);
    setVerticalError(null);
  };

  const handleViewResults = () => {
    if (documentId) {
      navigate(`/history`); // Navigate to history where they can see the document
    }
  };

  const isUploading = uploadStatus === 'uploading' || uploadStatus === 'processing';
  const isComplete = uploadStatus === 'complete';

  return (
    <div className="container p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-dark mb-2">{t('analyze.title')}</h1>
        <p className="text-gray">
          {t('analyze.subtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isComplete && (
        <div className="mb-6">
          <Alert variant="success">
            {t('analyze.success')}
          </Alert>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-light p-6 mb-6">
        {/* File uploader */}
        {!selectedFile && uploadStatus === 'idle' && (
          <DocumentUploader
            onFileSelect={handleFileSelect}
            disabled={isUploading}
          />
        )}

        {/* Selected file info */}
        {selectedFile && uploadStatus === 'idle' && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-light border border-blue rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📄</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-dark">{selectedFile.name}</p>
                  <p className="text-sm text-gray">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                >
                  {t('common.edit')}
                </Button>
              </div>
            </div>

            <VerticalSelector
              value={vertical}
              onChange={handleVerticalChange}
              disabled={isUploading}
              error={verticalError || undefined}
            />

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={isUploading || !vertical}
                className="flex-1"
              >
                {t('analyze.uploadDocument')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isUploading}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {(uploadStatus === 'uploading' || uploadStatus === 'processing' || uploadStatus === 'complete') && selectedFile && (
          <div className="space-y-6">
            <UploadProgress
              percentage={uploadProgress}
              fileName={selectedFile.name}
              status={uploadStatus}
            />

            {isComplete && (
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleViewResults}
                  className="flex-1"
                >
                  {t('dashboard.viewHistory')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleReset}
                >
                  {t('analyze.uploadDocument')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error state with file selected */}
        {uploadStatus === 'error' && selectedFile && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-lg font-medium text-gray-dark mb-4">{t('analyze.error')}</p>
            <Button variant="primary" onClick={handleReset}>
              {t('common.back')}
            </Button>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="bg-blue-light rounded-lg p-6">
        <h2 className="font-bold text-gray-dark mb-3">{t('analyze.selectVertical')}</h2>
        <ol className="space-y-2 text-sm text-gray">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>{t('analyze.selectVerticalDesc')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>{t('analyze.supportedFormats')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>{t('analyze.processing')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>{t('history.viewAnalysis')}</span>
          </li>
        </ol>
      </div>
    </div>
  );
};
