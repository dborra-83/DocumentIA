import { ReactNode } from 'react'

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

export const Alert = ({ children, variant = 'info', onClose }: AlertProps) => {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  const iconStyles = {
    info: '🔵',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]} flex items-start gap-3`}>
      <span className="text-xl">{iconStyles[variant]}</span>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 font-bold text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  )
}
