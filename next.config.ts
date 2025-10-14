import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compress: true, // Enable gzip compression for responses

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
