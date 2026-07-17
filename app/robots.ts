import type { MetadataRoute } from 'next';

// Bloquea del indexado las zonas privadas; el resto (landing, catálogo) es público.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/s/', '/mi-biblioteca/', '/api/'],
    },
  };
}
