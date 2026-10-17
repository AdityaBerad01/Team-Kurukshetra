/**
 * Avatar – color-graded luxury user avatar with radiant gradient initials fallback.
 * Props: name (string), initials (string), size ('sm'|'md'|'lg'|'xl')
 */
const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-2xl',
}

const gradientPalette = [
  'bg-gradient-to-tr from-primary-700 via-primary-600 to-indigo-400 text-white shadow-primary-600/20',
  'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-300 text-white shadow-emerald-600/20',
  'bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 text-white shadow-amber-600/20',
  'bg-gradient-to-tr from-rose-700 via-rose-600 to-pink-300 text-white shadow-rose-600/20',
  'bg-gradient-to-tr from-sky-700 via-sky-600 to-cyan-300 text-white shadow-sky-600/20',
  'bg-gradient-to-tr from-violet-800 via-purple-600 to-indigo-300 text-white shadow-purple-600/20',
]

const getGradient = (name = '') => gradientPalette[name.charCodeAt(0) % gradientPalette.length]

const Avatar = ({ name = '', initials, size = 'md' }) => {
  const letters = initials || name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className={`${sizeMap[size]} ${getGradient(name)} rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-md ring-2 ring-white/90 select-none`}
    >
      <span className="drop-shadow-sm">{letters}</span>
    </div>
  )
}

export default Avatar
