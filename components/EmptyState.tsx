// Estado vacío con ilustración simple + mensaje amigable.
type IllKind = 'folder' | 'search' | 'suspects' | 'audio' | 'video' | 'notes';

function Illustration({ kind }: { kind: IllKind }) {
  const common = {
    width: 56,
    height: 56,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (kind) {
    case 'search':
      return (<svg {...common}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
    case 'suspects':
      return (<svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6h5M16 10h5M16 14h3" /></svg>);
    case 'audio':
      return (<svg {...common}><path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2" /></svg>);
    case 'video':
      return (<svg {...common}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="m10 9 5 3-5 3z" /></svg>);
    case 'notes':
      return (<svg {...common}><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h6" /></svg>);
    default:
      return (<svg {...common}><path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H3z" /><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2" /></svg>);
  }
}

export default function EmptyState({
  title,
  message,
  ill = 'folder',
}: {
  title: string;
  message: string;
  ill?: IllKind;
}) {
  return (
    <div className="empty-state">
      <span className="es-ill"><Illustration kind={ill} /></span>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
