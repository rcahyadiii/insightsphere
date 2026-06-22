import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    // Di versi Next.js 15+ dan 16, allowedDevOrigins bukan berada di dalam experimental
    allowedDevOrigins: ["192.168.1.9", "localhost", "127.0.0.1"],
    devIndicators: false,
};

export default nextConfig
