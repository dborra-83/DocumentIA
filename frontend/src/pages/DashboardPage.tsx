/**
 * Dashboard Page - Overview and statistics
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { StatsCard } from '../components/dashboard/StatsCard';
import type { DocumentRecord } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export default function DashboardPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get<{ documents: DocumentRecord[] }>('/documents');
      setDocuments(response.documents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalDocuments = documents.length;
  const completedDocuments = documents.filter(d => d.status === 'completed').length;
  const processingDocuments = documents.filter(d => d.status === 'processing').length;
  const failedDocuments = documents.filter(d => d.status === 'failed').length;

  // Calculate average processing time
  const completedWithTime = documents.filter(d => d.status === 'completed' && d.processingTimeMs);
  const avgProcessingTime = completedWithTime.length > 0
    ? completedWithTime.reduce((sum, d) => sum + (d.processingTimeMs || 0), 0) / completedWithTime.length / 1000
    : 0;

  // Get most used vertical
  const verticalCounts: Record<string, number> = {};
  documents.forEach(d => {
    verticalCounts[d.vertical] = (verticalCounts[d.vertical] || 0) + 1;
  });
  const topVertical = Object.entries(verticalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Recent documents (last 5)
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sky-light">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-bright-blue border-t-transparent"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sky-light p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-l-4 border-coral rounded-lg p-6">
            <h3 className="text-coral font-semibold text-lg mb-2">{t('dashboard.error')}</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-4 px-4 py-2 bg-bright-blue text-white rounded-lg hover:bg-turquoise transition-colors"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-light to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy-dark mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.uploadFirst')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={t('dashboard.totalDocuments')}
            value={totalDocuments}
            icon={
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="blue"
          />
          <StatsCard
            title={t('dashboard.completed')}
            value={completedDocuments}
            icon={
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="turquoise"
          />
          <StatsCard
            title={t('dashboard.avgProcessingTime')}
            value={`${avgProcessingTime.toFixed(1)}s`}
            icon={
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="violet"
          />
          <StatsCard
            title={t('dashboard.favoriteVertical')}
            value={topVertical.charAt(0).toUpperCase() + topVertical.slice(1)}
            icon={
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            color="pink"
          />
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy-dark">{t('dashboard.statusOverview')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-turquoise rounded-full"></div>
                  <span className="text-sm text-gray-600">{t('dashboard.completed')}</span>
                </div>
                <span className="text-sm font-semibold text-navy-dark">{completedDocuments}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-bright-blue rounded-full"></div>
                  <span className="text-sm text-gray-600">{t('dashboard.processing')}</span>
                </div>
                <span className="text-sm font-semibold text-navy-dark">{processingDocuments}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-coral rounded-full"></div>
                  <span className="text-sm text-gray-600">{t('dashboard.failed')}</span>
                </div>
                <span className="text-sm font-semibold text-navy-dark">{failedDocuments}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-gradient-to-br from-navy-blue to-navy-dark rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/analyze"
                className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                <div className="w-10 h-10 bg-bright-blue rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">{t('dashboard.uploadDocument')}</p>
                  <p className="text-xs text-gray-300">{t('analyze.subtitle')}</p>
                </div>
              </Link>
              <Link
                to="/history"
                className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                <div className="w-10 h-10 bg-turquoise rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">{t('dashboard.viewHistory')}</p>
                  <p className="text-xs text-gray-300">{t('history.subtitle')}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-navy-dark">{t('dashboard.recentActivity')}</h3>
            <Link to="/history" className="text-sm text-bright-blue hover:text-turquoise font-medium">
              {t('dashboard.viewHistory')} →
            </Link>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">{t('dashboard.noDocuments')}</p>
              <Link
                to="/analyze"
                className="inline-block px-6 py-3 bg-bright-blue text-white rounded-lg hover:bg-turquoise transition-colors font-medium"
              >
                {t('dashboard.uploadDocument')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.documentId}
                  className="flex items-center justify-between p-4 bg-sky-light/30 rounded-lg hover:bg-sky-light/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-bright-blue to-turquoise rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy-dark truncate">{doc.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleString()} • {doc.vertical}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      doc.status === 'completed'
                        ? 'bg-turquoise/10 text-turquoise'
                        : doc.status === 'processing'
                        ? 'bg-bright-blue/10 text-bright-blue'
                        : 'bg-coral/10 text-coral'
                    }`}
                  >
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
