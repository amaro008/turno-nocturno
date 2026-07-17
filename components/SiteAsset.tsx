// ============================================================================
// <SiteAsset slot="landing.hero" /> — resuelve un slot contra la BD (cache RSC)
// y renderiza la imagen firmada con next/image. Fallback: gradiente elegante.
// Server Component: NUNCA lo importes en componentes cliente.
// ============================================================================

import Image from 'next/image';
import { resolveAsset } from '@/lib/server/site-assets';
import GradientPlaceholder from './GradientPlaceholder';

export default async function SiteAsset({
  slot,
  sizes = '100vw',
  priority = false,
  className,
  fallbackLabel,
}: {
  slot: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fallbackLabel?: string;
}) {
  const { url, alt } = await resolveAsset(slot);
  return (
    <div className={'siteasset' + (className ? ' ' + className : '')}>
      {url ? (
        <Image src={url} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} unoptimized />
      ) : (
        <GradientPlaceholder seed={slot} label={fallbackLabel} />
      )}
    </div>
  );
}
