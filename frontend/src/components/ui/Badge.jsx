/**
 * Badge – status / tag pill.
 * Props:
 * - variant?: 'green' | 'yellow' | 'blue' | 'purple' | 'red' | 'gray'
 * - status?: 'confirmed' | 'pending' | 'completed' | 'rejected' | 'cancelled' | 'active' | 'inactive'
 * - children: React.ReactNode
 */
const variantMap = {
  green:  'badge-green',
  yellow: 'badge-yellow',
  blue:   'badge-blue',
  purple: 'badge-purple',
  red:    'badge-red',
  gray:   'badge-gray',
}

const STATUS_VARIANTS = {
  confirmed: 'green',
  accepted:  'green',
  pending:   'yellow',
  completed: 'blue',
  rejected:  'red',
  declined:  'red',
  cancelled: 'gray',
  active:    'green',
  inactive:  'gray',
}

const getStatusVariant = (status) => STATUS_VARIANTS[status?.toLowerCase()] || 'gray'

const Badge = ({ variant, status, children }) => {
  const resolved = variant || (status ? getStatusVariant(status) : 'gray')
  return (
    <span className={variantMap[resolved] || variantMap.gray}>
      {children}
    </span>
  )
}

export default Badge
