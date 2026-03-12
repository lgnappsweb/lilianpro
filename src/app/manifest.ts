
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LilianPro',
    short_name: 'LilianPro',
    description: 'Controle de Vendas Elite para Revendedoras',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#C2185B',
    icons: [
      {
        src: 'https://placehold.co/192x192/C2185B/white?text=LP',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/C2185B/white?text=LP',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
