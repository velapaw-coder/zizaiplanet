import type { NextConfig } from "next";
import { APK_DOWNLOAD_URL } from "./lib/downloads";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/downloads/zizaiplanet.apk",
        destination: APK_DOWNLOAD_URL,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
