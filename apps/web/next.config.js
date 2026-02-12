import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });
dotenv.config({ path: path.join(repoRoot, ".env"), override: true });

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Railway containers can report high CPU counts, which causes excessive
    // build workers and OOM during page data collection.
    cpus: 2,
  },
};

export default nextConfig;
