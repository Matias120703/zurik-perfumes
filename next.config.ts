import type { NextConfig } from "next";

/**
 * Hostname derivado de NEXT_PUBLIC_SUPABASE_URL (no hardcodeado): cada
 * cliente de Somapp Commerce Engine tiene su propio proyecto de Supabase
 * (ver CLAUDE.md, sección 2), así que este archivo no debe llevar el
 * project ref de RegiShop -- se resuelve solo desde el .env.local de cada
 * deploy, sin que el onboarding de un cliente nuevo tenga que tocar esto.
 */
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
