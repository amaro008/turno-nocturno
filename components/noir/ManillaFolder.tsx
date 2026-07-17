import { cn } from '@/lib/ui/cn';

/** Folder de expediente que envuelve contenido, con pestaña y etiqueta a máquina. */
export default function ManillaFolder({
  label,
  children,
  className,
  tabSide = 'left',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  tabSide?: 'left' | 'center' | 'right';
}) {
  return (
    <div className={cn('noir-folder', className)}>
      <div className={cn('noir-folder-tab', `tab-${tabSide}`)}>
        <span className="font-typewriter noir-folder-label">{label}</span>
      </div>
      <div className="noir-folder-body texture-linen">{children}</div>
    </div>
  );
}
