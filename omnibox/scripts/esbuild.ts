/// <reference lib="deno.ns" />

import { copy, ensureDir } from "jsr:@std/fs";
import { build, stop } from "npm:esbuild";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

const SRC_DIR = "./src";
const DIST_DIR = "./dist";
const ASSETS_DIR = "./assets";

const shouldMinify = Deno.args.includes("--minify");

const initializeDist = async () => await ensureDir(DIST_DIR);

const copyAssets = async () => {
  for await (const entry of Deno.readDir(ASSETS_DIR)) {
    const srcPath = `${ASSETS_DIR}/${entry.name}`;
    const destPath = `${DIST_DIR}/${entry.name}`;
    await copy(srcPath, destPath, { overwrite: true });
  }
};

const bundleWithEsbuild = async () => {
  console.info(`Starting esbuild bundle (minify: ${shouldMinify})...`);
  try {
    const result = await build({
      plugins: [...denoPlugins()],
      entryPoints: [
        `${SRC_DIR}/background.ts`,
        `${SRC_DIR}/content_script.ts`
      ],
      outdir: DIST_DIR,
      bundle: true,
      minify: shouldMinify,
      platform: "browser",
      target: ["esnext"],
    });

    if (result.errors.length > 0) {
      throw new Error(`Build failed with errors: ${result.errors}`);
    }
    console.info("Build completed with esbuild.");
  } catch (err) {
    console.error("Esbuild failed:", err);
    Deno.exit(1);
  } finally {
    await stop();
  }
}

const main = async () => {
  await initializeDist();
  await copyAssets();
  await bundleWithEsbuild();
};

main().catch((err) => console.error("Build failed:", err.message));
