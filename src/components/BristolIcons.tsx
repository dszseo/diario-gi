// Iconos esquemáticos de la escala de Bristol (1–7).
const C = 'var(--stool)'

export function BristolIcon({ type }: { type: number }) {
  const common = { class: 'bristol-icon', viewBox: '0 0 58 44', xmlns: 'http://www.w3.org/2000/svg' }
  switch (type) {
    case 1:
      return (
        <svg {...common}>
          <circle cx="18" cy="22" r="6" fill={C} />
          <circle cx="32" cy="20" r="6.5" fill={C} />
          <circle cx="44" cy="24" r="5.5" fill={C} />
        </svg>
      )
    case 2:
      return (
        <svg {...common}>
          <rect x="8" y="14" width="42" height="16" rx="8" fill={C} />
          <circle cx="18" cy="22" r="9" fill={C} />
          <circle cx="30" cy="22" r="9" fill={C} />
          <circle cx="42" cy="22" r="9" fill={C} />
        </svg>
      )
    case 3:
      return (
        <svg {...common}>
          <rect x="6" y="16" width="46" height="12" rx="6" fill={C} />
          <path d="M16 16v12M26 16v12M36 16v12M44 16v12" stroke="var(--surface)" stroke-width="2" />
        </svg>
      )
    case 4:
      return (
        <svg {...common}>
          <rect x="5" y="17" width="48" height="10" rx="5" fill={C} />
        </svg>
      )
    case 5:
      return (
        <svg {...common}>
          <circle cx="16" cy="18" r="7" fill={C} />
          <circle cx="30" cy="24" r="8" fill={C} />
          <circle cx="44" cy="17" r="6" fill={C} />
          <circle cx="38" cy="30" r="5" fill={C} />
        </svg>
      )
    case 6:
      return (
        <svg {...common}>
          <path
            d="M10 24c2-6 8-8 12-5s6 1 10-2 10-1 12 4-2 10-8 10-10-1-14 0-14-1-12-7z"
            fill={C}
          />
        </svg>
      )
    case 7:
      return (
        <svg {...common}>
          <path d="M6 20c8 0 8 6 16 6s8-6 16-6 8 6 14 6v6H6z" fill={C} opacity="0.55" />
          <path d="M6 26c8 0 8 4 16 4s8-4 16-4 8 4 14 4v2H6z" fill={C} />
        </svg>
      )
    default:
      return <svg {...common} />
  }
}
