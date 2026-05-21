/**
 * Card — base white card with standard shadow and border.
 *
 * Props:
 *   className   extra Tailwind classes
 *   padding     'md' (default, p-6) | 'sm' (p-4) | 'none'
 *   children
 */
const PADDING = {
  md:   'p-6',
  sm:   'p-4',
  none: '',
}

export default function Card({ className = '', padding = 'md', children }) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${PADDING[padding]} ${className}`}
    >
      {children}
    </div>
  )
}
