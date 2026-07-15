#!/usr/bin/env node
import { config } from "dotenv";
config({ path: ".env.local" });

import { runTemplatePipeline } from "./render/template-pipeline.js";
import { log } from "./utils/logger.js";

async function main() {
  const args = process.argv.slice(2);
  const brandArg = args.find((a) => a.startsWith("--brand="));
  const scriptPath = args.find((a) => !a.startsWith("--"));
  if (!scriptPath) {
    console.error("Usage: npm run pipeline -- <path/to/script.json> [--brand=<id>]");
    process.exit(2);
  }
  try {
    // Single pipeline: vendored HyperFrames templates (renderer "hyperframes").
    await runTemplatePipeline(scriptPath, {
      brandOverride: brandArg?.slice("--brand=".length),
    });
  } catch (e) {
    log.error("Pipeline failed", e);
    process.exit(1);
  }
}

main();
