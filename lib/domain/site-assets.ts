// Slots de assets del sitio (fuente de verdad para seed, admin y defaults).

export interface SiteAssetRow {
  slot: string;
  title: string;
  description: string;
  image_path: string | null;
  alt_text: string;
  updated_at: string;
}

/** Sección legible a partir del slot (para filtrar en el admin). */
export function sectionForSlot(slot: string): string {
  if (slot.includes('how_step')) return 'Cómo funciona';
  if (slot.includes('testimonial')) return 'Testimonios';
  const prefix = slot.split('.')[0];
  switch (prefix) {
    case 'landing':
      return 'Landing';
    case 'como_funciona':
      return 'Cómo funciona';
    case 'catalog':
      return 'Catálogo';
    case 'about':
      return 'Nosotros';
    default:
      return 'Otros';
  }
}

export const ASSET_SECTIONS = ['Landing', 'Cómo funciona', 'Testimonios', 'Catálogo', 'Otros'];
