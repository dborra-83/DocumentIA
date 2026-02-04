/**
 * Vertical selector component
 * Dropdown for selecting document vertical/industry
 */

import React from 'react';

export interface Vertical {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const VERTICALS: Vertical[] = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical records, patient data, clinical notes',
    icon: '🏥',
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Academic papers, course materials, research',
    icon: '🎓',
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Sales reports, inventory, customer feedback',
    icon: '🛒',
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Contracts, legal briefs, case documents',
    icon: '⚖️',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial reports, statements, analysis',
    icon: '💰',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production reports, quality control, specs',
    icon: '🏭',
  },
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'Employee records, policies, performance reviews',
    icon: '👥',
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Technical docs, specifications, architecture',
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
  return (
    <div className="w-full">
      <label htmlFor="vertical" className="block mb-2 font-medium">
        Document Type
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
        <option value="">Select a document type...</option>
        {VERTICALS.map((vertical) => (
          <option key={vertical.id} value={vertical.id}>
            {vertical.icon} {vertical.name} - {vertical.description}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red">{error}</p>}
    </div>
  );
};
