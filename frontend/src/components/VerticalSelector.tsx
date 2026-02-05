/**
 * Vertical selector component
 * Dropdown for selecting document vertical/industry
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export interface Vertical {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
}

export const VERTICALS: Vertical[] = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    nameEs: 'Salud',
    description: 'Medical records, patient data, clinical notes',
    descriptionEs: 'Historias clínicas, datos de pacientes, notas médicas',
    icon: '🏥',
  },
  {
    id: 'education',
    name: 'Education',
    nameEs: 'Educación',
    description: 'Academic papers, course materials, research',
    descriptionEs: 'Documentos académicos, materiales de curso, investigación',
    icon: '🎓',
  },
  {
    id: 'retail',
    name: 'Retail',
    nameEs: 'Comercio',
    description: 'Sales reports, inventory, customer feedback',
    descriptionEs: 'Reportes de ventas, inventario, feedback de clientes',
    icon: '🛒',
  },
  {
    id: 'legal',
    name: 'Legal',
    nameEs: 'Legal',
    description: 'Contracts, legal briefs, case documents',
    descriptionEs: 'Contratos, escritos legales, documentos de casos',
    icon: '⚖️',
  },
  {
    id: 'finance',
    name: 'Finance',
    nameEs: 'Finanzas',
    description: 'Financial reports, statements, analysis',
    descriptionEs: 'Reportes financieros, estados de cuenta, análisis',
    icon: '💰',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    nameEs: 'Manufactura',
    description: 'Production reports, quality control, specs',
    descriptionEs: 'Reportes de producción, control de calidad, especificaciones',
    icon: '🏭',
  },
  {
    id: 'hr',
    name: 'Human Resources',
    nameEs: 'Recursos Humanos',
    description: 'Employee records, policies, performance reviews',
    descriptionEs: 'Registros de empleados, políticas, evaluaciones de desempeño',
    icon: '👥',
  },
  {
    id: 'technology',
    name: 'Technology',
    nameEs: 'Tecnología',
    description: 'Technical docs, specifications, architecture',
    descriptionEs: 'Documentación técnica, especificaciones, arquitectura',
    icon: '💻',
  },
];

interface VerticalSelectorProps {
  value: string;
  onChange: (vertical: string) => void;
  disabled?: boolean;
  error?: string;
}

export const VerticalSelector: React.FC<VerticalSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const { language } = useLanguage();
  const isSpanish = language === 'es';

  return (
    <div className="w-full">
      <label htmlFor="vertical" className="block mb-2 font-medium">
        {isSpanish ? 'Tipo de Documento' : 'Document Type'}
      </label>
      <select
        id="vertical"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-lg focus-outline ${
          error ? 'border-red' : 'border-gray-light'
        } ${disabled ? 'bg-gray-lighter cursor-not-allowed' : 'bg-white'}`}
      >
        <option value="">
          {isSpanish ? 'Selecciona un tipo de documento...' : 'Select a document type...'}
        </option>
        {VERTICALS.map((vertical) => (
          <option key={vertical.id} value={vertical.id}>
            {vertical.icon} {isSpanish ? vertical.nameEs : vertical.name} - {isSpanish ? vertical.descriptionEs : vertical.description}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red">{error}</p>}
    </div>
  );
};
