/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/book',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;