import { spawn } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const port = process.env.PORT || "3000";
const args = ["dev", "--port", port, "--webpack"];

const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: "inherit",
  env: { ...process.env, NEXT_DISABLE_TURBOPACK: "1" },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
