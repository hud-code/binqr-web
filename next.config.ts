import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure webpack to ignore the mobile app directory
  webpack: (config, { dev, isServer }) => {
    // Exclude mobile app directory from module resolution
    config.resolve.modules = config.resolve.modules || [];
    config.resolve.modules = config.resolve.modules.filter(
      (module: string) => !module.includes('binqr-mobile')
    );
    
    // Add fallback to prevent mobile imports from being resolved
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-navigation/native': false,
      '@react-navigation/stack': false,
      '@react-navigation/bottom-tabs': false,
      'react-native': false,
    };
    
    return config;
  },
};

export default nextConfig;
