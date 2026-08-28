import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // browsers otherwise sniff response bodies and can execute a
          // file as a different content-type than the server declared
          { key: "X-Content-Type-Options", value: "nosniff" },
          // blocks the page being framed on another origin (clickjacking)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
