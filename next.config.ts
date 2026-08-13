import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de los sitios de cliente (config.imagenes) — hoy solo Unsplash,
    // vía el seed de demo. El asset builder real (Tarea 3.3) puede requerir
    // ampliar esto a otros hosts.
    remotePatterns: [{ hostname: 'images.unsplash.com' }],
  },
};

export default nextConfig;
