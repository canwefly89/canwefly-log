import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "#site/content": "./.velite",
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "#site/content": path.resolve(process.cwd(), ".velite"),
    };
    return config;
  },
};

export default nextConfig;
