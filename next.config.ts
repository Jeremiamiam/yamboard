import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Réduit le cache HTML en prod pour éviter UnrecognizedActionError après déploiement
  ...(process.env.NODE_ENV === "production" && {
    async headers() {
      return [
        {
          source: "/((?!_next/static|_next/image|favicon).*)",
          headers: [
            { key: "Cache-Control", value: "private, no-store, must-revalidate" },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
