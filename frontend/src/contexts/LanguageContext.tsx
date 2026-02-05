/**
 * Language Context - Manages application language and translations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = {
  es: {
    // Header
    'header.dashboard': 'Dashboard',
    'header.analyze': 'Analizar',
    'header.history': 'Historial',
    'header.admin': 'Admin',
    'header.logout': 'Cerrar Sesión',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalDocuments': 'Total Documentos',
    'dashboard.completed': 'Completados',
    'dashboard.avgProcessingTime': 'Tiempo Promedio',
    'dashboard.favoriteVertical': 'Vertical Favorito',
    'dashboard.statusOverview': 'Estado General',
    'dashboard.processing': 'En Proceso',
    'dashboard.failed': 'Fallidos',
    'dashboard.quickActions': 'Acciones Rápidas',
    'dashboard.uploadDocument': 'Subir Documento',
    'dashboard.viewHistory': 'Ver Historial',
    'dashboard.recentActivity': 'Actividad Reciente',
    'dashboard.noDocuments': 'No hay documentos todavía',
    'dashboard.uploadFirst': 'Sube tu primer documento para comenzar',
    'dashboard.loading': 'Cargando métricas...',
    'dashboard.error': 'Error al cargar métricas',
    
    // Analyze Page
    'analyze.title': 'Analizar Documento',
    'analyze.subtitle': 'Sube un documento para análisis con IA',
    'analyze.selectVertical': 'Selecciona una Vertical',
    'analyze.selectVerticalDesc': 'Elige la industria que mejor describe tu documento',
    'analyze.uploadDocument': 'Subir Documento',
    'analyze.dragDrop': 'Arrastra y suelta tu archivo aquí, o haz clic para seleccionar',
    'analyze.supportedFormats': 'Formatos soportados: PDF, DOCX, TXT (máx. 10MB)',
    'analyze.uploading': 'Subiendo...',
    'analyze.processing': 'Procesando documento...',
    'analyze.success': 'Documento subido exitosamente',
    'analyze.error': 'Error al subir documento',
    
    // History Page
    'history.title': 'Historial de Documentos',
    'history.subtitle': 'Revisa tus documentos analizados',
    'history.search': 'Buscar documentos...',
    'history.filterByVertical': 'Filtrar por vertical',
    'history.allVerticals': 'Todas las verticales',
    'history.fileName': 'Nombre del Archivo',
    'history.vertical': 'Vertical',
    'history.uploadDate': 'Fecha de Subida',
    'history.status': 'Estado',
    'history.actions': 'Acciones',
    'history.viewAnalysis': 'Ver Análisis',
    'history.noDocuments': 'No se encontraron documentos',
    'history.loading': 'Cargando documentos...',
    'history.executiveSummary': 'Resumen Ejecutivo',
    'history.keyPoints': 'Puntos Clave',
    'history.nextSteps': 'Próximos Pasos',
    'history.extractedData': 'Datos Extraídos',
    'history.downloadJSON': 'Descargar JSON',
    'history.close': 'Cerrar',
    'history.delete': 'Eliminar',
    'history.deleteConfirm': '¿Estás seguro de que quieres eliminar este documento?',
    'history.deleteSuccess': 'Documento eliminado exitosamente',
    'history.deleteError': 'Error al eliminar documento',
    'history.deleting': 'Eliminando...',
    
    // Admin Page
    'admin.title': 'Configuración',
    'admin.subtitle': 'Personaliza tu aplicación y ajusta la configuración',
    'admin.general': 'General',
    'admin.branding': 'Marca Blanca',
    'admin.limits': 'Límites',
    'admin.language': 'Idioma',
    'admin.timezone': 'Zona Horaria',
    'admin.dateFormat': 'Formato de Fecha',
    'admin.logo': 'Logo de la Aplicación',
    'admin.selectLogo': 'Seleccionar Logo',
    'admin.removeLogo': 'Eliminar logo',
    'admin.appName': 'Nombre de la Aplicación',
    'admin.tagline': 'Tagline / Descripción',
    'admin.headerPreview': 'Vista Previa del Header',
    'admin.maxFileSize': 'Tamaño Máximo de Archivo (MB)',
    'admin.maxPDFPages': 'Número Máximo de Páginas (PDF)',
    'admin.docsPerMonth': 'Documentos por Mes',
    'admin.reset': 'Restablecer',
    'admin.save': 'Guardar Cambios',
    'admin.saving': 'Guardando...',
    'admin.saveSuccess': 'Configuración guardada exitosamente',
    'admin.saveError': 'Error al guardar la configuración',
    'admin.resetConfirm': '¿Estás seguro de que quieres restablecer la configuración por defecto?',
    'admin.resetSuccess': 'Configuración restablecida',
    
    // Login Page
    'login.title': 'Iniciar Sesión',
    'login.subtitle': 'Accede a tu cuenta',
    'login.email': 'Correo Electrónico',
    'login.password': 'Contraseña',
    'login.submit': 'Iniciar Sesión',
    'login.noAccount': '¿No tienes cuenta?',
    'login.register': 'Regístrate',
    'login.error': 'Error al iniciar sesión',
    'login.emailRequired': 'El correo electrónico es requerido',
    'login.emailInvalid': 'Formato de correo electrónico inválido',
    'login.passwordRequired': 'La contraseña es requerida',
    'login.passwordMin': 'La contraseña debe tener al menos 8 caracteres',
    'login.rememberMe': 'Recordarme',
    'login.forgotPassword': '¿Olvidaste tu contraseña?',
    'login.signIn': 'Iniciar Sesión',
    'login.appTitle': 'Análisis de Documentos',
    'login.appSubtitle': 'Análisis de documentos con IA de Amazon Bedrock',
    
    // Register Page
    'register.title': 'Crear Cuenta',
    'register.subtitle': 'Regístrate para comenzar',
    'register.email': 'Correo Electrónico',
    'register.password': 'Contraseña',
    'register.confirmPassword': 'Confirmar Contraseña',
    'register.submit': 'Registrarse',
    'register.hasAccount': '¿Ya tienes cuenta?',
    'register.login': 'Inicia sesión',
    'register.error': 'Error al registrarse',
    'register.emailRequired': 'El correo electrónico es requerido',
    'register.emailInvalid': 'Formato de correo electrónico inválido',
    'register.passwordRequired': 'La contraseña es requerida',
    'register.passwordMin': 'La contraseña debe tener al menos 8 caracteres',
    'register.passwordLowercase': 'La contraseña debe contener al menos una letra minúscula',
    'register.passwordUppercase': 'La contraseña debe contener al menos una letra mayúscula',
    'register.passwordNumber': 'La contraseña debe contener al menos un número',
    'register.passwordSpecial': 'La contraseña debe contener al menos un carácter especial (!@#$%^&*)',
    'register.confirmRequired': 'Por favor confirma tu contraseña',
    'register.passwordsNoMatch': 'Las contraseñas no coinciden',
    'register.success': '¡Registro Exitoso!',
    'register.successMessage': 'Tu cuenta ha sido creada. Por favor revisa tu correo electrónico para obtener un código de verificación. Serás redirigido a la página de confirmación en breve.',
    'register.goToConfirm': 'Ir a confirmación ahora',
    'register.createAccount': 'Crear cuenta',
    'register.appTitle': 'Análisis de Documentos',
    'register.appSubtitle': 'Comienza a analizar documentos con IA',
    'register.termsAgree': 'Acepto los',
    'register.termsService': 'Términos de Servicio',
    'register.and': 'y',
    'register.privacyPolicy': 'Política de Privacidad',
    'register.passwordRequirements': 'Requisitos de Contraseña:',
    'register.req1': 'Al menos 8 caracteres',
    'register.req2': 'Contiene letra mayúscula (A-Z)',
    'register.req3': 'Contiene letra minúscula (a-z)',
    'register.req4': 'Contiene número (0-9)',
    'register.req5': 'Contiene carácter especial (!@#$%^&*)',
    'register.helperText': 'Debe tener al menos 8 caracteres con mayúscula, minúscula, número y carácter especial',
    
    // Verticals
    'vertical.healthcare': 'Salud',
    'vertical.education': 'Educación',
    'vertical.retail': 'Retail',
    'vertical.legal': 'Legal',
    'vertical.finance': 'Finanzas',
    'vertical.manufacturing': 'Manufactura',
    'vertical.hr': 'Recursos Humanos',
    'vertical.technology': 'Tecnología',
    
    // Status
    'status.pending': 'Pendiente',
    'status.processing': 'Procesando',
    'status.completed': 'Completado',
    'status.failed': 'Fallido',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.save': 'Guardar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    
    // Document Uploader
    'uploader.dragDrop': 'Arrastra y suelta tu archivo aquí',
    'uploader.dropHere': 'Suelta tu archivo aquí',
    'uploader.orClick': 'o haz clic para seleccionar',
    'uploader.supportedFormats': 'Formatos soportados: PDF, DOCX, TXT',
    'uploader.maxSize': 'Tamaño máximo: 10MB',
    'uploader.maxPages': 'Máximo de páginas PDF: 100',
    
    // Home Page
    'home.hero.title': 'Análisis Inteligente de Documentos con IA',
    'home.hero.subtitle': 'Procesa y analiza tus documentos de forma segura con inteligencia artificial de Amazon Bedrock. Tu información permanece privada en tu entorno AWS.',
    'home.hero.cta': 'Comenzar Ahora',
    'home.hero.login': 'Iniciar Sesión',
    
    'home.features.ai.title': 'Potenciado por IA',
    'home.features.ai.description': 'Utiliza Amazon Bedrock con Claude 3 para análisis profundo de documentos, extracción de datos y generación de insights.',
    'home.features.security.title': 'Máxima Seguridad',
    'home.features.security.description': 'Tus documentos nunca salen de tu infraestructura AWS. Autenticación con Cognito y encriptación en reposo y tránsito.',
    'home.features.private.title': 'Entorno Privado',
    'home.features.private.description': 'Infraestructura dedicada en tu cuenta AWS. Control total sobre tus datos sin compartir con terceros.',
    
    'home.howItWorks.title': '¿Cómo Funciona?',
    'home.howItWorks.step1.title': 'Sube tu Documento',
    'home.howItWorks.step1.description': 'Carga archivos PDF, DOCX o TXT de forma segura',
    'home.howItWorks.step2.title': 'Selecciona el Tipo',
    'home.howItWorks.step2.description': 'Elige la industria para análisis especializado',
    'home.howItWorks.step3.title': 'IA Procesa',
    'home.howItWorks.step3.description': 'Amazon Bedrock analiza y extrae información',
    'home.howItWorks.step4.title': 'Obtén Resultados',
    'home.howItWorks.step4.description': 'Recibe resumen, puntos clave y datos extraídos',
    
    'home.security.title': 'Seguridad y Privacidad Garantizadas',
    'home.security.subtitle': 'Tu información está protegida con los más altos estándares de seguridad de AWS',
    'home.security.feature1.title': 'Datos Privados',
    'home.security.feature1.description': 'Tus documentos permanecen en tu cuenta AWS, nunca se comparten',
    'home.security.feature2.title': 'Infraestructura AWS',
    'home.security.feature2.description': 'Aprovecha la seguridad y confiabilidad de Amazon Web Services',
    'home.security.feature3.title': 'Cumplimiento',
    'home.security.feature3.description': 'Cumple con estándares de seguridad y privacidad internacionales',
    
    'home.cta.title': '¿Listo para Comenzar?',
    'home.cta.subtitle': 'Crea tu cuenta y empieza a analizar documentos en minutos',
    'home.cta.button': 'Crear Cuenta Gratis',
    
    'home.footer.powered': 'Potenciado por',
    'home.footer.rights': 'Todos los derechos reservados.',
    
    // Confirm Email Page
    'confirm.title': 'Confirma tu Correo',
    'confirm.subtitle': 'Ingresa el código de verificación enviado a tu correo',
    'confirm.email': 'Correo Electrónico',
    'confirm.code': 'Código de Verificación',
    'confirm.submit': 'Confirmar Correo',
    'confirm.resend': '¿No recibiste el código? Reenviar',
    'confirm.sending': 'Enviando...',
    'confirm.backToLogin': 'Volver al inicio de sesión',
    'confirm.success': '¡Correo Confirmado!',
    'confirm.successMessage': 'Tu correo ha sido verificado exitosamente. Redirigiendo al inicio de sesión...',
    'confirm.resendSuccess': '¡Código de verificación reenviado exitosamente! Revisa tu correo.',
    'confirm.codePlaceholder': '123456',
  },
  en: {
    // Header
    'header.dashboard': 'Dashboard',
    'header.analyze': 'Analyze',
    'header.history': 'History',
    'header.admin': 'Admin',
    'header.logout': 'Logout',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalDocuments': 'Total Documents',
    'dashboard.completed': 'Completed',
    'dashboard.avgProcessingTime': 'Avg Processing Time',
    'dashboard.favoriteVertical': 'Favorite Vertical',
    'dashboard.statusOverview': 'Status Overview',
    'dashboard.processing': 'Processing',
    'dashboard.failed': 'Failed',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.uploadDocument': 'Upload Document',
    'dashboard.viewHistory': 'View History',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.noDocuments': 'No documents yet',
    'dashboard.uploadFirst': 'Upload your first document to get started',
    'dashboard.loading': 'Loading metrics...',
    'dashboard.error': 'Error loading metrics',
    
    // Analyze Page
    'analyze.title': 'Analyze Document',
    'analyze.subtitle': 'Upload a document for AI analysis',
    'analyze.selectVertical': 'Select a Vertical',
    'analyze.selectVerticalDesc': 'Choose the industry that best describes your document',
    'analyze.uploadDocument': 'Upload Document',
    'analyze.dragDrop': 'Drag and drop your file here, or click to select',
    'analyze.supportedFormats': 'Supported formats: PDF, DOCX, TXT (max. 10MB)',
    'analyze.uploading': 'Uploading...',
    'analyze.processing': 'Processing document...',
    'analyze.success': 'Document uploaded successfully',
    'analyze.error': 'Error uploading document',
    
    // History Page
    'history.title': 'Document History',
    'history.subtitle': 'Review your analyzed documents',
    'history.search': 'Search documents...',
    'history.filterByVertical': 'Filter by vertical',
    'history.allVerticals': 'All verticals',
    'history.fileName': 'File Name',
    'history.vertical': 'Vertical',
    'history.uploadDate': 'Upload Date',
    'history.status': 'Status',
    'history.actions': 'Actions',
    'history.viewAnalysis': 'View Analysis',
    'history.noDocuments': 'No documents found',
    'history.loading': 'Loading documents...',
    'history.executiveSummary': 'Executive Summary',
    'history.keyPoints': 'Key Points',
    'history.nextSteps': 'Next Steps',
    'history.extractedData': 'Extracted Data',
    'history.downloadJSON': 'Download JSON',
    'history.close': 'Close',
    'history.delete': 'Delete',
    'history.deleteConfirm': 'Are you sure you want to delete this document?',
    'history.deleteSuccess': 'Document deleted successfully',
    'history.deleteError': 'Error deleting document',
    'history.deleting': 'Deleting...',
    
    // Admin Page
    'admin.title': 'Settings',
    'admin.subtitle': 'Customize your application and adjust settings',
    'admin.general': 'General',
    'admin.branding': 'White Label',
    'admin.limits': 'Limits',
    'admin.language': 'Language',
    'admin.timezone': 'Timezone',
    'admin.dateFormat': 'Date Format',
    'admin.logo': 'Application Logo',
    'admin.selectLogo': 'Select Logo',
    'admin.removeLogo': 'Remove logo',
    'admin.appName': 'Application Name',
    'admin.tagline': 'Tagline / Description',
    'admin.headerPreview': 'Header Preview',
    'admin.maxFileSize': 'Maximum File Size (MB)',
    'admin.maxPDFPages': 'Maximum PDF Pages',
    'admin.docsPerMonth': 'Documents per Month',
    'admin.reset': 'Reset',
    'admin.save': 'Save Changes',
    'admin.saving': 'Saving...',
    'admin.saveSuccess': 'Settings saved successfully',
    'admin.saveError': 'Error saving settings',
    'admin.resetConfirm': 'Are you sure you want to reset to default settings?',
    'admin.resetSuccess': 'Settings reset',
    
    // Login Page
    'login.title': 'Sign In',
    'login.subtitle': 'Access your account',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Sign In',
    'login.noAccount': "Don't have an account?",
    'login.register': 'Sign up',
    'login.error': 'Error signing in',
    'login.emailRequired': 'Email is required',
    'login.emailInvalid': 'Invalid email format',
    'login.passwordRequired': 'Password is required',
    'login.passwordMin': 'Password must be at least 8 characters',
    'login.rememberMe': 'Remember me',
    'login.forgotPassword': 'Forgot password?',
    'login.signIn': 'Sign in',
    'login.appTitle': 'Document Analysis',
    'login.appSubtitle': 'AI-powered document insights with Amazon Bedrock',
    
    // Register Page
    'register.title': 'Create Account',
    'register.subtitle': 'Sign up to get started',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm Password',
    'register.submit': 'Sign Up',
    'register.hasAccount': 'Already have an account?',
    'register.login': 'Sign in',
    'register.error': 'Error signing up',
    'register.emailRequired': 'Email is required',
    'register.emailInvalid': 'Invalid email format',
    'register.passwordRequired': 'Password is required',
    'register.passwordMin': 'Password must be at least 8 characters',
    'register.passwordLowercase': 'Password must contain at least one lowercase letter',
    'register.passwordUppercase': 'Password must contain at least one uppercase letter',
    'register.passwordNumber': 'Password must contain at least one number',
    'register.passwordSpecial': 'Password must contain at least one special character (!@#$%^&*)',
    'register.confirmRequired': 'Please confirm your password',
    'register.passwordsNoMatch': 'Passwords do not match',
    'register.success': 'Registration Successful!',
    'register.successMessage': 'Your account has been created. Please check your email for a verification code. You will be redirected to the confirmation page shortly.',
    'register.goToConfirm': 'Go to confirmation now',
    'register.createAccount': 'Create account',
    'register.appTitle': 'Document Analysis',
    'register.appSubtitle': 'Start analyzing documents with AI',
    'register.termsAgree': 'I agree to the',
    'register.termsService': 'Terms of Service',
    'register.and': 'and',
    'register.privacyPolicy': 'Privacy Policy',
    'register.passwordRequirements': 'Password Requirements:',
    'register.req1': 'At least 8 characters long',
    'register.req2': 'Contains uppercase letter (A-Z)',
    'register.req3': 'Contains lowercase letter (a-z)',
    'register.req4': 'Contains number (0-9)',
    'register.req5': 'Contains special character (!@#$%^&*)',
    'register.helperText': 'Must be at least 8 characters with uppercase, lowercase, number, and special character',
    
    // Verticals
    'vertical.healthcare': 'Healthcare',
    'vertical.education': 'Education',
    'vertical.retail': 'Retail',
    'vertical.legal': 'Legal',
    'vertical.finance': 'Finance',
    'vertical.manufacturing': 'Manufacturing',
    'vertical.hr': 'Human Resources',
    'vertical.technology': 'Technology',
    
    // Status
    'status.pending': 'Pending',
    'status.processing': 'Processing',
    'status.completed': 'Completed',
    'status.failed': 'Failed',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.save': 'Save',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    
    // Document Uploader
    'uploader.dragDrop': 'Drag and drop your file here',
    'uploader.dropHere': 'Drop your file here',
    'uploader.orClick': 'or click to browse',
    'uploader.supportedFormats': 'Supported formats: PDF, DOCX, TXT',
    'uploader.maxSize': 'Maximum size: 10MB',
    'uploader.maxPages': 'Maximum PDF pages: 100',
    
    // Home Page
    'home.hero.title': 'Intelligent Document Analysis with AI',
    'home.hero.subtitle': 'Process and analyze your documents securely with Amazon Bedrock AI. Your information stays private in your AWS environment.',
    'home.hero.cta': 'Get Started',
    'home.hero.login': 'Sign In',
    
    'home.features.ai.title': 'AI-Powered',
    'home.features.ai.description': 'Uses Amazon Bedrock with Claude 3 for deep document analysis, data extraction, and insight generation.',
    'home.features.security.title': 'Maximum Security',
    'home.features.security.description': 'Your documents never leave your AWS infrastructure. Cognito authentication and encryption at rest and in transit.',
    'home.features.private.title': 'Private Environment',
    'home.features.private.description': 'Dedicated infrastructure in your AWS account. Full control over your data without sharing with third parties.',
    
    'home.howItWorks.title': 'How It Works',
    'home.howItWorks.step1.title': 'Upload Document',
    'home.howItWorks.step1.description': 'Securely upload PDF, DOCX, or TXT files',
    'home.howItWorks.step2.title': 'Select Type',
    'home.howItWorks.step2.description': 'Choose industry for specialized analysis',
    'home.howItWorks.step3.title': 'AI Processes',
    'home.howItWorks.step3.description': 'Amazon Bedrock analyzes and extracts information',
    'home.howItWorks.step4.title': 'Get Results',
    'home.howItWorks.step4.description': 'Receive summary, key points, and extracted data',
    
    'home.security.title': 'Security and Privacy Guaranteed',
    'home.security.subtitle': 'Your information is protected with the highest AWS security standards',
    'home.security.feature1.title': 'Private Data',
    'home.security.feature1.description': 'Your documents stay in your AWS account, never shared',
    'home.security.feature2.title': 'AWS Infrastructure',
    'home.security.feature2.description': 'Leverage Amazon Web Services security and reliability',
    'home.security.feature3.title': 'Compliance',
    'home.security.feature3.description': 'Meets international security and privacy standards',
    
    'home.cta.title': 'Ready to Get Started?',
    'home.cta.subtitle': 'Create your account and start analyzing documents in minutes',
    'home.cta.button': 'Create Free Account',
    
    'home.footer.powered': 'Powered by',
    'home.footer.rights': 'All rights reserved.',
    
    // Confirm Email Page
    'confirm.title': 'Confirm Your Email',
    'confirm.subtitle': 'Enter the verification code sent to your email',
    'confirm.email': 'Email Address',
    'confirm.code': 'Verification Code',
    'confirm.submit': 'Confirm Email',
    'confirm.resend': "Didn't receive the code? Resend",
    'confirm.sending': 'Sending...',
    'confirm.backToLogin': 'Back to login',
    'confirm.success': 'Email Confirmed!',
    'confirm.successMessage': 'Your email has been verified successfully. Redirecting to login...',
    'confirm.resendSuccess': 'Verification code resent successfully! Check your email.',
    'confirm.codePlaceholder': '123456',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['es']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
