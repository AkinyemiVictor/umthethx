import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, "..");
const nextBin = path.join(appDir, "node_modules", "next", "dist", "bin", "next");
const port = process.env.PORT?.trim() || "3000";

const runNext = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, ...args], {
      cwd: appDir,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`next ${args[0]} failed with exit code ${code ?? -1}`));
    });
  });

const ensureProductionBuild = async () => {
  const buildIdPath = path.join(appDir, ".next", "BUILD_ID");
  if (existsSync(buildIdPath)) {
    return;
  }
  throw new Error(
    [
      `Missing production build at ${buildIdPath}.`,
      "This service must be built during the Railway build phase, not during start.",
      "Check that the web service uses apps/web/railway.json and that its build command completes successfully.",
    ].join(" "),
  );
};

const start = async () => {
  await ensureProductionBuild();
  await runNext(["start", "--hostname", "0.0.0.0", "--port", port]);
};

start().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
