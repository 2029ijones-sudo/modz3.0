const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  webpack: (config) => {
    // Extend resolve configuration with ONLY your existing folders
    config.resolve.alias = {
      ...config.resolve.alias,
      // ====================================
      // YOUR EXACT FOLDER STRUCTURE ALIASES
      // ====================================
      
      // '@' for components folder (root level .jsx files)
      '@': path.resolve(__dirname, 'components'),
      
      // '#' for app folder and its subfolders
      '#': path.resolve(__dirname, 'app'),
      
      // '~' for lib folder
      '~': path.resolve(__dirname, 'lib'),
      
      // '$' for public folder
      '$': path.resolve(__dirname, 'public'),
      
      // ====================================
      // APP FOLDER SUB-ALIASES (your exact structure)
      // ====================================
      
      // '@auth' for app/auth
      '@auth': path.resolve(__dirname, 'app/auth'),
      
      // '@profile' for app/profile  
      '@profile': path.resolve(__dirname, 'app/profile'),
      
      // ====================================
      // API SUB-ALIASES (your exact API structure)
      // ====================================
      
      // '@api' for app/api
      '@api': path.resolve(__dirname, 'app/api'),
      
      // Specific API endpoints you mentioned
      '@api/community': path.resolve(__dirname, 'app/api/community'),
      '@api/execute': path.resolve(__dirname, 'app/api/execute'),
      '@api/mods': path.resolve(__dirname, 'app/api/mods'),
      '@api/profile': path.resolve(__dirname, 'app/api/profile'),
      '@api/world': path.resolve(__dirname, 'app/api/world'),
      
      // '@api/profile/check-username' special case
      '@api/profile/check-username': path.resolve(__dirname, 'app/api/profile/check-username'),
      
      // ====================================
      // PUBLIC SUB-ALIASES
      // ====================================
      
      // '$styles' for public/styles
      '$styles': path.resolve(__dirname, 'public/styles'),
    };
    
    return config;
  },
  
  experimental: {
    esmExternals: true,
  },
  
  images: {
    domains: [],
  },
  
  productionBrowserSourceMaps: true,
  
  // ✅ ADD THIS - Maintenance mode rewrite
  async rewrites() {
    const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    if (maintenanceMode) {
      return [
        {
          source: '/:path*',
          destination: '/maintenance.html',
        },
      ];
    }
    
    return [];
  },
};

module.exports = nextConfig;
