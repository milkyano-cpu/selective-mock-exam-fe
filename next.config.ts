import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cache client-side navigations so revisiting pages is instant.
    // static: pages keep their cache for 5 minutes
    // dynamic: pages keep their cache for 30 seconds (avoids stale data)
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
};

export default nextConfig;
