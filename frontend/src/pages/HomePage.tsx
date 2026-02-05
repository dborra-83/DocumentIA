/**
 * Home Page - Landing page explaining the service
 */

import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export const HomePage = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-light via-white to-blue-light">
      {/* Header with language selector */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-bright-blue to-turquoise rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-navy-dark">Document Analysis</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'es'
                      ? 'bg-white text-navy-dark shadow-sm'
                      : 'text-gray-600 hover:text-navy-dark'
                  }`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-white text-navy-dark shadow-sm'
                      : 'text-gray-600 hover:text-navy-dark'
                  }`}
                >
                  EN
                </button>
              </div>
              <Link
                to="/login"
                className="px-4 py-2 text-bright-blue hover:text-turquoise font-medium transition-colors"
              >
                {t('login.title')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-bright-blue hover:bg-turquoise text-white rounded-lg font-medium transition-colors"
              >
                {t('register.title')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-navy-dark mb-6">
            {t('home.hero.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-bright-blue to-turquoise text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
            >
              {t('home.hero.cta')}
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-navy-dark border-2 border-navy-dark rounded-lg font-semibold text-lg hover:bg-navy-dark hover:text-white transition-all"
            >
              {t('home.hero.login')}
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Feature 1: AI-Powered */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-bright-blue to-turquoise rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-dark mb-3">{t('home.features.ai.title')}</h3>
            <p className="text-gray-600">{t('home.features.ai.description')}</p>
          </div>

          {/* Feature 2: Security */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-turquoise to-violet rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-dark mb-3">{t('home.features.security.title')}</h3>
            <p className="text-gray-600">{t('home.features.security.description')}</p>
          </div>

          {/* Feature 3: Private Environment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-violet to-pink rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-dark mb-3">{t('home.features.private.title')}</h3>
            <p className="text-gray-600">{t('home.features.private.description')}</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 mb-20">
          <h3 className="text-3xl font-bold text-navy-dark text-center mb-12">{t('home.howItWorks.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-bright-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-bold text-navy-dark mb-2">{t('home.howItWorks.step1.title')}</h4>
              <p className="text-sm text-gray-600">{t('home.howItWorks.step1.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-turquoise text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-bold text-navy-dark mb-2">{t('home.howItWorks.step2.title')}</h4>
              <p className="text-sm text-gray-600">{t('home.howItWorks.step2.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-violet text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-bold text-navy-dark mb-2">{t('home.howItWorks.step3.title')}</h4>
              <p className="text-sm text-gray-600">{t('home.howItWorks.step3.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-bold text-navy-dark mb-2">{t('home.howItWorks.step4.title')}</h4>
              <p className="text-sm text-gray-600">{t('home.howItWorks.step4.description')}</p>
            </div>
          </div>
        </div>

        {/* Security & Privacy Section */}
        <div className="bg-gradient-to-br from-navy-blue to-navy-dark rounded-2xl shadow-lg p-12 text-white mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-4">{t('home.security.title')}</h3>
            <p className="text-xl text-gray-300 mb-8">{t('home.security.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="font-bold mb-2">🔒 {t('home.security.feature1.title')}</h4>
                <p className="text-sm text-gray-300">{t('home.security.feature1.description')}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="font-bold mb-2">☁️ {t('home.security.feature2.title')}</h4>
                <p className="text-sm text-gray-300">{t('home.security.feature2.description')}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="font-bold mb-2">🛡️ {t('home.security.feature3.title')}</h4>
                <p className="text-sm text-gray-300">{t('home.security.feature3.description')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-navy-dark mb-4">{t('home.cta.title')}</h3>
          <p className="text-xl text-gray-600 mb-8">{t('home.cta.subtitle')}</p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-gradient-to-r from-bright-blue to-turquoise text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
          >
            {t('home.cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            {t('home.footer.powered')} <span className="text-bright-blue font-semibold">Amazon Bedrock</span> & <span className="text-turquoise font-semibold">AWS</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            © 2026 Document Analysis. {t('home.footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
};
