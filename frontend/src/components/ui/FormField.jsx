/**
 * FormField – Reusable form input wrapper with label, error message, and helper text.
 *
 * Props:
 * - label?: string
 * - error?: string
 * - helper?: string
 * - required?: boolean
 * - id?: string
 * - children: React.ReactNode (usually input, select, or textarea)
 */
export const FormField = ({
  label,
  error,
  helper,
  required = false,
  id,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="label flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {helper && !error && <p className="text-xs text-gray-400">{helper}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

/**
 * Input – Styled text input with automatic error state styling.
 */
export const Input = ({ error, className = '', ...props }) => {
  return (
    <input
      className={`input ${error ? 'input-error' : ''} ${className}`}
      {...props}
    />
  )
}

/**
 * Textarea – Styled textarea with automatic error state styling.
 */
export const Textarea = ({ error, className = '', ...props }) => {
  return (
    <textarea
      className={`input resize-none ${error ? 'input-error' : ''} ${className}`}
      {...props}
    />
  )
}

/**
 * Select – Styled select with automatic error state styling.
 */
export const Select = ({ error, className = '', children, ...props }) => {
  return (
    <select
      className={`input ${error ? 'input-error' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export default FormField
