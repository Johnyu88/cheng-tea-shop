import type { NextConfig } from "next";
const config: NextConfig = { serverExternalPackages: ["better-auth", "@better-auth/passkey"], poweredByHeader: false };
export default config;
