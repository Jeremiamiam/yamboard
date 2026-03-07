import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Node.js runtime required for Anthropic SDK (Phase 2)
  // Do NOT add experimental.runtime = 'edge' here

  // Exclude Node.js-native packages from Turbopack bundling — let Node resolve at runtime
  serverExternalPackages: ["pdf-parse"],
}

export default nextConfig
