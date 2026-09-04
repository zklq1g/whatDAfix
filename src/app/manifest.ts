import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'whatDAfix | Civic Accountability Engine',
    short_name: 'whatDAfix',
    description: 'Cryptographic Proof-of-Work for Civic Governance',
    start_url: '/',
    display: 'standalone',
    background_color: '#050A0F',
    theme_color: '#050A0F',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
