/**
 * Admin Page - Configuration and white-label settings
 */

import React, { useState } from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { useLanguage } from '../contexts/LanguageContext';

type TabType = 'general' | 'branding' | 'limits';

export const AdminPage: React.FC = () => {
  const { config, updateConfig, resetConfig } = useBranding();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('branding');
  const [formData, setFormData] = useState(config);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logoUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // If there's a new logo, update the preview URL
      if (logoPreview && logoPreview !== config.logoUrl) {
        updateConfig({ ...formData, logoUrl: logoPreview });
      } else {
        updateConfig(formData);
      }

      setSaveMessage('Configuración guardada exitosamente');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm(t('admin.resetConfirm'))) {
      resetConfig();
      setFormData({
        appName: 'DocumentIA',
        appTagline: 'AI-Powered Document Analysis',
        logoUrl: null,
        primaryColor: '#008FD0',
        secondaryColor: '#0A1732',
      });
      setLogoPreview(null);
      setLogoFile(null);
      setSaveMessage(t('admin.resetSuccess'));
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: t('admin.general'), icon: '⚙️' },
    { id: 'branding' as TabType, label: t('admin.branding'), icon: '🎨' },
    { id: 'limits' as TabType, label: t('admin.limits'), icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-light to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-dark mb-2">{t('admin.title')}</h1>
          <p className="text-gray-600">{t('admin.subtitle')}</p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.includes('Error') || saveMessage.includes('error')
              ? 'bg-coral/10 text-coral border border-coral/20' 
              : 'bg-turquoise/10 text-turquoise border border-turquoise/20'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-bright-blue text-bright-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-navy-dark mb-4">{t('admin.general')}</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.language')}
                  </label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bright-blue focus:border-transparent"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.timezone')}
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bright-blue focus:border-transparent">
                    <option>America/Argentina/Buenos_Aires (GMT-3)</option>
                    <option>America/New_York (GMT-5)</option>
                    <option>Europe/Madrid (GMT+1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.dateFormat')}
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bright-blue focus:border-transparent">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-navy-dark mb-4">{t('admin.branding')}</h2>
                
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.logo')}
                  </label>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-white p-2"
                        />
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-block px-4 py-2 bg-bright-blue text-white rounded-lg hover:bg-turquoise transition-colors cursor-pointer"
                      >
                        {t('admin.selectLogo')}
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        {language === 'es' 
                          ? 'Formatos: PNG, JPG, SVG. Tamaño recomendado: 200x200px'
                          : 'Formats: PNG, JPG, SVG. Recommended size: 200x200px'
                        }
                      </p>
                      {logoPreview && (
                        <button
                          onClick={() => {
                            setLogoPreview(null);
                            setLogoFile(null);
                          }}
                          className="text-sm text-coral hover:text-coral/80 mt-2"
                        >
                          {t('admin.removeLogo')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* App Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.appName')}
                  </label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => handleInputChange('appName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bright-blue focus:border-transparent"
                    placeholder="DocumentIA"
                  />
                </div>

                {/* App Tagline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.tagline')}
                  </label>
                  <input
                    type="text"
                    value={formData.appTagline}
                    onChange={(e) => handleInputChange('appTagline', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bright-blue focus:border-transparent"
                    placeholder="AI-Powered Document Analysis"
                  />
                </div>

                {/* Preview */}
                <div className="mt-8 p-6 bg-gradient-to-br from-navy-blue to-navy-dark rounded-lg">
                  <p className="text-sm text-gray-400 mb-3">{t('admin.headerPreview')}</p>
                  <div className="flex items-center space-x-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-bright-blue to-turquoise rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <span className="text-xl font-bold text-white">{formData.appName}</span>
                      <p className="text-sm text-gray-400">{formData.appTagline}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Limits Tab */}
            {activeTab === 'limits' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-navy-dark mb-4">{t('admin.limits')}</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.maxFileSize')}
                  </label>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bright-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.maxPDFPages')}
                  </label>
                  <input
                    type="number"
                    defaultValue={50}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bright-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.docsPerMonth')}
                  </label>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bright-blue focus:border-transparent"
                  />
                </div>

                <div className="mt-6 p-4 bg-sky-light rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>{language === 'es' ? 'Nota:' : 'Note:'}</strong> {language === 'es' 
                      ? 'Los límites se aplicarán a todos los usuarios de la aplicación.'
                      : 'Limits will apply to all application users.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('admin.reset')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-bright-blue text-white rounded-lg hover:bg-turquoise transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('admin.saving') : t('admin.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
