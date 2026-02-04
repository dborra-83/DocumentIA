import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import type { DocumentRecord } from '../types';

export default function HistoryPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [loadingAnalysis, setLoadingAnalysis] = useState<Set<string>>(new Set());

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
    if (loadingAnalysis.has(documentId)) return;

    try {
      setLoadingAnalysis(prev => new Set(prev).add(documentId));
      const response = await apiService.get<DocumentRecord>(`/documents/${documentId}`);
      
      // Update the document in the list with the analysis
      setDocuments(prev => prev.map(doc => 
        doc.documentId === documentId 
          ? { 
              ...doc, 
              analysisResult: {
                executiveSummary: response.analysis?.executiveSummary,
                keyPoints: response.analysis?.keyPoints,
                nextSteps: response.analysis?.nextSteps,
                extractedData: response.analysis?.extractedData,
                metadata: response.analysis?.metadata
              }
            }
          : doc
      ));
    } catch (err: any) {
      console.error(`Error loading analysis for ${documentId}:`, err);
    } finally {
      setLoadingAnalysis(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
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

  const toggleDocument = (documentId: string) => {
    const isExpanded = expandedDocs.has(documentId);
    
    if (!isExpanded) {
      // Expanding - load analysis if not already loaded
      const doc = documents.find(d => d.documentId === documentId);
      if (doc && doc.status === 'completed' && !doc.analysisResult) {
        loadDocumentAnalysis(documentId);
      }
      setExpandedDocs(prev => new Set(prev).add(documentId));
    } else {
      // Collapsing
      setExpandedDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
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
          <p className="mt-4 text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading History</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={loadHistory}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Document History</h1>
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
          <p className="mt-2 text-gray-500">
            Upload your first document to see it here
          </p>
          <a
            href="/analyze"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Upload Document
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Document History</h1>
              <p className="text-gray-600">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'} analyzed
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="space-y-5">
          {documents.map((doc) => {
            const isExpanded = expandedDocs.has(doc.documentId);
            const isLoadingAnalysis = loadingAnalysis.has(doc.documentId);
            
            return (
              <div
                key={doc.documentId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* Document Header */}
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    {/* Left: Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        {/* File Icon */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        
                        {/* Document Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                            {doc.fileName}
                          </h3>
                          
                          {/* Metadata Tags */}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-medium capitalize">
                              {doc.vertical}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                              {doc.fileType.toUpperCase()}
                            </span>
                            <span className="text-gray-500">
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </span>
                            {doc.processingTimeMs && (
                              <span className="inline-flex items-center text-gray-500">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {(doc.processingTimeMs / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          
                          {/* Upload Date */}
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      {doc.status === 'completed' && (
                        <button
                          onClick={() => toggleDocument(doc.documentId)}
                          className="flex items-center space-x-1 px-4 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isExpanded ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            )}
                          </svg>
                          <span>{isExpanded ? 'Hide' : 'View'} Analysis</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Analysis Results Section */}
                {doc.status === 'completed' && isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {isLoadingAnalysis ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                        <p className="ml-4 text-gray-600 font-medium">Loading analysis...</p>
                      </div>
                    ) : doc.analysisResult ? (
                      <div className="p-6 space-y-6">
                        {/* Executive Summary */}
                        {doc.analysisResult.executiveSummary && (
                          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h5 className="text-base font-semibold text-gray-900">Executive Summary</h5>
                            </div>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {doc.analysisResult.executiveSummary}
                            </p>
                          </div>
                        )}

                        {/* Key Points */}
                        {doc.analysisResult.keyPoints && doc.analysisResult.keyPoints.length > 0 && (
                          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                              </div>
                              <h5 className="text-base font-semibold text-gray-900">Key Points</h5>
                            </div>
                            <ul className="space-y-3">
                              {doc.analysisResult.keyPoints.map((point, idx) => (
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
                        {doc.analysisResult.nextSteps && doc.analysisResult.nextSteps.length > 0 && (
                          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                              <h5 className="text-base font-semibold text-gray-900">Next Steps</h5>
                            </div>
                            <ul className="space-y-3">
                              {doc.analysisResult.nextSteps.map((step, idx) => (
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
                        {doc.analysisResult.extractedData && Object.keys(doc.analysisResult.extractedData).some(key => {
                          const data = doc.analysisResult.extractedData as any;
                          return data[key] && (Array.isArray(data[key]) ? data[key].length > 0 : true);
                        }) && (
                          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                              </div>
                              <h5 className="text-base font-semibold text-gray-900">Datos Extraídos</h5>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Nombres de Personas */}
                              {doc.analysisResult.extractedData.nombres_personas && doc.analysisResult.extractedData.nombres_personas.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">👤 Personas</h6>
                                  <div className="flex flex-wrap gap-2">
                                    {doc.analysisResult.extractedData.nombres_personas.map((nombre, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {nombre}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Nombres de Empresas */}
                              {doc.analysisResult.extractedData.nombres_empresas && doc.analysisResult.extractedData.nombres_empresas.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">🏢 Empresas</h6>
                                  <div className="flex flex-wrap gap-2">
                                    {doc.analysisResult.extractedData.nombres_empresas.map((empresa, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                        {empresa}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Fechas Importantes */}
                              {doc.analysisResult.extractedData.fechas_importantes && doc.analysisResult.extractedData.fechas_importantes.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-3">📅 Fechas Importantes</h6>
                                  <div className="space-y-2">
                                    {doc.analysisResult.extractedData.fechas_importantes.map((fecha, idx) => (
                                      <div key={idx} className="flex items-start gap-3 bg-white rounded p-3">
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                                          {fecha.fecha}
                                        </span>
                                        <span className="text-gray-700 text-sm flex-1">
                                          {fecha.descripcion}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Valores Monetarios */}
                              {doc.analysisResult.extractedData.valores_monetarios && doc.analysisResult.extractedData.valores_monetarios.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-3">💰 Valores Monetarios</h6>
                                  <div className="space-y-2">
                                    {doc.analysisResult.extractedData.valores_monetarios.map((valor, idx) => (
                                      <div key={idx} className="flex items-start gap-3 bg-white rounded p-3">
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-bold">
                                          {valor.moneda} {valor.monto}
                                        </span>
                                        <span className="text-gray-700 text-sm flex-1">
                                          {valor.concepto}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Ubicaciones */}
                              {doc.analysisResult.extractedData.ubicaciones && doc.analysisResult.extractedData.ubicaciones.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">📍 Ubicaciones</h6>
                                  <div className="flex flex-wrap gap-2">
                                    {doc.analysisResult.extractedData.ubicaciones.map((ubicacion, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                        {ubicacion}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Emails */}
                              {doc.analysisResult.extractedData.emails && doc.analysisResult.extractedData.emails.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">📧 Emails</h6>
                                  <div className="space-y-1">
                                    {doc.analysisResult.extractedData.emails.map((email, idx) => (
                                      <div key={idx} className="text-sm text-gray-700 font-mono">
                                        {email}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Teléfonos */}
                              {doc.analysisResult.extractedData.telefonos && doc.analysisResult.extractedData.telefonos.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">📞 Teléfonos</h6>
                                  <div className="space-y-1">
                                    {doc.analysisResult.extractedData.telefonos.map((telefono, idx) => (
                                      <div key={idx} className="text-sm text-gray-700 font-mono">
                                        {telefono}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Números de Referencia */}
                              {doc.analysisResult.extractedData.numeros_referencia && doc.analysisResult.extractedData.numeros_referencia.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">🔢 Números de Referencia</h6>
                                  <div className="flex flex-wrap gap-2">
                                    {doc.analysisResult.extractedData.numeros_referencia.map((ref, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-gray-200 text-gray-800 rounded font-mono text-sm">
                                        {ref}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Download JSON Button */}
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => downloadJSON(doc)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet to-pink text-white rounded-lg hover:from-violet/90 hover:to-pink/90 transition-all shadow-md hover:shadow-lg font-medium"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Descargar JSON</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium">No analysis results available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Section */}
                {doc.status === 'failed' && doc.errorMessage && (
                  <div className="border-t border-gray-200 p-6">
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-red-800 font-semibold mb-1">Processing Error</p>
                          <p className="text-red-700 text-sm">{doc.errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
