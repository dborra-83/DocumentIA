import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import type { DocumentRecord } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export default function HistoryPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get<{ documents: DocumentRecord[] }>('/documents');
      setDocuments(response.documents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentAnalysis = async (documentId: string) => {
    if (loadingAnalysis) return null;

    try {
      setLoadingAnalysis(true);
      const response = await apiService.get<DocumentRecord>(`/documents/${documentId}`);
      
      // Map analysis to analysisResult for consistency
      const analysisData = response.analysis || response.analysisResult;
      
      const updatedDoc = {
        ...response,
        analysisResult: analysisData
      };
      
      // Update the document in the list with the analysis
      setDocuments(prev => prev.map(doc => 
        doc.documentId === documentId 
          ? updatedDoc
          : doc
      ));
      
      return updatedDoc;
    } catch (err: any) {
      console.error(`Error loading analysis for ${documentId}:`, err);
      return null;
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm(t('history.deleteConfirm'))) {
      return;
    }

    try {
      setDeletingId(documentId);
      await apiService.delete(`/documents/${documentId}`);
      
      // Remove document from list
      setDocuments(prev => prev.filter(doc => doc.documentId !== documentId));
      
      // Close modal if deleted doc was selected
      if (selectedDoc?.documentId === documentId) {
        setSelectedDoc(null);
      }
      
      console.log(t('history.deleteSuccess'));
    } catch (err: any) {
      console.error('Error deleting document:', err);
      alert(t('history.deleteError') + ': ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewAnalysis = async (doc: DocumentRecord) => {
    // Load analysis FIRST if not already loaded
    if (doc.status === 'completed' && !doc.analysisResult && !doc.analysis) {
      const loadedDoc = await loadDocumentAnalysis(doc.documentId);
      if (loadedDoc) {
        setSelectedDoc(loadedDoc);
      } else {
        // If loading failed, still show modal with original doc
        setSelectedDoc(doc);
      }
    } else {
      // Analysis already loaded, just open modal
      const docWithAnalysis = {
        ...doc,
        analysisResult: doc.analysisResult || doc.analysis
      };
      setSelectedDoc(docWithAnalysis);
    }
  };

  const downloadJSON = (doc: DocumentRecord) => {
    const jsonData = {
      documentId: doc.documentId,
      fileName: doc.fileName,
      vertical: doc.vertical,
      uploadedAt: doc.uploadedAt,
      analysis: doc.analysisResult
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.fileName.replace(/\.[^/.]+$/, '')}_analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{t('history.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">{t('dashboard.error')}</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={loadHistory}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">{t('history.title')}</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('history.noDocuments')}</h3>
          <p className="mt-2 text-gray-500">{t('dashboard.uploadFirst')}</p>
          <a
            href="/analyze"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('dashboard.uploadDocument')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('history.title')}</h1>
              <p className="text-gray-600">
                {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vertical
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.documentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {doc.fileName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {doc.fileType.toUpperCase()} • {(doc.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">
                            {doc.userEmail ? doc.userEmail.substring(0, 2).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.userEmail || doc.userId || 'Usuario'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                        {doc.vertical}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {doc.status === 'completed' && (
                          <button
                            onClick={() => handleViewAnalysis(doc)}
                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                            title={t('history.viewAnalysis')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.documentId)}
                          disabled={deletingId === doc.documentId}
                          className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title={t('history.delete')}
                        >
                          {deletingId === doc.documentId ? (
                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analysis Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedDoc.fileName}</h3>
                  <p className="text-sm text-blue-100">{selectedDoc.vertical} • {formatDate(selectedDoc.uploadedAt)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {loadingAnalysis ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="ml-4 text-gray-600 font-medium">{t('history.loading')}</p>
                </div>
              ) : selectedDoc.analysisResult ? (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  {selectedDoc.analysisResult.executiveSummary && (
                    <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h5 className="text-base font-semibold text-gray-900">{t('history.executiveSummary')}</h5>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedDoc.analysisResult.executiveSummary}
                      </p>
                    </div>
                  )}

                  {/* Key Points */}
                  {selectedDoc.analysisResult.keyPoints && selectedDoc.analysisResult.keyPoints.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <h5 className="text-base font-semibold text-gray-900">{t('history.keyPoints')}</h5>
                      </div>
                      <ul className="space-y-2">
                        {selectedDoc.analysisResult.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-gray-700 leading-relaxed flex-1">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Steps */}
                  {selectedDoc.analysisResult.nextSteps && selectedDoc.analysisResult.nextSteps.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-5 border border-amber-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                        <h5 className="text-base font-semibold text-gray-900">{t('history.nextSteps')}</h5>
                      </div>
                      <ul className="space-y-2">
                        {selectedDoc.analysisResult.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-gray-700 leading-relaxed flex-1">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Extracted Data */}
                  {selectedDoc.analysisResult?.extractedData && Object.keys(selectedDoc.analysisResult.extractedData).some(key => {
                    const data = selectedDoc.analysisResult?.extractedData as any;
                    return data[key] && (Array.isArray(data[key]) ? data[key].length > 0 : true);
                  }) && (
                    <div className="bg-violet-50 rounded-lg p-5 border border-violet-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <h5 className="text-base font-semibold text-gray-900">{t('history.extractedData')}</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Nombres de Personas */}
                        {selectedDoc.analysisResult.extractedData.nombres_personas && selectedDoc.analysisResult.extractedData.nombres_personas.length > 0 && (
                          <div className="bg-white rounded-lg p-3">
                            <h6 className="text-xs font-semibold text-gray-700 mb-2">👤 Personas</h6>
                            <div className="flex flex-wrap gap-1">
                              {selectedDoc.analysisResult.extractedData.nombres_personas.map((nombre, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {nombre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nombres de Empresas */}
                        {selectedDoc.analysisResult.extractedData.nombres_empresas && selectedDoc.analysisResult.extractedData.nombres_empresas.length > 0 && (
                          <div className="bg-white rounded-lg p-3">
                            <h6 className="text-xs font-semibold text-gray-700 mb-2">🏢 Empresas</h6>
                            <div className="flex flex-wrap gap-1">
                              {selectedDoc.analysisResult.extractedData.nombres_empresas.map((empresa, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                                  {empresa}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fechas Importantes */}
                        {selectedDoc.analysisResult.extractedData.fechas_importantes && selectedDoc.analysisResult.extractedData.fechas_importantes.length > 0 && (
                          <div className="bg-white rounded-lg p-3 md:col-span-2">
                            <h6 className="text-xs font-semibold text-gray-700 mb-2">📅 Fechas Importantes</h6>
                            <div className="space-y-1">
                              {selectedDoc.analysisResult.extractedData.fechas_importantes.map((fecha, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-medium">
                                    {fecha.fecha}
                                  </span>
                                  <span className="text-gray-700 flex-1">
                                    {fecha.descripcion}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Valores Monetarios */}
                        {selectedDoc.analysisResult.extractedData.valores_monetarios && selectedDoc.analysisResult.extractedData.valores_monetarios.length > 0 && (
                          <div className="bg-white rounded-lg p-3 md:col-span-2">
                            <h6 className="text-xs font-semibold text-gray-700 mb-2">💰 Valores Monetarios</h6>
                            <div className="space-y-1">
                              {selectedDoc.analysisResult.extractedData.valores_monetarios.map((valor, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-bold">
                                    {valor.moneda} {valor.monto}
                                  </span>
                                  <span className="text-gray-700 flex-1">
                                    {valor.concepto}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">No hay resultados de análisis disponibles</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t('history.close')}
              </button>
              {selectedDoc.analysisResult && (
                <button
                  onClick={() => downloadJSON(selectedDoc)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{t('history.downloadJSON')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
