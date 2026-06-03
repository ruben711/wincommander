/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Geen execution-backend nodig — alles client-side via pattern-matching.
  // Uncomment voor static export (GitHub Pages e.d.):
  // output: 'export',
  // images: { unoptimized: true },
};
module.exports = nextConfig;
